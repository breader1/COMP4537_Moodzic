"use strict";

const sqlite3 = require("sqlite3").verbose();

class Database {
  constructor(dbFilePath = ":memory:") {
    this.db = new sqlite3.Database(dbFilePath, (err) => {
      if (err) {
        console.error("Could not connect to database:", err);
      } else {
        console.log("Connected to the SQLite database.");
      }
    });
  }

  // Initialize tables
  initializeTables() {
    this.createUserTable();
    this.createServiceTable();
    this.seedUserTable();
  }

  // Create User table
  createUserTable() {
    const sql = `
        CREATE TABLE IF NOT EXISTS User (
            user_id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL UNIQUE,
            number_of_requests INTEGER DEFAULT 20,
            password TEXT NOT NULL,
            salt TEXT NOT NULL,
            role INTEGER DEFAULT 0,
            reset_code TEXT,                      -- Field for password reset code
            reset_code_expiry DATETIME,           -- New field for reset code expiry
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_login DATETIME,
            is_active BOOLEAN DEFAULT 1
        )
    `;
    this.run(sql);
  }

  // Create Service table
  createServiceTable() {
    const sql = `
            CREATE TABLE IF NOT EXISTS Service (
                service_id INTEGER PRIMARY KEY AUTOINCREMENT,
                prompt TEXT,
                user_id INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT 1,
                description TEXT,
                FOREIGN KEY (user_id) REFERENCES User(user_id)
            )
        `;
    this.run(sql);
  }

  // Method to seed the User table with sample data
  seedUserTable() {
    const users = [
      { email: "john@john.com", password: "123", role: 0 },
      { email: "admin@admin.com", password: "111", role: 1 },
    ];

    users.forEach(async (user) => {
      // Check if user already exists
      const existingUser = await this.get(
        "SELECT * FROM User WHERE email = ?",
        [user.email]
      );

      if (!existingUser) {
        // Generate a random salt
        const salt = this.generateSalt();
        // Hash the password with the salt
        const hashedPassword = this.hashPassword(user.password, salt);

        // Insert the user into the database
        await this.run(
          "INSERT INTO User (email, password, salt, role) VALUES (?, ?, ?, ?)",
          [user.email, hashedPassword, salt, user.role]
        );
        console.log(
          `User with email '${user.email}' has been added to the database.`
        );
      } else {
        console.log(
          `User with email '${user.email}' already exists. Skipping insertion.`
        );
      }
    });
  }

  // Helper method to generate a random salt
  generateSalt() {
    return require("crypto").randomBytes(16).toString("hex"); // 16 bytes salt
  }

  // Helper method to hash the password with salt
  hashPassword(password, salt) {
    const crypto = require("crypto");
    const hash = crypto.createHash("sha256");
    hash.update(password + salt);
    return hash.digest("hex");
  }

  // Run an SQL command
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function (err) {
        if (err) {
          console.error("Error running SQL:", sql, err);
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
  }

  // Get all rows from a query
  getAll(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          console.error("Error fetching rows:", sql, err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Get a single row
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          console.error("Error fetching row:", sql, err);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Close the database connection
  close() {
    this.db.close((err) => {
      if (err) {
        console.error("Error closing the database:", err);
      } else {
        console.log("Closed the database connection.");
      }
    });
  }
}

// Usage example:
const db = new Database("moodzic.db");
db.initializeTables();

module.exports = db;
