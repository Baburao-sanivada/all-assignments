const bodyParser = require('body-parser');
const jwt=require("jsonwebtoken")
const express = require('express');
const app = express();
const mongoose=require("mongoose");
app.use(express.json());

var Admin_secret="secret1";
var User_secret="Secret2";

const Admin_schema=mongoose.Schema({
  username:String,
  password:String
})
const User_schema=mongoose.Schema({
  username:String,
  password:String,
  purchased_courses:[{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }]
})
const Courses_Schema=mongoose.Schema({
  title:String,
  description:String,
  price:Number,
  imageLink:String,
  published:Boolean
})
//Creating Models
const Admin=mongoose.model("Admin",Admin_schema);
const User=mongoose.model("User",User_schema);
const Course=mongoose.model("Course",Courses_Schema);
mongoose.connect("mongodb+srv://babulocal1166:1234@cluster0.1xnv8sc.mongodb.net/Course_Selling",{ useNewUrlParser: true, useUnifiedTopology: true, dbName: "Course_Selling" });

//Admin Authentication
function Admin_Authentication(req,res,next){
  var hash_code=req.headers.authorization.split(" ")[1];
  var username=false
  jwt.verify(hash_code,Admin_secret,(err,data)=>{
    username=data
  })
  if(username){
    next();
  }
  else{
    res.status(404).send({Message:"Invalid Credentials"})
  }
}
// Admin routes
app.post('/admin/signup',async (req, res) => {
  // logic to sign up admin
  const {username,password}=req.body;
  const find_admin=await Admin.findOne({username});
  if(find_admin){
    res.status(404).send({Message:"Admin Already Sent"});
  }
  else{
    const newAdmin=new Admin({username,password});
    await newAdmin.save();
    const hash_code=jwt.sign(username,Admin_secret);
    res.send({Message:"Admin Created Successfully",jwt_token:hash_code});
  }
});

app.post('/admin/login', async (req, res) => {
  // logic to log in admin
  var {username,password}=req.headers;
  var find_admin=await Admin.findOne({username,password});
  if(find_admin){
    const hash_code=jwt.sign(username,Admin_secret);
    res.send({Message:"Admin Login Successfully",jwt_token:hash_code});
  }
  else{
    res.status(404).send({Message:"Admin Login Failed"});
  }
});

app.post('/admin/courses', Admin_Authentication,async (req, res) => {
  // logic to create a course
  var course=req.body;
  var newCourse=new Course(course);
  await newCourse.save();
  res.send({Message:"Course Created Successfully",Course:newCourse});
});

app.put('/admin/courses/:courseId',Admin_Authentication,async (req, res) => {
  // logic to edit a course
  var course=await Course.findByIdAndUpdate(req.params.courseId,req.body,{new:true});
  if(course){
    res.send({Message:"Course Updated Successfully"});
  }
  else{
    res.status(404).send({Message:"Invalid CourseId"})
  }
});

app.get('/admin/courses', Admin_Authentication,async (req, res) => {
  // logic to get all courses
  var courses=await Course.find({});
  res.send({Courses:courses})
});
//User Authentication
function User_Authentication(req,res,next){
  var hash_code=req.headers.authorization.split(" ")[1];
  var username=false
  jwt.verify(hash_code,User_secret,(err,data)=>{
    username=data
  })
  if(username){
    req.username=username
    next();
  }
  else{
    res.status(404).send({Message:"Invalid Credentials"})
  }
}
// User routes
app.post('/users/signup',async (req, res) => {
  // logic to sign up user
  var {username,password}=req.body;
  var find_user=await User.findOne({username});
  if(find_user){
    res.status(404).send({Message:"User Already Exists"});
  }
  else{
    var newUser=new User({username,password});
    await newUser.save();
    var hash_code=jwt.sign(username,User_secret);
    res.send({Message:"User Created Successfully",jwt_token:hash_code});
  }
});

app.post('/users/login', async (req, res) => {
  // logic to log in user
  var {username,password}=req.headers;
  var find_user=User.findOne({username,password});
  if(find_user){
    var hash_code=jwt.sign(username,User_secret);
    res.send({message:"User Login Successful",jwt_token:hash_code});
  }
  else{
    res.status(404).send({Message:"Invalid Credentials"});
  }
});

app.get('/users/courses', User_Authentication,async (req, res) => {
  // logic to list all courses
  var courses=await Course.find({});
  res.send({Courses:courses});
});

app.post('/users/courses/:courseId',User_Authentication,async (req, res) => {
  // logic to purchase a course
  var user_details=await User.findOne({username:req.username});
  var courseId=req.params.courseId;
  var find_course=await Course.findById(courseId)
  if(find_course){
    user_details.purchased_courses.push(find_course);
    await user_details.save();
    res.send({Message:"Course Purchsed Successfully"});
  }
  else{
    res.status(404).send({Message:"Invalid CourseID"});
  }
});

app.get('/users/purchasedCourses',User_Authentication,async (req, res) => {
  // logic to view purchased courses
  var user_details=await User.findOne({username:req.username}).populate("purchased_courses")
  if(user_details){
    res.send({purchased_courses:user_details.purchased_courses || []})
  }
  else{
    res.send({Message:"Invalid Credentials"});
  }
});

app.listen(3000, () => {
  console.log('Server is listening on port 3000');
});
