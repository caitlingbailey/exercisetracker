const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const moment = require('moment'); 


require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({extended: false}));

// Error Handling middleware
// app.use((err, req, res, next) => {
//   let errCode, errMessage

//   if (err.errors) {
//     // mongoose validation error
//     errCode = 400 // bad request
//     const keys = Object.keys(err.errors)
//     // report the first validation error
//     errMessage = err.errors[keys[0]].message
//   } else {
//     // generic or custom error
//     errCode = err.status || 500
//     errMessage = err.message || 'Internal Server Error'
//   }
//   res.status(errCode).type('txt')
//     .send(errMessage)
// })

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// Connect to database
mongoose.connect(process.env['MONGO_URI'], { useNewUrlParser: true, useUnifiedTopology: true });


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

// Create new schema instance
const Schema = mongoose.Schema;

// Define schema types
const logSchema = new Schema({
  description: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  date: {
    type: String
  }
});

const userSchema = new Schema({
  username: { 
    type: String, 
    required: true,
    unique: true },
  count: {
    type: Number, 
    default: 0},
  log : [{
    description: {
      type: String,
      required: true
    },
    duration: {
      type: Number,
      required: true
    },
    date: {
      type: Date
    }
  }]
});


// Create instance of new schema
const User = mongoose.model("users", userSchema);
const {ObjectId} = require('mongodb');


// Listen to username input
app.post("/api/users", async (req, res) => {
  const userName = req.body.username;

  if (!userName) {
    res.json({
      success: false,
      message: `Please enter a username`
    });
    // console.log("Please enter a username");
  };

  createUser(userName);
  let query = await User.findOne({username : userName});

  res.json({
    username : userName,
    _id : query._id.toString()});
});

const dateHandler = (date) => {
  let inputDate;
  if (date == null || date == "") {
      inputDate = new Date().toUTCString().split(" ");
      inputDate[0] = inputDate[0].slice(0,3)
      let a = inputDate[2];
      inputDate[2] = inputDate[1];
      inputDate[1] = a;
      inputDate = inputDate.slice(0,4).join(" ");
  } else {
    inputDate = new Date(date).toUTCString().split(" ");
    inputDate[0] = inputDate[0].slice(0,3)
    let a = inputDate[2];
    inputDate[2] = inputDate[1];
    inputDate[1] = a;
    inputDate = inputDate.slice(0,4).join(" ");
  };
  return inputDate;
};



app.get("/api/users", (req, res) => {
  User.find({}, (err, users) => {
    let userArray = [];
    users.forEach((user) => {
      userObject = {};
      userObject["_id"] = user._id;
      userObject["username"] = user.username;
      userObject["__v"] = user.__v;
      userArray.push(userObject);
    });
    // console.log(userArray);
    res.send(userArray);
  });
});

app.post("/api/users/:_id/exercises", (req, res) => {
  // Define variables
  const data = req.body;
  const date = data.date;
  const userId = data[":_id"];

  // Check for errors
  if (!data.description || !data.duration ) {
    return res.json({ error: "Description and duration fields are required" });
  };

  if (date == null || date == "") {
    date = new Date().toDateString();
  } else {
    date = new Date(data.date).toDateString();
  }
  console.log(date);

  let exercise = {
    description: data.description,
    duration: parseInt(data.duration),
    date: date
  };

  User.findById(userId, (err, user) => {
    if (err) return res.json({ error: "Invalid ID"});

    // if (!user) {
    //   res.json({
    //     success: false,
    //     message: `Cannot find a user with the userId: ${userId}`
    //     });
    //   return;
    // };

    user_username = user.username;

    // Add new exercise
    user.log.push(exercise);

    // Save the updated user
    user.save((err, updatedUser) => {
      if (err) return console.error(err);

      // console.log(output);
      return res.json({        
        username: user.username,
        description: data.description,
        duration: parseInt( data.duration ),
        _id: ObjectId(data._id), // must be of type ObjectId
        date:  date
      });
    });
  });
});


//  GET /api/users/:_id/logs?[&from][&to][&limit]
// &:from?&:to?&:limit?
app.get("/api/users/:_id/logs", async (req, res) => {
  let _id = req.params["_id"];
  console.log(req.params);
  let userLog;
  let userUsername;
  let outputLog = [];

  await User.findById(_id, (err, user) => {
    if (err) return console.log(err);
    userLog = user.log;

    userLog.forEach((value, index, array) => {
      let ex = {
        description: value.description,
        duration : value.duration,
        date : dateHandler(value.date)
      };
      outputLog.push(ex);
    });
    userUsername = user.username;
  });
  // console.log("Output Log");
  // console.log(outputLog);

  await res.json({
    _id : _id,
    username : userUsername,
    count : outputLog.length,
    log : outputLog
  });
});

// Method to create new User
const createUser = async (userName, done) => {
  const newUser = new User({ username : userName });
  await newUser.save();
};