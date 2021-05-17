if (process.env.NODE_ENV !== "production") {
  require("dotenv").config()
}


const express = require("express");
const bodyParser= require("body-parser");
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const bcrypt = require("bcrypt");
const passport = require("passport")
const LocalStrategy = require("passport-local").Strategy
const flash = require("express-flash")
const session = require("express-session")
var nodemailer = require("nodemailer");
var async = require("async");
var crypto = require("crypto");
var moment = require('moment'); // require
moment().format();

const app = express();

app.set('view engine', 'ejs');
const RateLimit = require('express-rate-limit');
const limiter = new RateLimit({
  windowMs: 1*60*1000, // 1 minute
  max: 50,
  message: "Please reach out after some time"
});

// apply rate limiter to all requests
app.use(limiter);

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash())
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
 saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())
let _currentUser_ = {}
app.use(async (req, res, next) => {
  if(await Admin.findOne({_id: req.user}) !== null){
    await Admin.findOne({_id: req.user}, function(err, currentUser){
      _currentUser_ = currentUser;
    })
    res.locals.current_user = _currentUser_
  } else{
    await Employee.findOne({_id: req.user}, function(err, currentUser){
      _currentUser_ = currentUser;
    })
    res.locals.current_user = _currentUser_
  }

console.log("outside:" + _currentUser_);



  next();
})

const employeeSchema = new mongoose.Schema({
  employee_photo: String,
  employee_first_name: String,
  employee_last_name: String,
  employee_gender: String,
  employee_fathers_name: String,
  employee_dob: Date,
  employee_doj: Date,
  employee_email: {
    type: String,
    required: true,
    unique: true
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  employee_address: String,
  employee_phno_1: Number,
  employee_designation: String,
  employee_salary: Number,
  role: String,
  employee_password: String,
  employee_company: String,
  employee_department: String,
});
const Employee = mongoose.model("Employee", employeeSchema);

const adminSchema = new mongoose.Schema({
  admin_photo: String,
  admin_name: String,
  admin_email: {
    type: String,
    required: true,
    unique: true
  },
  admin_password: String,
  role: String,
  admin_company: String,
  admin_father_name: String,
  admin_dob: Date,
  admin_gender: String,
  admin_doj: Date,
  admin_phno: Number,
  admin_address: String,
  admin_designation: String
})
const Admin = mongoose.model("Admin", adminSchema);

const leaveSchema = new mongoose.Schema({
  employee_email: String,
  employee_name: String,
  fromdate: Date,
  todate: Date,
  reason: String,
  leavetype: String,
  confirmation: String,
  m: Number,
  date: Date
})
const Leave = mongoose.model("Leave",leaveSchema);


const ltaSchema = new mongoose.Schema({
  employee_email: String,
  currency: String,
  reimbursement_type: String,
  submission_date: Date,
  taxable_or_not: String,
  leave_availed_from: Date,
  leave_availed_until: Date,
  claim_amount: Number,
  m: Number,
  remarks: String

})
var LTA = mongoose.model('lta', ltaSchema);

const ecSchema = new mongoose.Schema({
  employee_email: String,
  reporting_manager: String,
  project_clarification: String,
  currency: String,
  reimbursement_type: String,
  cost_centre: String,
  reimbursement_amount: Number,
  m: Number,
  remarks: String

})
var EC = mongoose.model('ec', ecSchema);



const mcSchema = new mongoose.Schema({
  employee_email: String,
  currency: String,
  reimbursement_type: String,
  cost_centre: String,
  reimbursement_amount: Number,
  m: Number,
  remarks: String

})
var MC = mongoose.model('mc', mcSchema);

const performanceschema = new mongoose.Schema({
  employee_email: String,
  role: String,
  manager_name: String,
  project: String,
  review_period: String,
  review_date: Date,
  skill_set: String,
  quality_of_work: String,
  attitude: String,
  efficiency: String,
  reliability: String,
  team_work: String,
  communication: String,
  leadership: String
})
var Performance = mongoose.model('performance', performanceschema);

const captchaSchema = new mongoose.Schema({
  code: String
})

const Captcha = mongoose.model('captcha', captchaSchema);

var timeSchema = new mongoose.Schema({
  date: Date,
  employee_email: String,
  starttime : Number,
  endtime: Number
})

var Time = mongoose.model('time', timeSchema);

const attendaceSchema = new mongoose.Schema({
  date: String,
  employee_email: String,
  hours: Number,
  m: Number
})

const mainattendaceSchema = new mongoose.Schema({
  date: String,
  employee_email: String,
  atten: String,
  m: Number,
  hours: Number
})

const Attendance = mongoose.model('attendance', attendaceSchema)

const MainAttendace = mongoose.model('mainattendance', mainattendaceSchema)

const dburl = process.env.dburl || 'mongodb://localhost:27017/employeeDB'
mongoose.connect(dburl, {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true});




app.get("/add_employee",checkAuthenticated,function(req,res){
  res.render("add_employee");
});



app.post("/add_employee",checkAuthenticated, async (req,res) =>{
  try{
    const employee = req.body.employee
    const employee_password = employee.employee_email;
    const hashedPassword = await bcrypt.hash(employee_password, 10)
    const employee_company = _currentUser_.admin_company
    const employee_main = new Employee({
      employee_photo: employee.employee_photo,
      employee_first_name:  employee.employee_first_name,
      employee_last_name:  employee.employee_last_name,
      employee_gender:  employee.employee_gender,
      employee_fathers_name:  employee.employee_fathers_name,
      employee_dob: employee.employee_dob,
      employee_doj:  employee.employee_doj,
      employee_email:  employee.employee_email,
      employee_address:  employee.employee_address,
      employee_phno_1:  employee.employee_phno_1,
      employee_designation:  employee.employee_designation,
      employee_salary:  employee.employee_salary,
      role:  "employee",
      employee_password:  hashedPassword,
      employee_department:  employee.employee_department,
      employee_company: employee_company
    })
    employee_main.save()
    res.redirect("/add_employee")
  }

  catch{
    res.redirect("/add_employee")
  }


})

app.get("/view_employee",checkAuthenticated,function(req,res){
res.render("view_employee", {foundItems: []});
});

app.post("/view_employee",checkAuthenticated, function(req, res){
let employee_email = req.body.employee_email;
  Employee.find({employee_email},function(err, foundItems){
    res.render("view_employee", {foundItems});
  })
})

app.get("/edit_employee",checkAuthenticated,function(req,res){
res.render("edit_employee", {foundItems: []});
});

app.post("/edit_employee",checkAuthenticated,function(req, res){

let employee_email = req.body.employee_email;

Employee.find({employee_email},function(err, foundItems){

  res.render("edit_employee", {foundItems});

})
})

app.put("/edit_employee/:id",checkAuthenticated, function(req, res){
  const {id} = req.params;
  Employee.findByIdAndUpdate(id, req.body.employee, (err, updated_employee)=>{
    if(err){
      res.redirect("/edit_employee");
    } else {
      res.redirect("/edit_employee");
    }
  })
})

app.get("/employee_LTA",checkAuthenticated,function(req,res){
  let employee_email = _currentUser_.employee_email;
  Employee.find({employee_email},function(err, foundItems){
    LTA.find({employee_email}, function(err, lta_foundItems){
      res.render("employee_LTA", {foundItems: foundItems,lta_foundItems: lta_foundItems});
    })

  });
});


app.get("/admin_LTA",checkAuthenticated, function(req,res){
res.render("admin_LTA", {foundItems: []});
});

app.post("/admin_LTA",checkAuthenticated,  function(req, res){
let employee_email = req.body.employee_email;
  Employee.find({employee_email},function(err, foundItems){
    res.render("admin_LTA", {foundItems});
  })

})

app.put("/admin_LTA",checkAuthenticated, function(req, res){
  var date = new Date();
  var m = new Intl.DateTimeFormat('en', { month: 'numeric' }).format(date);
  var mon = date.getMonth()+1
  date = date.getDate() + "-" + mon + "-" + date.getFullYear()
  let employee_email = req.body.employee_email;
  let currency = req.body.currency;
  let reimbursement_type = req.body.reimbursement_type;
  let submission_date = req.body.submission_date;
  let taxable_or_not = req.body.taxable_or_not;
  let leave_availed_from = req.body.leave_availed_from;
  let leave_availed_until = req.body.leave_availed_until;
  let claim_amount = req.body.claim_amount;
  let remarks = req.body.remarks;
  let lta = new LTA({
    employee_email: employee_email,
    currency: currency,
    reimbursement_type: reimbursement_type,
    submission_date: submission_date,
    taxable_or_not: taxable_or_not,
    leave_availed_from: leave_availed_from,
    leave_availed_until: leave_availed_until,
    claim_amount:claim_amount,
    m: m,
    remarks: remarks
  })
  lta.save();
  res.redirect("/admin_LTA")
})

app.get("/admin_ec",checkAuthenticated, function(req,res){
res.render("admin_ec", {foundItems: []});
});

app.post("/admin_ec",checkAuthenticated,  function(req, res){
let employee_email = req.body.employee_email;
  Employee.find({employee_email},function(err, foundItems){
    res.render("admin_ec", {foundItems});
  })

})

app.put("/admin_ec",checkAuthenticated, function(req, res){
  var date = new Date();
  var m = new Intl.DateTimeFormat('en', { month: 'numeric' }).format(date);
  var mon = date.getMonth()+1
  date = date.getDate() + "-" + mon + "-" + date.getFullYear()
  let employee_email = req.body.employee_email;
  let reporting_manager = req.body.reporting_manager;
  let project_clarification = req.body.project_clarification;
  let currency = req.body.currency;
  let reimbursement_type = req.body.reimbursement_type;
  let cost_centre = req.body.cost_centre;
  let reimbursement_amount = req.body.reimbursement_amount;
  let remarks = req.body.remarks;
  let ec = new EC({
    employee_email: employee_email,
    reporting_manager: reporting_manager,
    project_clarification: project_clarification,
    currency: currency,
    reimbursement_type: reimbursement_type,
    cost_centre: cost_centre,
    reimbursement_amount: reimbursement_amount,
    m: m,
    remarks: remarks
  })
  ec.save();
  res.redirect("/admin_ec")
})

app.get("/employee_ec",checkAuthenticated,function(req,res){
  let employee_email = _currentUser_.employee_email;
  Employee.find({employee_email},function(err, foundItems){
    EC.find({employee_email}, function(err, ec_foundItems){
      res.render("employee_ec", {foundItems: foundItems,ec_foundItems: ec_foundItems});
    })

  });
});


app.get("/admin_mc",checkAuthenticated, function(req,res){
res.render("admin_mc", {foundItems: []});
});

app.post("/admin_mc",checkAuthenticated,  function(req, res){
let employee_email = req.body.employee_email;
  Employee.find({employee_email},function(err, foundItems){
    res.render("admin_mc", {foundItems});
  })

})

app.put("/admin_mc",checkAuthenticated, function(req, res){
  var date = new Date();
  var m = new Intl.DateTimeFormat('en', { month: 'numeric' }).format(date);
  var mon = date.getMonth()+1
  date = date.getDate() + "-" + mon + "-" + date.getFullYear()
  let employee_email = req.body.employee_email;
  let currency = req.body.currency;
  let reimbursement_type = req.body.reimbursement_type;
  let cost_centre = req.body.cost_centre;
  let reimbursement_amount = req.body.reimbursement_amount;
  let remarks = req.body.remarks;
  let mc = new MC({
    employee_email: employee_email,
    currency: currency,
    reimbursement_type: reimbursement_type,
    cost_centre: cost_centre,
    reimbursement_amount: reimbursement_amount,
    m: m,
    remarks: remarks
  })
  mc.save();
  res.redirect("/admin_mc")
})

app.get("/employee_mc",checkAuthenticated,function(req,res){
  let employee_email = _currentUser_.employee_email;
  Employee.find({employee_email},function(err, foundItems){
    MC.find({employee_email}, function(err, mc_foundItems){
      res.render("employee_mc", {foundItems: foundItems,mc_foundItems: mc_foundItems});
    })

  });
});



app.get("/request_leave",checkAuthenticated, function (req, res) {
  let employee_email = _currentUser_.employee_email;
    Employee.find({employee_email},function(err, foundItems){
      res.render("request_leave", {foundItems: foundItems});
    })
})


app.post("/request_leave",checkAuthenticated, function (req, res) {
  var date = new Date();
  var m = new Intl.DateTimeFormat('en', { month: 'numeric' }).format(date);
  var mon = date.getMonth()+1
  date = date.getDate() + "-" + mon + "-" + date.getFullYear()
  let employee_email = req.body.employee_email;
  let employee_name = req.body.employee_name;
  let fromdate =  req.body.fromdate;
  let todate =  req.body.todate;
  let reason =  req.body.reason;
  let leavetype =  req.body.leavetype;
  let confirmation = "null";
  let leave = new Leave({
    employee_email: employee_email,
    employee_name: employee_name,
    fromdate: fromdate,
    todate: todate,
    reason: reason,
    leavetype:leavetype,
    m: m,
    confirmation: confirmation
  })
  leave.save();
  res.redirect("/request_leave");
})

app.get("/leave_status",checkAuthenticated, function(req,res) {
  let employee_email = _currentUser_.employee_email;
  Employee.find({employee_email}, function(err, foundItems){
    Leave.find({employee_email}, function(err, leave_foundItems) {
      res.render("leave_status", {foundItems: foundItems, leave_foundItems: leave_foundItems});
    })
  })
})



app.get("/admin_performance",checkAuthenticated, function(req, res) {
  res.render("admin_performance", {foundItems: []});
})

app.post("/admin_performance",checkAuthenticated,  function(req, res){
let employee_email = req.body.employee_email;
  Employee.find({employee_email},function(err, foundItems){
    res.render("admin_performance", {foundItems});
  })

})

app.put("/admin_performance",checkAuthenticated, function(req, res){
  let employee_email = req.body.employee_email
  let role = req.body.role
  let manager_name = req.body.manager_name
  let review_period = req.body.review_period
  let review_date = req.body.review_date
  let project = req.body.project
  let skill_set = req.body.skill_set
  let quality_of_work = req.body.quality_of_work
  let attitude = req.body.attitude
  let efficiency = req.body.efficiency
  let reliability = req.body.reliability
  let team_work = req.body.team_work
  let communication = req.body.communication
  let leadership = req.body.leadership
  let performance = new Performance({
    employee_email: employee_email,
    role: role,
    manager_name: manager_name,
    project: project,
    review_period: review_period,
    review_date: review_date,
    skill_set: skill_set,
    quality_of_work: quality_of_work,
    attitude: attitude,
    efficiency: efficiency,
    reliability: reliability,
    team_work: team_work,
    communication: communication,
    leadership:leadership
  })
  performance.save()
  res.redirect("/admin_performance")
})


app.get("/employee_performance",checkAuthenticated,function(req,res){
  let employee_email = _currentUser_.employee_email;
Employee.find({employee_email},function(err, foundItems){
  Performance.find({employee_email}, function(err, performance_foundItems){
    res.render("employee_performance", {foundItems: foundItems, performance_foundItems: performance_foundItems});
  })
  });
});

app.get("/view_performance",checkAuthenticated, function(req, res){
    res.render("view_performance", {foundItems: [], performance_foundItems: []});
})
app.post("/view_performance",checkAuthenticated, function (req, res) {
  let employee_email = req.body.employee_email;
Employee.find({employee_email},function(err, foundItems){
  Performance.find({employee_email}, function(err, performance_foundItems){
    res.render("view_performance", {foundItems, performance_foundItems});
  })
  });
})



app.get("/admin_payroll",checkAuthenticated, function(req, res){
  res.render("admin_payroll", {foundItems: [], mc_foundItems: [],ec_foundItems: [],lta_foundItems: [],leave_foundItems: []});
})
app.post("/admin_payroll",checkAuthenticated, function(req, res){
  let employee_email = req.body.employee_email;
  var date = new Date()
  var m = new Intl.DateTimeFormat('en', { month: 'numeric' }).format(date);
  var mon = date.getMonth()+1
  date = date.getDate() + "-" + mon + "-" + date.getFullYear()

  Employee.find({employee_email},function (err, foundItems){
    MC.find({employee_email, m: m}, function(err, mc_foundItems){
      EC.find({employee_email, m: m}, function(err, ec_foundItems){
        LTA.find({employee_email, m: m}, function(err, lta_foundItems){
          Leave.find({employee_email, m: m}, function (err, leave_foundItems){
            MainAttendace.find({employee_email, m: m}, function (err, main_foundItems){
              Leave.find({employee_email, m: m, leavetype: "Paid Leave"}, function(err, paid_foundItems){
                  res.render("admin_payroll", {foundItems: foundItems, mc_foundItems: mc_foundItems,ec_foundItems: ec_foundItems,lta_foundItems: lta_foundItems,leave_foundItems: leave_foundItems,main_foundItems: main_foundItems,paid_foundItems: paid_foundItems});
              })
            })
          })

        })
      })
    })
  })

})

app.get("/employee_payroll",checkAuthenticated, function(req, res){
  let employee_email = _currentUser_.employee_email;
  var date = new Date()
  var m = new Intl.DateTimeFormat('en', { month: 'numeric' }).format(date);
  var mon = date.getMonth()+1
  date = date.getDate() + "-" + mon + "-" + date.getFullYear()

  Employee.find({employee_email},function (err, foundItems){
    MC.find({employee_email, m: m}, function(err, mc_foundItems){
      EC.find({employee_email, m: m}, function(err, ec_foundItems){
        LTA.find({employee_email, m: m}, function(err, lta_foundItems){
          Leave.find({employee_email, m: m}, function (err, leave_foundItems){
            MainAttendace.find({employee_email, m: m}, function (err, main_foundItems){
              Leave.find({employee_email, m: m, leavetype: "Paid Leave"}, function(err, paid_foundItems){
                  res.render("employee_payroll", {foundItems: foundItems, mc_foundItems: mc_foundItems,ec_foundItems: ec_foundItems,lta_foundItems: lta_foundItems,leave_foundItems: leave_foundItems,main_foundItems: main_foundItems,paid_foundItems: paid_foundItems});
              })
            })
          })

        })
      })
    })
  })

})

app.get("/admin_leaves",checkAuthenticated, function (req, res) {
  let confirmation = "null";
  Leave.find({confirmation}, function (err, leave_foundItems){
    console.log(leave_foundItems);
    res.render("admin_leaves",{leave_foundItems: leave_foundItems});
  })

})

app.post("/admin_leaves",checkAuthenticated, function (req,res) {
  let confirmation = "null";
  let confo = req.body.confirmation;
  Leave.find({confirmation}, function (err, leave_foundItems){
    if (leave_foundItems.length == 0) {

    }
    else {

      id = leave_foundItems[0]._id;
      console.log(id);
      Leave.findByIdAndUpdate(id, {confirmation: confo}, (err, updated_employee)=>{
        if(err){
          res.redirect("/admin_leaves");
        } else {
          res.redirect("/admin_leaves");
        }
      })
    }




  })
})

app.get("/captcha1",checkAuthenticated, function (req, res) {
  Captcha.deleteMany({}, function (err) {
  if(err) console.log(err);
  console.log("Successful deletion");
});
  let letters = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z',
  'a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z', '0','1','2','3','4','5','6','7','8','9'];
  let a = letters[Math.floor(Math.random() * letters.length)] ;
  let b = letters[Math.floor(Math.random() * letters.length)] ;
  let c = letters[Math.floor(Math.random() * letters.length)] ;
  let d = letters[Math.floor(Math.random() * letters.length)] ;
  let e = letters[Math.floor(Math.random() * letters.length)] ;
  let f = letters[Math.floor(Math.random() * letters.length)] ;
  let g = letters[Math.floor(Math.random() * letters.length)] ;
  let code = a + b + c + d + e + f + g ;

  let captcha = new Captcha({
    code: code
  })
  captcha.save()
  res.render("captcha1", {code: code})

})

app.post("/captcha1",checkAuthenticated, function(req, res){
  Captcha.find({}, function(err, foundItems){
    console.log(foundItems);
    if(req.body.code == '') {
        // alert('Please Enter The code') ;
        res.redirect("/captcha1");
    }
    else if(req.body.code === foundItems[0].code) {

      var date = new Date();
      let time = new Time({
        date: date,
        employee_email: _currentUser_.employee_email,
        starttime: Math.floor(date/1000),
        endtime: 0
      })
      time.save()
      res.redirect("/")


    }
    else {
        // alert('invalid input !') ;
        res.redirect("/captcha1");
    }
  })

})





app.get("/employee_attendance",checkAuthenticated, function (req, res){
  date = new Date()
  var mon = date.getMonth()+1
  date = date.getDate() + "-" + mon + "-" + date.getFullYear()
  employee_email = _currentUser_.employee_email
  MainAttendace.find({employee_email, m: m}, function (err, foundItems){
    res.render("employee_attendance", {foundItems:foundItems})
  })

})

app.get("/admin_attendance",checkAuthenticated, function (req, res){
  res.render("admin_attendance", {foundItems:[]})
})

app.post("/admin_attendance",checkAuthenticated, function (req, res){
  date = new Date()
  var mon = date.getMonth()+1
  date = date.getDate() + "-" + mon + "-" + date.getFullYear()
  employee_email = req.body.employee_email
  MainAttendace.find({employee_email, m: m}, function (err, foundItems){
    res.render("admin_attendance", {foundItems})
  })
})


app.get("/landing_page",checkNotAuthenticated, function(req, res){
  res.render("landing_page")
})

app.get("/", checkAuthenticated, (req,res) => {
  if(  _currentUser_.role == "admin"){
    res.render("admin_home.ejs")
  } else {
    res.render("employee_home.ejs")
  }

})

app.get("/login", checkNotAuthenticated, (req,res) => {
  res.render("login.ejs")

})

app.post("/login", checkNotAuthenticated, passport.authenticate("local",{
  successRedirect: "/captcha1" ,
  failureRedirect: "/login",
  failureFlash: true
}))

app.get("/register", checkNotAuthenticated, (req,res) => {
  res.render("register.ejs")
})
app.post("/register", checkNotAuthenticated, async (req,res) => {
  try{
    const admin = req.body.admin
    const hashedPassword = await bcrypt.hash(admin.admin_password, 10)
    let admin_object = new Admin({
      admin_photo: admin.admin_photo,
      admin_name: admin.admin_name,
      admin_email: admin.admin_email,
      admin_password: hashedPassword,
      role: "admin",
      admin_company: admin.admin_company,
      admin_father_name: admin.admin_father_name,
      admin_dob: admin.admin_dob,
      admin_gender: admin.admin_gender,
      admin_doj: admin.admin_doj,
      admin_phno: admin.admin_phno,
      admin_address: admin.admin_address,
      admin_designation: admin.admin_designation
    })
    admin_object.save();
    res.redirect("/login");
  } catch {
    res.redirect("/register");
  }
});

app.get('/forgot',checkNotAuthenticated, function(req, res) {
  res.render('forgot');
});

app.post('/forgot',checkNotAuthenticated, function(req, res, next) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      Employee.findOne({ employee_email: req.body.email }, function(err, user) {
        if (!user) {
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      console.log(user);
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: 'hrms.service.0@gmail.com',
          pass: process.env.GMAIL_PW
        }
      });
      var mailOptions = {
        to: user.employee_email,
        from: 'hrms.service.0@gmail.com',
        subject: 'Node.js Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        console.log('mail sent');
        req.flash('success', 'An e-mail has been sent to ' + user.employee_email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/forgot');
  });
});

app.get('/reset/:token',checkNotAuthenticated, function(req, res) {
  Employee.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }
    res.render('reset', {token: req.params.token});
  });
});

app.post('/reset/:token',checkNotAuthenticated, function(req, res) {
  async.waterfall([
    function(done) {
      Employee.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, async (err, user)=> {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }
        if(req.body.password === req.body.confirm) {
          var id = user._id

          const hashedPassword = await bcrypt.hash(req.body.password, 10)
          Employee.findByIdAndUpdate(id, {employee_password: hashedPassword, resetPasswordToken: undefined, resetPasswordExpires: undefined}, (err, updated_employee)=>{
            if(err){
              res.redirect("/forgot");
            } else {
              res.redirect("/login");
            }
          })

        } else {
            req.flash("error", "Passwords do not match.");
            return res.redirect('back');
        }
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: 'hrms.service.0@gmail.com',
          pass: process.env.GMAIL_PW
        }
      });
      var mailOptions = {
        to: user.employee_email,
        from: 'hrms.service.0@gmail.com',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.employee_email + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/login');
  });
});



passport.use(new LocalStrategy({ usernameField: 'email' },
  async function(email = req.body.email, password = req.body.password, done) {
    if(await Admin.findOne({admin_email: email}) !== null){
      Admin.findOne({ admin_email: email }, async (err, user) => {
        if (user == null) {

          return done(null, false, { message: 'No user with that email' })
        }


          try {
            if (await bcrypt.compare(password, user.admin_password)) {
              return done(null, user)
            } else {
              return done(null, false, { message: 'Password incorrect' })
            }
          } catch (e) {
            return done(e)
          }



        })
    } else {
        Employee.findOne({ employee_email: email }, async (err, user) => {
        console.log(user);
        if (user == null) {

          return done(null, false, { message: 'No user with that email' })
        }


          try {
            if (await bcrypt.compare(password, user.employee_password)) {
              return done(null, user)
            } else {
              return done(null, false, { message: 'Password incorrect' })
            }
          } catch (e) {
            return done(e)
          }



        })

    }



            passport.serializeUser((user, done) => done(null,user.id))
            passport.deserializeUser((user, done) => {
              return done(null, user)
          });


  }
));



app.delete('/logout', (req, res) => {
  var date = new Date();
  var endTime = Math.floor(date/1000)
  var m = new Intl.DateTimeFormat('en', { month: 'numeric' }).format(date);
  var y = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(date);
  var mon = date.getMonth()+1
  date = date.getDate() + "-" + mon + "-" + date.getFullYear()




  Time.find({}, function (err, foundItems) {
    console.log("time" + foundItems);
    foundItems.forEach(function(emp){

      let attendance1 = new Attendance({
        date: date,
        employee_email: _currentUser_.employee_email,
        hours: endTime - emp.starttime,
        m: m
      })
      attendance1.save();
    })

  })
  Time.deleteMany({}, function (err) {
  if(err) console.log(err);
  console.log("Successful deletion");
  });

  req.logOut()
  res.redirect('/login')

})


  var yesterday = moment().add(-1, 'day').toDate();
  console.log(yesterday);
  var date = new Date()
  var m = new Intl.DateTimeFormat('en', { month: 'numeric' }).format(date)
  var y = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(date);
  var mon = date.getMonth()+1
  date = date.getDate() + "-" + mon + "-" + date.getFullYear()
  yesterday = yesterday.getDate() + "-" + mon + "-" + yesterday.getFullYear()

  MainAttendace.find({date: yesterday},function (err, foundItems){
    if(foundItems.length ===0){
      Employee.find({}, function (err, foundItems) {
        foundItems.forEach(function(employee) {
          function retrieveUser(callback) {



          Attendance.find({employee_email: employee.employee_email, date: yesterday, m: m}, function(err, users) {

            if (err) {
              callback(err, null);
            } else {
              callback(null, users);
            }
          });

        };



        retrieveUser(function(err, user) {
          if (err) {
            console.log(err);
          }
          if(user.length === 0){
            let main = new MainAttendace({
              date: yesterday,
              employee_email: employee.employee_email,
              atten: "Absent",
              m: m,
              hours: 0
            })
            main.save();
          }
          else {
            var k = 0;
            for (var i =0; i<user.length; i++) {

              k = k + user[i].hours
            }

            if(k < 180){
              let main = new MainAttendace({
                date: yesterday,
                employee_email: employee.employee_email,
                atten: "Absent",
                m: m,
                hours: k
              })
              main.save();

            } else {
              let main = new MainAttendace({
                date: yesterday,
                employee_email: employee.employee_email,
                atten: "Present",
                m: m,
                hours: k
              })
              main.save();

            }
          }




        });
        })

      })







    } else {
      Attendance.deleteMany({date: yesterday, m: m}, function (err) {
      if(err) console.log(err);
      console.log("Successful deletion");
    });
    }
  })












function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next()
  }

  res.redirect('/landing_page')
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/')
  }
  next()
}



const port = process.env.PORT || 8888
app.listen(port, function() {
  console.log("Server started on port 8888");
})
