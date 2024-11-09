//This is the database class that is responsible for creating the database and the tables.
//It also seeds the User table with sample data.

//To avoid SQL injection attacks, we use prepared statements to execute SQL queries.

//-----ChatGPT was used to help with some of the code in this file.-----
"use strict";

const sqlite3 = require("sqlite3").verbose();
const messages = require("../localization/en/user.js");

class Database {
  constructor(dbFilePath = ":memory:") {
    this.db = new sqlite3.Database(dbFilePath, (err) => {
      if (err) {
        console.error(messages.database.errors.connection, err);
      } else {
        console.log(messages.database.success.connection);
      }
    });
  }

  // Initialize tables
  async initializeTables() {
    try {
      await this.createUserTable();
      await this.createServiceTable();
      await this.seedUserTable();
    } catch (err) {
      console.error(messages.database.errors.table_creation, err);
    }
  }

  async createUserTable() {
    const sql = messages.database.queries.create.user_table;
    await this.run(sql);
  }

  async createServiceTable() {
    const sql = messages.database.queries.create.service_table;
    await this.run(sql);
  }

  async seedUserTable() {
    const users = [
      {
        email: messages.database.default_user_email,
        password: messages.database.default_user_password,
        role: 0,
      },
      {
        email: messages.database.admin_user_email,
        password: messages.database.admin_user_password,
        role: 1,
      },
    ];

    for (const user of users) {
      // Check if user already exists
      const existingUser = await this.get(
        messages.database.queries.select.check_user_exists,
        [user.email]
      );

      if (!existingUser) {
        // Generate a random salt
        const salt = this.generateSalt();
        // Hash the password with the salt
        const hashedPassword = this.hashPassword(user.password, salt);

        // Insert the user into the database
        await this.run(messages.database.queries.insert.user, [
          user.email,
          hashedPassword,
          salt,
          user.role,
        ]);
        console.log(
          messages.database.success.user_insert.replace("{email}", user.email)
        );
      } else {
        console.log(
          messages.database.warnings.skipped_user_insert.replace("{email}",user.email)
        );
      }
    }
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

  // Run an SQL command - params is an array of values to bind to the query for prepared statements
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function (err) {
        if (err) {
          console.error(messages.database.errors.sql_execution, sql, err);
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
          console.error(messages.database.errors.fetch_all_rows, sql, err);
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
          console.error(messages.database.errors.fetch_single_row, sql, err);
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
        console.error(messages.database.errors.closing_db, err);
      } else {
        console.log(messages.database.messages.closed_db);
      }
    });
  }
}

const db = new Database(messages.database.database_name);

module.exports = db;
