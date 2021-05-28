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

///////////////
//userSchema
const userSchema = mongoose.Schema({
	username: {
		type: String,
		required: true,
		unique: true
	}
});

//user model
const User = mongoose.model('User', userSchema);

///exercise Schema
const exerciseSchema = mongoose.Schema({
	userId: {
		type: String,
		required: true
	},
	description: {
		type: String,
		required: true
	},
	duration: {
		type: Number,
		required: true
	},
	date: {
		type: Date,
		required: true
	}
});

const Exercise = mongoose.model('Exercise', exerciseSchema);
/////////////

// // Create new schema instance
// const Schema = mongoose.Schema;

// // Define schema types
// const logSchema = new Schema({
//   description: {
//     type: String,
//     required: true
//   },
//   duration: {
//     type: Number,
//     required: true
//   },
//   date: {
//     type: String
//   }
// });

// const userSchema = new Schema({
//   username: { 
//     type: String, 
//     required: true,
//     unique: true },
//   count: {
//     type: Number, 
//     default: 0},
//   log : [{
//     description: {
//       type: String,
//       required: true
//     },
//     duration: {
//       type: Number,
//       required: true
//     },
//     date: {
//       type: Date
//     }
//   }]
// });


// // Create instance of new schema
// const User = mongoose.model("users", userSchema);
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

  if (!query) {
    res.json({ error: "No user found"});
  }

  if(!query._id) return res.json({error: "No ID found"});

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

app.post('/api/users/:_id/exercises', (req, res) => {
	const d = new Date();
	let description = req.body.description;
	let duration = Number(req.body.duration)
	let date =
		req.body.date === '' || req.body.date === undefined
			? d
			: new Date(req.body.date);
	const _id = req.params._id;

	User.findById(_id, (err, user) => {
		const exercise = new Exercise({
			userId: _id,
			duration,
			description,
			date
		});

		if (err) return res.json({ error: err });
		exercise.save((err, doc) => {
			if (err) return res.json({ error: err });
			res.json({
				username: user.username,
				duration,
				description,
				date: doc.date.toDateString(),
				_id
			});
		});
	});
});


// app.post("/api/users/:_id/exercises", (req, res) => {
//   // Define variables
//   const data = req.body;
//   const userId = data[":_id"];
//   let date = data.date;

//   // Check for errors
//   if (!data.description || !data.duration ) {
//     return res.json({ error: "Description and duration fields are required" });
//   };

//   if (date == null || date == "") {
//     date = new Date().toDateString();
//   } else {
//     date = new Date(data.date).toDateString();
//   }
//   console.log(date);

//   if (isNaN(parseInt(data.duration))) { 
//     return res.json({ error: `Duration must be an int, not ${data.duration}`}); 
//   };
//   let duration = Number(data.duration);


//   let exercise = {
//     description: data.description,
//     duration: duration,
//     date: date
//   };

//   User.findById(userId, (err, user) => {
//     if (err) return res.json({ error: "Invalid ID"});
//     if (!user) return res.json({ error: `Cannot find user with ${userId}`})

//     // Add new exercise
//     user.log.push(exercise);

//     // Save the updated user
//     user.save((err, updatedUser) => {
//       if (err) return res.json({ error: "User not found"})

//       return res.json({        
//         username: user.username,
//         description: data.description,
//         duration: duration,
//         _id: ObjectId(data._id), // must be of type ObjectId
//         date: date
//       });
//     });
//   });
// });


//  GET /api/users/:_id/logs?[&from][&to][&limit]
// &:from?&:to?&:limit?
app.get("/api/users/:_id/logs", async (req, res) => {
  let _id = req.params["_id"];
  console.log(req.params);
  let userUsername;
  let outputLog = [];

  await User.findById(_id, (err, user) => {
    Exercise.find({userId : _id})
    .exec((err, exerciseList) => {
      if (err) return res.json({ error: err });
      if (!user) return res.json({ error: "No user found"});

      res.json({
        username: user.username,
        _id: user.id,
        count: exerciseList.length,
        log: exerciseList.map(record => ({
          description: record.description,
          duration: record.duration,
          date: record.date
        }))
      });
    });
  });
});

// Method to create new User
const createUser = async (userName, done) => {
  const newUser = new User({ username : userName });
  await newUser.save();
};

const url = "https://exercisetracker.caitlingbailey.repl.co";

const testFunc = async (getUserInput) => {
  // const url = url;
  const res = await fetch(url + '/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `username=fcc_test_${Date.now()}`.substr(0, 29)
  });
  if (res.ok) {
    const { _id, username } = await res.json();
    const expected = {
      username,
      description: 'test',
      duration: 60,
      _id,
      date: 'Mon Jan 01 1990'
    };
    const addRes = await fetch(url + `/api/users/${_id}/exercises`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `description=${expected.description}&duration=${expected.duration}&date=1990-01-01`
    });
    if (addRes.ok) {
      const actual = await addRes.json();
      assert.deepEqual(actual, expected);
    } else {
      throw new Error(`${addRes.status} ${addRes.statusText}`);
    }
  } else {
    throw new Error(`${res.status} ${res.statusText}`);
  }
};

// console.log(testFunc());