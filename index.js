const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const nodemailer = require('nodemailer');
const redis = require('redis');
const { User } = require('./models/userModel');
const { Assignment } = require('./models/assignmentsModel')
const {Submission} = require('./models/submissionModel')
// const redis = require('redis');
const util = require('util');
const { createTables, createUser } = require('./db');

// Middleware
app.use(bodyParser.json());

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
app.get('/',(req,res)=>{
  res.send("Hi this is Classroom-Assignments Backend")
})
app.post('/api/users', async (req, res) => {
  const { username, password, role } = req.body;

  try {
      // Create a new User instance with the plain text password
      let newUser;
      if (role) {
          newUser = new User(username, password, role);
      } else {
          // If role is not provided, create user with default role as "student"
          newUser = new User(username, password, 'student');
      }

      // Save the user to the database
      await newUser.save();

      res.status(200).json({ message: 'User created successfully' });
  } catch (error) {
      if (error.code === 'UserAlreadyExists') {
          // Error code 'UserAlreadyExists' indicates that the user already exists
          res.status(400).json({ message: error.message });
      } else {
          // Log other types of errors
          console.error('Error creating user:', error);
          res.status(500).json({ message: 'Internal server error' });
      }
  }
});



app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Find user by username
    const user = await User.findByUsername(username);

    console.log('User:', user);

    if (!user || user.Password !== password) {
      console.log('Invalid credentials');
      console.log('Password provided:', password);
      console.log('Password in database:', user.Password);
      return res.status(404).json({ message: 'User not found or invalid credentials' });
    }

    console.log('Password matched');

    // Generate JWT token
    const token = jwt.sign({ id: user.UserID }, 'secretkey', { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    console.error('Error finding user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// Middleware for JWT authentication
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  jwt.verify(token, 'secretkey', (err, decoded) => {
    if (err) return res.status(403).json({ message: 'Forbidden' });
    req.userId = decoded.id;
    next();
  });
};

app.post('/api/assignments', verifyToken, async (req, res) => {
  const { title, description, dueDate } = req.body;
  const createdBy = req.userId; // Assuming user id is stored in JWT payload

  console.log('Request Body:', req.body);
  console.log('User ID (createdBy):', createdBy);

  try {
    // Create assignment object
    const assignment = new Assignment(title, description, dueDate, createdBy);

    console.log('Assignment:', assignment);

    assignment.save();

    res.status(201).json(assignment);
  } catch (error) {
    console.error('Error creating assignment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

//Get all assignments endpoint
app.get('/api/assignments', verifyToken, async (req, res) => {
  try {
    let filteredAssignments = await Assignment.find(); // Assuming Assignment model has a method to find all assignments

    // Example: Filter by title
    const { title } = req.query;
    if (title) {
      // console.log(title);
      filteredAssignments = await Assignment.findByTitle(title);
      // console.log(filteredAssignments)
    }

    res.json(filteredAssignments);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ message: 'Internal server error' });
  }

});

app.get('/api/assignments/sort', verifyToken, async (req, res) => {
  try {
      // Fetch student assignments sorted by due date
      const assignments = await Assignment.sort('dueDate');
      res.json(assignments);
  } catch (error) {
      console.error('Error fetching student assignments:', error);
      res.status(500).json({ message: 'Internal server error' });
  }
});
// Get all assignments endpoint with caching
// Create Redis client

// const redisClient = redis.createClient();

// // Promisify Redis get and set methods
// const redisGetAsync = util.promisify(redisClient.get).bind(redisClient);
// const redisSetAsync = util.promisify(redisClient.set).bind(redisClient);

// app.get('/api/assignments', verifyToken, async (req, res) => {
//   try {
//     // Check if data is available in cache
//     const cachedAssignments = await redisGetAsync('assignments');
//     if (cachedAssignments) {
//       console.log('Data retrieved from cache');
//       return res.json(JSON.parse(cachedAssignments));
//     }

//     // Fetch data from database
//     let filteredAssignments = await Assignment.find();

//     // Example: Filter by title
//     const { title } = req.query;
//     if (title) {
//       filteredAssignments = await Assignment.findByTitle(title);
//     }

//     // Store data in cache
//     await redisSetAsync('assignments', JSON.stringify(filteredAssignments));

//     res.json(filteredAssignments);
//   } catch (error) {
//     console.error('Error fetching assignments:', error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// });


// Update assignment endpoint
app.put('/api/assignments/:id', verifyToken, async(req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;
    let assignment=await Assignment.update(id,title,description)
    console.log(assignment)
    res.json(assignment);
  } catch (error) {
    console.error('Error updating assignment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete assignment endpoint
app.delete('/api/assignments/:id', verifyToken, async(req, res) => {
  try {
    const { id } = req.params;
    await Assignment.deleteById(id);
    res.status(204).send(); 
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Submit assignment endpoint
app.post('/api/assignments/:id/submit', verifyToken, async (req, res) => {
  try {
    const { id } = req.params; // Change assignmentID to id
    const { studentID } = req.body;
    const date = new Date(); // Get current date and time
    const submissionDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    // Create a new submission instance with the current date
    const submission = new Submission(id, studentID, submissionDate); // Use id instead of assignmentID

    // Save the submission to the database
    await submission.save();
    res.status(201).json({ message: 'Assignment submitted successfully' });
  } catch (error) {
    console.error('Error submitting assignment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Grade assignment endpoint
app.put('/api/assignments/:id/grade', verifyToken, async(req, res) => {
  try {
    const { id } = req.params;
    const { grade } = req.body;

    // Find the submission by ID and update the grade
    const submission = await Submission.findById(id);
    if (!submission) return res.status(404).json({ message: 'Submission not found' });

    // Update the submission in the database
    await Submission.update(id,grade);

    res.json({ message: 'Assignment graded successfully' });
  } catch (error) {
    console.error('Error grading assignment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/reports/:studentID', async (req, res) => {
  try {
      const { studentID } = req.params;

      // Fetch submissions of the student from the database
      const submissions = await Submission.findByStudentID(studentID);

      // If no submissions found, return an empty array
      if (!submissions || submissions.length === 0) {
          return res.status(404).json({ message: 'No submissions found for the student' });
      }

      // Calculate total grades and average grade
      let totalGrades = 0;
      submissions.forEach(submission => {
          totalGrades += submission.Grade;
      });
      const averageGrade = totalGrades / submissions.length;

      // Construct the report object
      const report = {
          studentID: studentID,
          submissions: submissions,
          totalSubmissions: submissions.length,
          totalGrades: totalGrades,
          averageGrade: averageGrade
      };

      // Send the report as response
      res.json(report);
  } catch (error) {
      console.error('Error fetching student report:', error);
      res.status(500).json({ message: 'Internal server error' });
  }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});