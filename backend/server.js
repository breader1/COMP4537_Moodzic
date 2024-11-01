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
  }

  // Start the server
  start() {
    this.server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }

  // Main request handler that directs requests to the correct method
  async handleRequest(req, res) {
    // Set CORS headers for every request
    this.setCorsHeaders(res);

    if (req.method === "OPTIONS") {
      this.handleOptions(res);
    } else if (req.method === "POST" && req.url === "/register") {
      await this.register(req, res);
    } else if (req.method === "POST" && req.url === "/login") {
      await this.login(req, res);
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

  // Helper function to handle 404 Not Found
  notFound(res) {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Route not found" }));
  }
}

// Create and start the server
const server = new Server();
server.start();
