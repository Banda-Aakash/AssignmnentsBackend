const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./classroom_assignments.db');

class User {
    constructor(username, password, role) {
        this.username = username;
        this.password = password;
        this.role = role;
    }

    save() {
        return new Promise((resolve, reject) => {
            const insertUserQuery = `
                INSERT INTO Users (Username, Password, Role)
                VALUES (?, ?, ?)
            `;
    
            // Check if the username already exists for the given role
            const checkUsernameQuery = `
                SELECT COUNT(*) as count FROM Users WHERE Username = ? AND Role = ?
            `;
    
            db.get(checkUsernameQuery, [this.username, this.role], (err, row) => {
                if (err) {
                    // Log database error
                    console.error('Error checking username:', err);
                    reject({ code: 'InternalServerError', message: 'Internal server error' });
                } else {
                    if (row.count > 0) {
                        // If the username already exists for the given role, reject with an error
                        reject({ code: 'UserAlreadyExists', message: 'User already exists for the given role' });
                    } else {
                        // If the username is unique for the given role, proceed with inserting the user
                        db.run(insertUserQuery, [this.username, this.password, this.role], function (err) {
                            if (err) {
                                // Log error
                                console.error('Error inserting user:', err);
                                reject({ code: 'InternalServerError', message: 'Internal server error' });
                            } else {
                                console.log(`User ${this.lastID} inserted successfully`);
                                resolve();
                            }
                        });
                    }
                }
            });
        });
    }
    

    static findByUsername(username) {
        const selectUserQuery = `
            SELECT * FROM Users WHERE Username = ?
        `;

        return new Promise((resolve, reject) => {
            db.get(selectUserQuery, [username], (err, row) => {
                if (err) {
                    console.error('Error finding user:', err);
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }
}
module.exports = { User};