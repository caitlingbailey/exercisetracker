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
    type: Date
  }
});

const userSchema = new Schema({
  username: { 
    type: String, 
    required: true },
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

// Listen to username input
app.post("/api/users", async (req, res) => {
  const userName = req.body.username;

  createUser(req.body.username);
  let query = await User.findOne({username : userName});
  console.log(query._id.toString());

  res.json({
    username : userName,
    _id : query._id.toString()});
});

app.get("/api/users", (req, res) => {
  User.find({}, (err, users) => {
    let userArray = [];
    users.forEach((user) => {
      userObject = {};
      userObject["_id"] = user._id;
      userObject["username"] = user.username;
      userObject["__v"] = user.__v;
      // userObject[user.username] = user._id;
      userArray.push(userObject);
    });
    console.log(userArray);
    res.send(userArray);
  });
});

app.post("/api/users/:_id/exercises", async (req, res) => {
  let _id = req.body[":_id"];
  let exercise = {};
  let user_username;

  exercise["description"] = req.body.description;
  exercise["duration"] = req.body.duration;

  if (req.body.date === '') {
    exercise["date"] = moment().format('DDD MMMM DD YYYY');
  } else {
    exercise["date"] = moment(req.body.date).format('DDD MMMM DD YYYY');
  };

  await User.findById(_id, (err, user) => {
    if (err) { 
      console.log(err);
      res.status(400)
      res.json({
        success: false,
        err
      });
    };

    if (!user) {
      res.status(404);
      res.json({
        success: false,
        message: `Cannot find an User with the userId`
        });
      res.end();
      return
    }
    user_username = user.username;

    // Add new exercise
    user.log.push(exercise);

    // Save the updated user
    user.save((err, updatedUser) => {
      if (err) return console.log(err);
    });
  });

  // Return user object with exercise fields added
  await res.json({
    "username" : user_username,
    "_id" : _id,
    "date" : exercise["date"],
    "duration" : exercise["duration"],
    "description" : exercise["description"]
    });
});

//  GET /api/users/:_id/logs?[&from][&to][&limit]
app.get("/api/users/:_id/logs&:from?&:to?&:limit?", async (req, res) => {
  let _id = req.params["_id"];
  console.log(req.params);
  let userLog;
  let userUsername;

  await User.findById(_id, (err, user) => {
    if (err) return console.log(err);
    userLog = user.log;
    userUsername = user.username;
  });

  await res.json({
    username : userUsername,
    _id : _id,
    count : userLog.length,
    log : userLog
  });
});

// Method to create new URL
const createUser = async (userName, done) => {
  const newUser = new User({ username : userName });
  await newUser.save();
};
