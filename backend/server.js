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

const CORS_ORIGIN_URL = messages.server.cors.allow_origin.dev;
const CORS_METHODS = messages.server.cors.allow_methods;
const CORS_HEADERS = messages.server.cors.allow_headers;
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
        "/getUserNumberOfRequests": this.getUserNumberOfRequests.bind(this), //TODO: move the requests to the requests table
        //get numer of endpoint called overall

        //get numer of endpoint called by user
      },
      PATCH: {
        "/incrementUserRequests": this.incrementUserRequests.bind(this),
        "/updateRole/:id": this.updateUserRole.bind(this),
      },
      DELETE: {
        "/delete/:id": this.deleteUser.bind(this),
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

  //----------OPTIONS-----------
  handleOptions(req, res) {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": CORS_ORIGIN_URL,
      "Access-Control-Allow-Methods": CORS_METHODS,
      "Access-Control-Allow-Headers": CORS_HEADERS,
    });
    res.end();
  }

  //----------POST-----------
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
            message: messages.server.warnings.user_exists,
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
          message: messages.server.success.user_created,
        })
      );
    } catch (error) {
      res.writeHead(500, {
        "Content-Type": CORS_CONTENT_TYPE,
        "Access-Control-Allow-Origin": CORS_ORIGIN_URL,
      });
      res.end(
        JSON.stringify({
          message: messages.server.errors.generic_500,
          error: error.message,
        })
      );
    }
  }

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
            message: messages.server.errors.user_not_found,
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
            message: messages.server.errors.invalid_credentials,
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
          message: messages.server.errors.generic_500,
          error: error.message,
        })
      );
    }
  }

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
            message: messages.server.errors.user_not_found,
          })
        );
        return;
      }

      const resetCode = crypto.randomInt(100000, 999999).toString();
      const resetCodeExpiry = new Date(Date.now() + 60 * 60 * 1000);

      await db.run(messages.database.queries.update.user_reset_code, [
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
          message: messages.server.success.reset_code_sent,
        })
      );
    } catch (error) {
      res.writeHead(500, {
        "Content-Type": CORS_CONTENT_TYPE,
        "Access-Control-Allow-Origin": CORS_ORIGIN_URL,
      });
      res.end(
        JSON.stringify({
          message: messages.server.errors.generic_500,
          error: error.message,
        })
      );
    }
  }

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
            message: messages.server.errors.invalid_reset,
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
            message: messages.server.errors.reset_code_expired,
          })
        );
        return;
      }

      const salt = crypto.randomBytes(16).toString("hex");
      const hashedPassword = this.hashPassword(newPassword, salt);

      await db.run(messages.database.queries.update.password_clear_reset_code, [
        hashedPassword,
        salt,
        email,
      ]);

      res.writeHead(200, {
        "Content-Type": CORS_CONTENT_TYPE,
        "Access-Control-Allow-Origin": CORS_ORIGIN_URL,
      });
      res.end(
        JSON.stringify({
          message: messages.server.success.password_updated,
        })
      );
    } catch (error) {
      res.writeHead(500, {
        "Content-Type": CORS_CONTENT_TYPE,
        "Access-Control-Allow-Origin": CORS_ORIGIN_URL,
      });
      res.end(
        JSON.stringify({
          message: messages.server.errors.generic_500,
          error: error.message,
        })
      );
    }
  }

  //----------GET-----------
  async getAllUsersData(req, res) {
    const decoded = this.authenticateToken(req, res);
    if (!decoded) return;

    try {
      const users = await db.getAll(
        messages.database.queries.select.all_users_requests
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
          message: messages.server.errors.generic_500,
          error: error.message,
        })
      );
    }
  }

  async getUserNumberOfRequests(req, res) {
    const decoded = this.authenticateToken(req, res);
    if (!decoded) return;

    try {
      const user = await db.get(
        messages.database.queries.select.single_user_requests,
        [decoded.user_id]
      );

      if (!user) {
        res.writeHead(404, {
          "Content-Type": CORS_CONTENT_TYPE,
          "Access-Control-Allow-Origin": CORS_ORIGIN_URL,
        });
        res.end(
          JSON.stringify({
            message: messages.server.errors.user_not_found,
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
            message: messages.server.warnings.usage_exceeded,
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
          message: messages.server.errors.generic_500,
          error: error.message,
        })
      );
    }
  }

  //----------PATCH-----------
  async incrementUserRequests(req, res) {
    // Authenticate the user
    const decoded = this.authenticateToken(req, res);
    if (!decoded) return;

    try {
      // Get the user's current number_of_requests from the database
      const user = await db.get(
        messages.database.queries.select.num_user_requests,
        [decoded.user_id]
      );

      if (!user) {
        res.writeHead(404, {
          "Content-Type": CORS_CONTENT_TYPE,
          "Access-Control-Allow-Origin": CORS_ORIGIN_URL,
        });
        res.end(
          JSON.stringify({ message: messages.server.errors.user_not_found })
        );
        return;
      }

      // Increment the user's number_of_requests by 1
      const updatedRequests = user.number_of_requests + 1;
      await db.run(messages.database.queries.update.num_user_requests, [
        updatedRequests,
        decoded.user_id,
      ]);

      // Return the updated number_of_requests
      res.writeHead(200, {
        "Content-Type": CORS_CONTENT_TYPE,
        "Access-Control-Allow-Origin": CORS_ORIGIN_URL,
      });
      res.end(
        JSON.stringify({
          message: messages.server.success.request_updated,
          number_of_requests: updatedRequests,
        })
      );
    } catch (error) {
      res.writeHead(500, {
        "Content-Type": CORS_CONTENT_TYPE,
        "Access-Control-Allow-Origin": CORS_ORIGIN_URL,
      });
      res.end(
        JSON.stringify({
          message: messages.server.errors.generic_500,
          error: error.message,
        })
      );
    }
  }

  async updateUserRole(req, res, params) {
    const id = params.id;
    try {
      // Check if the requesting user is an admin
      const isAdmin = await this.isAdmin(req, res);
      if (!isAdmin) {
        res.writeHead(403, {
          "Content-Type": CORS_CONTENT_TYPE,
          "Access-Control-Allow-Origin": CORS_ORIGIN_URL,
        });
        res.end(
          JSON.stringify({ message: messages.server.auth.forbidden })
        );
        return;
      }

      // Retrieve the target user from the database
      const user = await db.get(
        messages.database.queries.select.check_user_exists_by_id,
        [id]
      );
      if (!user) {
        res.writeHead(404, {
          "Content-Type": CORS_CONTENT_TYPE,
          "Access-Control-Allow-Origin": CORS_ORIGIN_URL,
        });
        res.end(
          JSON.stringify({ message: messages.server.errors.user_not_found })
        );
        return;
      }

      // Toggle the user's role
      const newRole = user.role === 1 ? 0 : 1;
      await db.run(messages.database.queries.update.user_role_by_id, [newRole, id]);

      // Send success response with the updated role
      res.writeHead(200, {
        "Content-Type": CORS_CONTENT_TYPE,
        "Access-Control-Allow-Origin": CORS_ORIGIN_URL,
      });
      res.end(
        JSON.stringify({
          message: `User: ${id} role updated successfully to ${newRole}`,
          newRole,
        })
      );
    } catch (error) {
      if (!res.headersSent) {
        res.writeHead(500, {
          "Content-Type": CORS_CONTENT_TYPE,
          "Access-Control-Allow-Origin": CORS_ORIGIN_URL,
        });
        res.end(
          JSON.stringify({
            message: messages.server.errors.generic_500,
            error: error.message,
          })
        );
      }
    }
  }

  //----------DELETE-----------
  async deleteUser(req, res, params) {
    const id = params.id;
    try {
      // Check if the requesting user is an admin
      const isAdmin = await this.isAdmin(req, res);
      if (!isAdmin) {
        res.writeHead(403, {
          "Content-Type": CORS_CONTENT_TYPE,
          "Access-Control-Allow-Origin": CORS_ORIGIN_URL,
        });
        res.end(
          JSON.stringify({ message: messages.server.auth.unauthorized })
        );
        return;
      }

      // Check if the target user (to be deleted) exists
      const userToDelete = await db.get(
        messages.database.queries.select.check_user_exists_by_id,
        [id.toString()]
      );

      if (!userToDelete) {
        res.writeHead(404, {
          "Content-Type": CORS_CONTENT_TYPE,
          "Access-Control-Allow-Origin": CORS_ORIGIN_URL,
        });
        res.end(
          JSON.stringify({ message: messages.server.errors.user_not_found })
        );
        return;
      }

      // Proceed with deletion
      await db.run(messages.database.queries.delete.user_by_id, [
        id.toString(),
      ]);

      // Prepare success message - This had to be handled like this because
      // the headers were already being sent and the id was not being replaced in the message
      const successMessage = messages.server.success.user_deleted
        ? messages.server.success.user_deleted.replace("{id}", id)
        : `User with ID ${id} has been deleted successfully.`;

      // Send success response
      res.writeHead(200, {
        "Content-Type": CORS_CONTENT_TYPE,
        "Access-Control-Allow-Origin": CORS_ORIGIN_URL,
      });
      res.end(JSON.stringify({ message: successMessage }));
    } catch (error) {
      if (!res.headersSent) {
        res.writeHead(500, {
          "Content-Type": CORS_CONTENT_TYPE,
          "Access-Control-Allow-Origin": CORS_ORIGIN_URL,
        });
        res.end(
          JSON.stringify({
            message: messages.server.errors.generic_500,
            error: error.message,
          })
        );
      }
    }
  }

  // Start the server
  start() {
    this.server.listen(PORT, () => {
      console.log(
        messages.server.success.server_running.replace("{port}", PORT)
      );
    });
  }

  matchRoute(route, url) {
    const routeParts = route.split("/");
    const urlParts = url.split("/");

    if (routeParts.length !== urlParts.length) return null;

    const params = {};
    for (let i = 0; i < routeParts.length; i++) {
      if (routeParts[i].startsWith(":")) {
        const paramName = routeParts[i].substring(1);
        params[paramName] = urlParts[i];
      } else if (routeParts[i] !== urlParts[i]) {
        return null;
      }
    }
    return params; // Return parameters if all parts match
  }

  //handle the request
  async handleRequest(req, res) {
    // Set CORS headers for every request
    this.setCorsHeaders(res);

    const methodRoutes = this.routes[req.method];
    if (!methodRoutes) {
      this.notFound(res);
      return;
    }

    // Attempt to match static and dynamic routes
    let handler;
    let params = null;

    for (const route in methodRoutes) {
      params = this.matchRoute(route, req.url);
      if (params) {
        handler = methodRoutes[route];
        break;
      }
    }

    if (handler) {
      await handler(req, res, params); // Pass params to the handler if matched
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

  // Helper function to handle 404 Not Found
  notFound(res) {
    res.writeHead(404, {
      "Content-Type": CORS_CONTENT_TYPE,
      "Access-Control-Allow-Origin": CORS_ORIGIN_URL,
    });
    res.end(
      JSON.stringify({
        message: messages.server.errors.route_not_found,
      })
    );
  }

  // Function to check if the requesting user is an admin
  async isAdmin(req, res) {
    const decoded = this.authenticateToken(req, res);
    if (!decoded) return false; // Return false if the user is not authenticated

    // Check the user's role in the database
    const user = await db.get(
      messages.database.queries.select.check_user_exists_by_id,
      [decoded.user_id]
    );
    return user && user.role === 1; // Return true if the user is found and has an admin role
  }
}

// Initialize database and start the server
(async () => {
  await db.initializeTables();
  const server = new Server();
  server.start();
})();
