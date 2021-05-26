const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose');
const bodyParser = require('body-parser');


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
  log : {
    type: [logSchema]
  }
});


// Create instance of new schema
const User = mongoose.model("users", userSchema);

// Listen to username input
app.post("/api/users", async (req, res) => {
  console.log(req.body.username);
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
      userObject[user.username] = user._id;
      userArray.push(userObject);
    });
    console.log(userArray);
    res.send(userArray);
  });
});

app.post("/api/users/:_id/exercises", (req, res) => {
  let _id = req.body._id;
  let exercise = {};

  exercise["description"] = req.body.description;
  exercise["duration"] = req.body.duration;
  if (req.body.date === '') {
    exercise["date"] = new Date();
    console.log(exercise["date"]);
  } else {
    exercise["date"] = req.body.date;
  };

  User.findById(_id, (err, user) => {
    if (err) return console.log(err);

    // Add new exercise
    user.log.push(exercise);

    // Save the updated user
    user.save((err, updatedUser) => {
      if (err) return console.log(err);
      done(null, updatedUser);
    });
  });

  // Return user object with exercise fields added
  userObject = {
    "username" : "placeholder",
    "_id" : req.body.id,
    "date" : exercise["date"],
    "duration" : exercise["duration"],
    "description" : exercise["description"]}
  res.json(userObject);
});



// Method to create new URL
const createUser = async (userName, done) => {
  const newUser = new User({ username : userName });
  await newUser.save();
};
