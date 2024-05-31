const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./classroom_assignments.db');


class Submission {
    constructor(assignmentID, studentID, submissionDate, grade) {
        this.assignmentID = assignmentID;
        this.studentID = studentID;
        this.submissionDate = submissionDate;
        this.grade = grade;
    }

    save() {
        const insertSubmissionQuery = `
            INSERT INTO Submissions (AssignmentID, StudentID, SubmissionDate, Grade)
            VALUES (?, ?, ?, ?)
        `;

        db.run(insertSubmissionQuery, [this.assignmentID, this.studentID, this.submissionDate, this.grade], function (err) {
            if (err) {
                console.error('Error inserting submission:', err);
            } else {
                console.log(`Submission ${this.lastID} inserted successfully`);
            }
        });
    }

    static findById(id) {
        return new Promise((resolve, reject) => {
            const findSubmissionQuery = `
                SELECT * FROM Submissions WHERE SubmissionID = ?
            `;

            db.get(findSubmissionQuery, [id], (err, row) => {
                if (err) {
                    console.error('Error finding submission:', err);
                    reject(err);
                } else if (!row) {
                    resolve(null); // No submission found with the given ID
                } else {
                    const submission = new Submission(row.AssignmentID, row.StudentID, row.SubmissionDate, row.Grade);
                    resolve(submission);
                }
            });
        });
    }


    static async update(submissionID, newGrade) {
        try {
            const updateGradeQuery = `
                UPDATE Submissions 
                SET Grade = ?
                WHERE SubmissionID = ?
            `;

            await db.run(updateGradeQuery, [newGrade, submissionID]);
            console.log(`Grade updated successfully for submission ${submissionID}`);
        } catch (error) {
            console.error('Error updating grade:', error);
            throw error;
        }
    }

    static async findByStudentID(studentID) {
        try {
            const findSubmissionsQuery = `
                SELECT * FROM Submissions
                WHERE StudentID = ?
            `;
            const submissions = await new Promise((resolve, reject) => {
                db.all(findSubmissionsQuery, [studentID], (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                });
            });
            return submissions;
        } catch (error) {
            console.error('Error fetching submissions by student ID:', error);
            throw error;
        }
    }
}

module.exports={Submission}