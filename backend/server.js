//This is the API gateway for Moodzic.
//It is responsible for handling all the requests from the frontend and interacting with the database.
//It also sends emails to users for password reset requests.

//-----ChatGPT was used to help with some of the code in this file.-----

"use strict";
require("dotenv").config();
const http = require("http");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const db = require("./database/database");
const nodemailer = require("nodemailer");
const messages = require("./localization/en/user.js");

const CORS_ORIGIN_URL = messages.server.cors.allowOrigin.prod;
const CORS_METHODS = messages.server.cors.allowMethods;
const CORS_HEADERS = messages.server.cors.allowHeaders;
const CORS_CONTENT_TYPE = messages.server.cors.allow_content_type;
const MAX_API_CALLS = 20;

const PORT = process.env.PORT || messages.server.port;
const JWT_SECRET = process.env.JWT_SECRET;

class Server {
  constructor() {
    this.server = http.createServer(this.handleRequest.bind(this));

    // Routing table
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
        "/getUserNumberOfRequests": this.getUserNumberOfRequests.bind(this),
      },
      PATCH: {
        "/incrementUserRequests": this.incrementUserRequests.bind(this),
      },
    };

    // Configure nodemailer
    this.transporter = nodemailer.createTransport({
      service: messages.server.email.service,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  // Start the server
  start() {
    this.server.listen(PORT, () => {
      console.log(
        messages.server.messages.success.server_running.replace("{port}", PORT)
      );
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
    res.setHeader("Access-Control-Allow-Origin", CORS_ORIGIN_URL);
    res.setHeader("Access-Control-Allow-Methods", CORS_METHODS);
    res.setHeader("Access-Control-Allow-Headers", CORS_HEADERS);
  }

  // Handle OPTIONS request
  handleOptions(req, res) {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": CORS_ORIGIN_URL,
      "Access-Control-Allow-Methods": CORS_METHODS,
      "Access-Control-Allow-Headers": CORS_HEADERS,
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
      res.writeHead(401, {
        "Content-Type": CORS_CONTENT_TYPE,
        "Access-Control-Allow-Origin": CORS_ORIGIN_URL,
      });
      res.end(JSON.stringify({ message: messages.server.auth.unauthorized }));
      return null;
    }

    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (err) {
      res.writeHead(403, {
        "Content-Type": CORS_CONTENT_TYPE,
        "Access-Control-Allow-Origin": CORS_ORIGIN_URL,
      });
      res.end(JSON.stringify({ message: messages.server.auth.forbidden }));
      return null;
    }
  }

  // Route: Register a new user
  async register(req, res) {
    try {
      const { email, password } = await this.parseJSONBody(req);

      const existingUser = await db.get(
        messages.database.queries.select.check_user_exists,
        [email]
      );
      if (existingUser) {
        res.writeHead(400, {
          "Content-Type": CORS_CONTENT_TYPE,
          "Access-Control-Allow-Origin": CORS_ORIGIN_URL,
        });
        res.end(
          JSON.stringify({
            message: messages.server.messages.warnings.user_exists,
          })
        );
        return;
      }

      const salt = crypto.randomBytes(16).toString("hex");
      const hashedPassword = this.hashPassword(password, salt);

      await db.run(messages.database.queries.insert.user, [
        email,
        hashedPassword,
        salt,
        0,
      ]);
      res.writeHead(201, {
        "Content-Type": CORS_CONTENT_TYPE,
        "Access-Control-Allow-Origin": CORS_ORIGIN_URL,
      });
      res.end(
        JSON.stringify({
          message: messages.server.messages.success.user_created,
        })
      );
    } catch (error) {
      res.writeHead(500, {
        "Content-Type": CORS_CONTENT_TYPE,
        "Access-Control-Allow-Origin": CORS_ORIGIN_URL,
      });
      res.end(
        JSON.stringify({
          message: messages.server.messages.errors.generic_500,
          error: error.message,
        })
      );
    }
  }

  // Route: Login a user
  async login(req, res) {
    try {
      const { email, password } = await this.parseJSONBody(req);

      const user = await db.get(
        messages.database.queries.select.check_user_exists,
        [email]
      );

      if (!user) {
        res.writeHead(400, {
          "Content-Type": CORS_CONTENT_TYPE,
          "Access-Control-Allow-Origin": CORS_ORIGIN_URL,
        });
        res.end(
          JSON.stringify({
            message: messages.server.messages.errors.user_not_found,
          })
        );
        return;
      }

      const hashedPassword = this.hashPassword(password, user.salt);
      if (hashedPassword !== user.password) {
        res.writeHead(401, {
          "Content-Type": CORS_CONTENT_TYPE,
          "Access-Control-Allow-Origin": CORS_ORIGIN_URL,
        });
        res.end(
          JSON.stringify({
            message: messages.server.messages.errors.invalid_credentials,
          })
        );
        return;
      }

      const token = jwt.sign(
        { user_id: user.user_id, role: user.role },
        JWT_SECRET,
        { expiresIn: "1h" }
      );

      res.writeHead(200, {
        "Content-Type": CORS_CONTENT_TYPE,
        "Access-Control-Allow-Origin": CORS_ORIGIN_URL,
      });
      res.end(JSON.stringify({ token, email: user.email, role: user.role }));
    } catch (error) {
      res.writeHead(500, {
        "Content-Type": CORS_CONTENT_TYPE,
        "Access-Control-Allow-Origin": CORS_ORIGIN_URL,
      });
      res.end(
        JSON.stringify({
          message: messages.server.messages.errors.generic_500,
          error: error.message,
        })
      );
    }
  }

  // Route: Request Password Reset
  async requestPasswordReset(req, res) {
    try {
      const { email } = await this.parseJSONBody(req);

      const user = await db.get(
        messages.database.queries.select.check_user_exists,
        [email]
      );
      if (!user) {
        res.writeHead(404, {
          "Content-Type": CORS_CONTENT_TYPE,
          "Access-Control-Allow-Origin": CORS_ORIGIN_URL,
        });
        res.end(
          JSON.stringify({
            message: messages.server.messages.errors.user_not_found,
          })
        );
        return;
      }

      const resetCode = crypto.randomInt(100000, 999999).toString();
      const resetCodeExpiry = new Date(Date.now() + 60 * 60 * 1000);

      await db.run(messages.database.queries.update.update_user_reset_code, [
        resetCode,
        resetCodeExpiry,
        email,
      ]);

      await this.sendResetEmail(email, resetCode);

      res.writeHead(200, {
        "Content-Type": CORS_CONTENT_TYPE,
        "Access-Control-Allow-Origin": CORS_ORIGIN_URL,
      });
      res.end(
        JSON.stringify({
          message: messages.server.messages.success.reset_code_sent,
        })
      );
    } catch (error) {
      res.writeHead(500, {
        "Content-Type": CORS_CONTENT_TYPE,
        "Access-Control-Allow-Origin": CORS_ORIGIN_URL,
      });
      res.end(
        JSON.stringify({
          message: messages.server.messages.errors.generic_500,
          error: error.message,
        })
      );
    }
  }

  // Method: Send Reset Email
  async sendResetEmail(email, resetCode) {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: messages.server.email.subject,
      text: messages.server.email.body.replace("{reset_code}", resetCode),
      html: messages.server.email.body_html.replace("{resetCode}", resetCode),
    };

    await this.transporter.sendMail(mailOptions);
  }

  // Route: Reset Password
  async resetPassword(req, res) {
    try {
      const { email, resetCode, newPassword } = await this.parseJSONBody(req);

      const user = await db.get(
        messages.database.queries.select.check_user_exists,
        [email]
      );
      if (!user || user.reset_code !== resetCode) {
        res.writeHead(400, {
          "Content-Type": CORS_CONTENT_TYPE,
          "Access-Control-Allow-Origin": CORS_ORIGIN_URL,
        });
        res.end(
          JSON.stringify({
            message: messages.server.messages.errors.invalid_reset,
          })
        );
        return;
      }

      const now = new Date();
      if (new Date(user.reset_code_expiry) < now) {
        res.writeHead(400, {
          "Content-Type": CORS_CONTENT_TYPE,
          "Access-Control-Allow-Origin": CORS_ORIGIN_URL,
        });
        res.end(
          JSON.stringify({
            message: messages.server.messages.errors.reset_code_expired,
          })
        );
        return;
      }

      const salt = crypto.randomBytes(16).toString("hex");
      const hashedPassword = this.hashPassword(newPassword, salt);

      await db.run(
        messages.database.queries.update.update_password_clear_reset_code,
        [hashedPassword, salt, email]
      );

      res.writeHead(200, {
        "Content-Type": CORS_CONTENT_TYPE,
        "Access-Control-Allow-Origin": CORS_ORIGIN_URL,
      });
      res.end(
        JSON.stringify({
          message: messages.server.messages.success.password_updated,
        })
      );
    } catch (error) {
      res.writeHead(500, {
        "Content-Type": CORS_CONTENT_TYPE,
        "Access-Control-Allow-Origin": CORS_ORIGIN_URL,
      });
      res.end(
        JSON.stringify({
          message: messages.server.messages.errors.generic_500,
          error: error.message,
        })
      );
    }
  }

  // Route: Get All Users Data
  async getAllUsersData(req, res) {
    const decoded = this.authenticateToken(req, res);
    if (!decoded) return;

    try {
      const users = await db.getAll(
        messages.database.queries.select.get_all_users_requests
      );

      res.writeHead(200, {
        "Content-Type": CORS_CONTENT_TYPE,
        "Access-Control-Allow-Origin": CORS_ORIGIN_URL,
      });
      res.end(JSON.stringify(users));
    } catch (error) {
      res.writeHead(500, {
        "Content-Type": CORS_CONTENT_TYPE,
        "Access-Control-Allow-Origin": CORS_ORIGIN_URL,
      });
      res.end(
        JSON.stringify({
          message: messages.server.messages.errors.generic_500,
          error: error.message,
        })
      );
    }
  }

  // Route: Get User Number of Requests
  async getUserNumberOfRequests(req, res) {
    const decoded = this.authenticateToken(req, res);
    if (!decoded) return;

    try {
      const user = await db.get(
        messages.database.queries.select.get_single_users_requests,
        [decoded.user_id]
      );

      if (!user) {
        res.writeHead(404, {
          "Content-Type": CORS_CONTENT_TYPE,
          "Access-Control-Allow-Origin": CORS_ORIGIN_URL,
        });
        res.end(
          JSON.stringify({
            message: messages.server.messages.errors.user_not_found,
          })
        );
        return;
      }

      if (user.number_of_requests >= MAX_API_CALLS) {
        res.writeHead(200, {
          "Content-Type": CORS_CONTENT_TYPE,
          "Access-Control-Allow-Origin": CORS_ORIGIN_URL,
        });
        res.end(
          JSON.stringify({
            message: messages.server.messages.warnings.usage_exceeded,
            number_of_requests: user.number_of_requests,
          })
        );
      } else {
        res.writeHead(200, {
          "Content-Type": CORS_CONTENT_TYPE,
          "Access-Control-Allow-Origin": CORS_ORIGIN_URL,
        });
        res.end(
          JSON.stringify({
            number_of_requests: user.number_of_requests,
          })
        );
      }
    } catch (error) {
      res.writeHead(500, {
        "Content-Type": CORS_CONTENT_TYPE,
        "Access-Control-Allow-Origin": CORS_ORIGIN_URL,
      });
      res.end(
        JSON.stringify({
          message: messages.server.messages.errors.generic_500,
          error: error.message,
        })
      );
    }
  }

  // Helper function to handle 404 Not Found
  notFound(res) {
    res.writeHead(404, {
      "Content-Type": CORS_CONTENT_TYPE,
      "Access-Control-Allow-Origin": CORS_ORIGIN_URL,
    });
    res.end(
      JSON.stringify({
        message: messages.server.messages.errors.route_not_found,
      })
    );
  }
}

// Initialize database and start the server
(async () => {
  await db.initializeTables();
  const server = new Server();
  server.start();
})();
