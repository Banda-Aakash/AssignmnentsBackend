const sqlite3 = require('sqlite3').verbose();

// Create a new SQLite database instance
const db = new sqlite3.Database('./classroom_assignments.db');

// Create tables
db.serialize(() => {
    // Create Users table
    db.run(`
        CREATE TABLE IF NOT EXISTS Users (
            UserID INTEGER PRIMARY KEY AUTOINCREMENT,
            Username TEXT NOT NULL,
            Password TEXT NOT NULL,
            Role TEXT NOT NULL
        )
    `);

    // Create Assignments table
    db.run(`
        CREATE TABLE IF NOT EXISTS Assignments (
            AssignmentID INTEGER PRIMARY KEY AUTOINCREMENT,
            Title TEXT NOT NULL,
            Description TEXT,
            DueDate DATE,
            CreatedBy INTEGER NOT NULL,
            FOREIGN KEY (CreatedBy) REFERENCES Users(UserID)
        )
    `);

    // Create Submissions table
    db.run(`
        CREATE TABLE IF NOT EXISTS Submissions (
            SubmissionID INTEGER PRIMARY KEY AUTOINCREMENT,
            AssignmentID INTEGER NOT NULL,
            StudentID INTEGER NOT NULL,
            SubmissionDate DATE NOT NULL,
            Grade INTEGER,
            FOREIGN KEY (AssignmentID) REFERENCES Assignments(AssignmentID),
            FOREIGN KEY (StudentID) REFERENCES Users(UserID)
        )
    `);

    console.log('Database tables created successfully');

    // Close the database connection
    db.close();
});
