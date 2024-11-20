//This is the database class that is responsible for creating the database and the tables.
//It also seeds the User table with sample data.

//To avoid SQL injection attacks, we use prepared statements to execute SQL queries.

//-----ChatGPT was used to help with some of the code in this file.-----
"use strict";

const sqlite3 = require("sqlite3").verbose();
const { STATUS_CODES } = require("http");
const messages = require("../localization/en/user.js");

const Role = {
  Admin: 1,
  User: 2,
};

const Method = {
  GET: 1,
  POST: 2,
  PATCH: 3,
  DELETE: 4,
};

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
      console.log("User table created");

      await this.createRequestTable();
      console.log("Request table created");

      await this.createRoleTable();
      console.log("Role table created");

      await this.createMethodTable();
      console.log("Method table created");

      await this.createEndpointTable();
      console.log("Endpoint table created");

      await this.seedRoleTable();
      console.log("Role table seeded");

      await this.seedUserTable();
      console.log("User table seeded");

      await this.seedMethodTable();
      console.log("Method table seeded");

      await this.seedEndpointTable();
      console.log("Endpoint table seeded");

      await this.seedRequestTable();
      console.log("Request table seeded");

      console.log(messages.database.success.initialization);
    } catch (err) {
      console.error(messages.database.errors.table_creation, err);
    }
  }

  async createUserTable() {
    const sql = messages.database.queries.create.user_table;
    await this.run(sql);
  }

  async createRequestTable() {
    const sql = messages.database.queries.create.request_table;
    await this.run(sql);
  }

  async createRoleTable() {
    const sql = messages.database.queries.create.role_table;
    await this.run(sql);
  }

  async createMethodTable() {
    const sql = messages.database.queries.create.method_table;
    await this.run(sql);
  }

  async createEndpointTable() {
    const sql = messages.database.queries.create.endpoint_table;
    await this.run(sql);
  }

  async seedUserTable() {
    const users = [
      {
        email: messages.database.admin_user_email,
        password: messages.database.admin_user_password,
        role: Role.Admin, // role_id 1 is Admin
      },
      {
        email: messages.database.default_user_email,
        password: messages.database.default_user_password,
        role: Role.User, // role_id 2 is User
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
          user.role,
          user.email,
          hashedPassword,
          salt,
        ]);
        console.log(
          messages.database.success.user_insert.replace("{email}", user.email)
        );
      } else {
        console.log(
          messages.database.warnings.skipped_user_insert.replace(
            "{email}",
            user.email
          )
        );
      }
    }
  }

  // Seed Role Table
  async seedRoleTable() {
    const roles = [
      {
        role_name: "Admin",
      },
      {
        role_name: "User",
      },
    ];

    for (const role of roles) {
      // Check if role already exists
      const existingRole = await this.get(
        messages.database.queries.select.check_role_exists,
        [role.role_name]
      );

      if (!existingRole) {
        // Insert the role into the database
        await this.run(messages.database.queries.insert.role, [role.role_name]);
        console.log(
          messages.database.success.role_insert.replace(
            "{role_name}",
            role.role_name
          )
        );
      } else {
        console.log(
          messages.database.warnings.skipped_role_insert.replace(
            "{role_name}",
            role.role_name
          )
        );
      }
    }
  }

  // Seed Method Table
  async seedMethodTable() {
    const methods = [
      {
        method_name: "GET",
      },
      {
        method_name: "POST",
      },
      {
        method_name: "PATCH",
      },
      {
        method_name: "DELETE",
      },
      // {
      //   method_name: "OPTIONS", needed?
      // }
    ];

    for (const method of methods) {
      // Check if method already exists
      const existingMethod = await this.get(
        messages.database.queries.select.check_method_exists,
        [method.method_name]
      );

      if (!existingMethod) {
        // Insert the method into the database
        await this.run(messages.database.queries.insert.method, [
          method.method_name,
        ]);
        console.log(
          messages.database.success.method_insert.replace(
            "{method_name}",
            method.method_name
          )
        );
      } else {
        console.log(
          messages.database.warnings.skipped_method_insert.replace(
            "{method_name}",
            method.method_name
          )
        );
      }
    }
  }

  // Seed Endpoint Table
  async seedEndpointTable() {
    const endpoints = [
      {
        method_id: Method.GET, // method_id 1 is GET
        endpoint_name: "/getAllUsersData",
      },
      {
        method_id: Method.POST, // method_id 2 is POST
        endpoint_name: "/register",
      },
      {
        method_id: Method.POST,
        endpoint_name: "/login",
      },
      {
        method_id: Method.POST,
        endpoint_name: "/requestPasswordReset",
      },
      {
        method_id: Method.POST,
        endpoint_name: "/resetPassword",
      },
      {
        method_id: Method.PATCH, // method_id 3 is PATCH
        endpoint_name: "/updateRole",
      },
      {
        method_id: Method.DELETE, // method_id 4 is DELETE
        endpoint_name: "/delete",
      },
      {
        method_id: Method.GET,
        endpoint_name: "/getNumberOfRequestsByEndpoint",
      },
      {
        method_id: Method.GET,
        endpoint_name: "/getEndpointsCalledByUser",
      },
      {
        method_id: Method.POST,
        endpoint_name: "/generate-audio",
      },
    ];

    for (const endpoint of endpoints) {
      // Check if endpoint already exists
      const existingEndpoint = await this.get(
        messages.database.queries.select.check_endpoint_exists,
        [endpoint.endpoint_name]
      );

      if (!existingEndpoint) {
        // Insert the endpoint into the database
        await this.run(messages.database.queries.insert.endpoint, [
          endpoint.method_id,
          endpoint.endpoint_name,
        ]);
        console.log(
          messages.database.success.endpoint_insert.replace(
            "{endpoint_name}",
            endpoint.endpoint_name
          )
        );
      } else {
        console.log(
          messages.database.warnings.skipped_endpoint_insert.replace(
            "{endpoint_name}",
            endpoint.endpoint_name
          )
        );
      }
    }
  }

  async seedRequestTable() {
    const requests = [
      {
        user_id: 1, 
        endpoint_id: 1,
        status_code: 900, // Custom status code for testing
      },
    ];

    for (const request of requests) {
      // Check if request already exists
      const existingRequest = await this.get(
        messages.database.queries.select.check_request_exists,
        [request.user_id, request.endpoint_id]
      );

      if (!existingRequest) {
        // Insert the request into the database
        await this.run(messages.database.queries.insert.request, [
          request.user_id,
          request.endpoint_id,
          request.status_code,
        ]);
        console.log(
          messages.database.success.request_insert.replace(
            "{user_id}",
            request.user_id
          )
        );
      } else {
        console.log(
          messages.database.warnings.skipped_request_insert.replace(
            "{user_id}",
            request.user_id
          )
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
