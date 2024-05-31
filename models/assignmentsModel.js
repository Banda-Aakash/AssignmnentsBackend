const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./classroom_assignments.db');

class Assignment {
    constructor(title, description, dueDate, createdBy) {
        this.title = title;
        this.description = description;
        this.dueDate = dueDate;
        this.createdBy = createdBy;
    }

    save() {
        const insertAssignmentQuery = `
            INSERT INTO Assignments (Title, Description, DueDate, CreatedBy)
            VALUES (?, ?, ?, ?)
        `;
    
        db.run(insertAssignmentQuery, [this.title, this.description, this.dueDate, this.createdBy], (err) => {
            if (err) {
                console.error('Error inserting assignment:', err);
            } else {
                console.log(`Assignment ${this.lastID} inserted successfully`);
            }
        });
    }    

    static find() {
        return new Promise((resolve, reject) => {
            const selectAssignmentsQuery = `
                SELECT * FROM Assignments
            `;
        
            db.all(selectAssignmentsQuery, (err, rows) => {
                if (err) {
                    console.error('Error fetching assignments:', err);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    static findByTitle(title) {
        return new Promise((resolve, reject) => {
            const selectAssignmentsQuery = `
                SELECT * FROM Assignments WHERE Title LIKE ?
            `;
        
            db.all(selectAssignmentsQuery, [`%${title}%`], (err, rows) => {
                // console.log("hi")
                if (err) {
                    console.error('Error fetching assignments by title:', err);
                    reject(err);
                } else {
                    // console.log(rows);
                    resolve(rows);
                }
            });
        });
    }


    // static findById(id) {
    //     return new Promise((resolve, reject) => {
    //         const selectAssignmentQuery = `
    //             SELECT * FROM Assignments WHERE AssignmentID = ?
    //         `;
        
    //         db.get(selectAssignmentQuery, [id], (err, row) => {
    //             if (err) {
    //                 console.error('Error fetching assignment by ID:', err);
    //                 reject(err);
    //             } else {
    //                 if (row) {
    //                     resolve(assignment);
    //                 } else {
    //                     resolve(null); // No assignment found
    //                 }
    //             }
    //         });
    //     });
    // }

    static sort(sortBy = 'dueDate') {
        return new Promise((resolve, reject) => {
            const selectAssignmentsQuery = `
                SELECT * FROM Assignments
                ORDER BY ${sortBy}
            `;
    
            db.all(selectAssignmentsQuery, (err, rows) => {
                if (err) {
                    console.error('Error fetching assignments:', err);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    static update(id, title, description) {
        return new Promise((resolve, reject) => {
            const updateAssignmentQuery = `
                UPDATE Assignments 
                SET Title = ?, Description = ? 
                WHERE AssignmentID = ?
            `;
        
            db.run(updateAssignmentQuery, [title, description, id], function(err) {
                if (err) {
                    console.error('Error updating assignment:', err);
                    reject(err);
                } else {
                    console.log(`Assignment ${id} updated successfully`);
                    resolve("Assignment Updated");
                }
            });
        });
    }

    static deleteById(id) {
        return new Promise((resolve, reject) => {
            const deleteAssignmentQuery = `
                DELETE FROM Assignments WHERE AssignmentID = ?
            `;
        
            db.run(deleteAssignmentQuery, [id], function(err) {
                if (err) {
                    console.error('Error deleting assignment:', err);
                    reject(err);
                } else {
                    console.log(`Assignment ${id} deleted successfully`);
                    resolve(`Assignment ${id} deleted successfully`);
                }
            });
        });
    }
    
}



module.exports={Assignment};