"use strict";
require("dotenv").config();
const http = require("http");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const db = require("./database/database");

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;

class Server {
  constructor() {
    this.server = http.createServer(this.handleRequest.bind(this));

    // Define routing table
    this.routes = {
      OPTIONS: {
        "*": this.handleOptions.bind(this),
      },
      POST: {
        "/register": this.register.bind(this),
        "/login": this.login.bind(this),
        "/requestPasswordReset": this.requestPasswordReset.bind(this),
        "/resetPassword": this.resetPassword.bind(this),
      },
      GET: {
        "/getAllUsersData": this.getAllUsersData.bind(this),
      },
    };

    this.transporter = nodemailer.createTransport({
      service: "gmail", // or use 'smtp' with custom SMTP settings
      auth: {
        user: process.env.EMAIL_USER, // Your email address
        pass: process.env.EMAIL_PASSWORD, // Your email password or app-specific password
      },
    });
  }

  // Start the server
  start() {
    this.server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }

  // Main request handler
  async handleRequest(req, res) {
    // Set CORS headers for every request
    this.setCorsHeaders(res);

    const methodRoutes = this.routes[req.method];
    const handler =
      methodRoutes && (methodRoutes[req.url] || methodRoutes["*"]);

    if (handler) {
      await handler(req, res);
    } else {
      this.notFound(res);
    }
  }

  // Set CORS headers
  setCorsHeaders(res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
  }

  // Handle OPTIONS request
  handleOptions(res) {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Content-Length": "0",
    });
    res.end();
  }

  // Helper function to parse JSON body
  parseJSONBody(req) {
    return new Promise((resolve, reject) => {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });
      req.on("end", () => {
        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  // Helper function for password hashing
  hashPassword(password, salt) {
    const hash = crypto.createHash("sha256");
    hash.update(password + salt);
    return hash.digest("hex");
  }

  // Middleware function to authenticate JWT token
  authenticateToken(req, res) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Unauthorized" }));
      return null;
    }

    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (err) {
      res.writeHead(403, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Forbidden" }));
      return null;
    }
  }

  // New endpoint to initiate password reset
  async requestPasswordReset(req, res) {
    try {
      const { email } = await this.parseJSONBody(req);

      // Find the user in the database
      const user = await db.get("SELECT * FROM User WHERE email = ?", [email]);
      if (!user) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "User not found" }));
        return;
      }

      // Generate a reset code and set an expiry time (e.g., 1 hour from now)
      const resetCode = crypto.randomBytes(20).toString("hex");
      const resetCodeExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Update the user record with the reset code and expiry
      await db.run(
        "UPDATE User SET reset_code = ?, reset_code_expiry = ? WHERE email = ?",
        [resetCode, resetCodeExpiry, email]
      );

      // Send the reset code via email
      await this.sendResetEmail(email, resetCode);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Password reset code has been sent" }));
    } catch (error) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          message: "Error processing request",
          error: error.message,
        })
      );
    }
  }

  // New method to send the reset email
  async sendResetEmail(email, resetCode) {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset Request",
      text: `You requested a password reset. Your reset code is: ${resetCode}`,
      html: `<p>You requested a password reset.</p><p>Your reset code is: <b>${resetCode}</b></p>`,
    };

    await this.transporter.sendMail(mailOptions);

    //-----THIS CONSOLE LOG CAN'T BE USED IN PRODUCTION CODE ensure it's commented out before you push-----
    //console.log(`Reset code sent to ${email}`);
  }

  // New endpoint to complete the password reset
  async resetPassword(req, res) {
    try {
      const { email, resetCode, newPassword } = await this.parseJSONBody(req);

      // Find the user in the database
      const user = await db.get("SELECT * FROM User WHERE email = ?", [email]);
      if (!user || user.reset_code !== resetCode) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({ message: "Invalid reset code or user not found" })
        );
        return;
      }

      // Check if the reset code has expired
      const now = new Date();
      if (new Date(user.reset_code_expiry) < now) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Reset code has expired" }));
        return;
      }

      // Generate a new salt and hash the new password
      const salt = crypto.randomBytes(16).toString("hex");
      const hashedPassword = this.hashPassword(newPassword, salt);

      // Update the password and clear the reset code and expiry
      await db.run(
        "UPDATE User SET password = ?, salt = ?, reset_code = NULL, reset_code_expiry = NULL WHERE email = ?",
        [hashedPassword, salt, email]
      );

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({ message: "Password has been reset successfully" })
      );
    } catch (error) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          message: "Error processing request",
          error: error.message,
        })
      );
    }
  }

  // Route: Register a new user
  async register(req, res) {
    try {
      const { email, password } = await this.parseJSONBody(req);

      // Check if the user already exists
      const existingUser = await db.get("SELECT * FROM User WHERE email = ?", [
        email,
      ]);
      if (existingUser) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "User already exists" }));
        return;
      }

      // Create salt and hash password
      const salt = crypto.randomBytes(16).toString("hex");
      const hashedPassword = this.hashPassword(password, salt);

      // Insert user into database
      await db.run(
        "INSERT INTO User (email, password, salt, role) VALUES (?, ?, ?, ?)",
        [email, hashedPassword, salt, 0] // be default, all users are regular users
      );
      res.writeHead(201, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "User registered successfully" }));
    } catch (error) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          message: "Error processing request",
          error: error.message,
        })
      );
    }
  }

  // Route: Login a user
  async login(req, res) {
    try {
      const { email, password } = await this.parseJSONBody(req);

      // Retrieve user from database
      const user = await db.get("SELECT * FROM User WHERE email = ?", [email]);

      if (!user) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "User not found" }));
        return;
      }

      // Hash the input password with the stored salt and compare
      const hashedPassword = this.hashPassword(password, user.salt);
      if (hashedPassword !== user.password) {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Invalid credentials" }));
        return;
      }

      // Generate JWT
      const token = jwt.sign(
        { user_id: user.user_id, role: user.role },
        JWT_SECRET,
        { expiresIn: "1h" }
      );

      // Respond with token, num_requests, and role
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          token,
          number_of_requests: user.number_of_requests,
          role: user.role,
        })
      );
    } catch (error) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          message: "Error processing request",
          error: error.message,
        })
      );
    }
  }

  // Route: Get all users' data
  async getAllUsersData(req, res) {
    // Authenticate the request
    const decoded = this.authenticateToken(req, res);
    if (!decoded) return;

    try {
      // Retrieve all users' data from the database
      const users = await db.getAll(
        "SELECT email, number_of_requests FROM User"
      );

      // Respond with the list of users
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(users));
    } catch (error) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          message: "Error processing request",
          error: error.message,
        })
      );
    }
  }

  // Helper function to handle 404 Not Found
  notFound(res) {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Route not found" }));
  }
}

// Create and start the server
const server = new Server();
server.start();
