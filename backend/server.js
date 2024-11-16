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

const path = require("path");
const fs = require("fs");
const swaggerUiPath = path.join(__dirname, "swagger-ui-dist");

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
        "/generate-audio": this.generateAudio.bind(this), //TODO: Add to SWAGGER
      },
      GET: {
        "/getAllUsersData": this.getAllUsersData.bind(this),
        "/api-docs": this.serveSwaggerUI.bind(this), //not tracked on purpose
        "/swagger.json": this.serveSwaggerJSON.bind(this), //not tracked on purpose
        "/getNumberOfRequestsByEndpoint": this.getNumberOfRequestsByEndpoint.bind(this), //TODO: Add to SWAGGER
        "/getEndpointsCalledByUser": this.getEndpointsCalledByUser.bind(this), //TODO: Add to SWAGGER
      },
      PATCH: {
        //TODO remove /incrementUserRequests from SWAGGER
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

  serveSwaggerJSON(req, res) {
    const filePath = path.join(__dirname, "swagger.json");
    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Swagger JSON not found" }));
      } else {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(data);
      }
    });
  }

  serveSwaggerUI(req, res) {
    let filePath;

    // Serve the main HTML file for Swagger UI
    if (req.url === "/api-docs" || req.url === "/api-docs/") {
      filePath = path.join(swaggerUiPath, "index.html");
    } else {
      // Serve asset files like CSS and JS by removing "/api-docs" prefix
      const assetPath = req.url.replace("/api-docs", "");
      filePath = path.join(swaggerUiPath, assetPath);
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { "Content-Type": "text/html" });
        res.end("404 Not Found");
        return;
      }

      // Set the appropriate content type based on file extension
      const ext = path.extname(filePath);
      const contentType =
        {
          ".html": "text/html",
          ".css": "text/css",
          ".js": "application/javascript",
          ".png": "image/png",
          ".svg": "image/svg+xml",
          ".json": "application/json",
        }[ext] || "text/plain";

      res.writeHead(200, { "Content-Type": contentType });
      res.end(data);
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
  async generateAudio(req, res) {
    const decoded = this.authenticateToken(req, res);
    if (!decoded) return;
    const logged_user_id = decoded.user_id;
    let statusCode = 200;

    try {
      // Parse the JSON body from the request
      const { promptText } = await this.parseJSONBody(req);

      // Send a POST request to the LLM API with the prompt
      const llmResponse = await fetch(messages.server.llm_endpoint, {
        method: messages.server.http_methods.post,
        headers: {
          "Content-Type": CORS_CONTENT_TYPE,
        },
        body: JSON.stringify({
          prompt: promptText,
          filename: "generated_audio",
        }),
      });

      // Check if the LLM API responded successfully
      if (!llmResponse.ok) {
        throw new Error(
          `${messages.server.errors.llm_api_error} ${llmResponse.statusText}`
        );
      }

      // Buffer the response data
      const arrayBuffer = await llmResponse.arrayBuffer();
      const audioData = Buffer.from(arrayBuffer);

      // Set headers and send the buffered data back to the frontend
      res.writeHead(statusCode, {
        "Content-Type": "audio/wav",
        "Content-Disposition": "attachment; filename=generated_audio.wav",
      });
      res.end(audioData);
    } catch (error) {
      statusCode = 500;
      if (!res.headersSent) {
        res.writeHead(statusCode, {
          "Content-Type": CORS_CONTENT_TYPE,
          "Access-Control-Allow-Origin": CORS_ORIGIN_URL,
        });
        res.end(
          JSON.stringify({
            message: messages.server.errors.generate_audio,
            error: error.message,
          })
        );
      }
    } finally {
      await this.logRequest(req, logged_user_id, statusCode);
    }
  }

  async register(req, res) {
    let statusCode = 400;
    let logged_user_id = null;
    try {
      const { email, password } = await this.parseJSONBody(req);

      const existingUser = await db.get(
        messages.database.queries.select.check_user_exists,
        [email]
      );
      logged_user_id = existingUser ? existingUser.user_id : null;
      if (existingUser) {
        res.writeHead(statusCode, {
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
        2, // Default role is 2 (user)
        email,
        hashedPassword,
        salt,
      ]);

      // Retrieve the newly created user's ID
      const newUser = await db.get(
        messages.database.queries.select.check_user_exists,
        [email]
      );
      logged_user_id = newUser.user_id;
      statusCode = 201;
      res.writeHead(statusCode, {
        "Content-Type": CORS_CONTENT_TYPE,
        "Access-Control-Allow-Origin": CORS_ORIGIN_URL,
      });
      res.end(
        JSON.stringify({
          message: messages.server.success.user_created,
        })
      );
    } catch (error) {
      statusCode = 500;
      res.writeHead(statusCode, {
        "Content-Type": CORS_CONTENT_TYPE,
        "Access-Control-Allow-Origin": CORS_ORIGIN_URL,
      });
      res.end(
        JSON.stringify({
          message: messages.server.errors.generic_500,
          error: error.message,
        })
      );
    } finally {
      await this.logRequest(req, logged_user_id, statusCode);
    }
  }

  async login(req, res) {
    let statusCode = 400;
    let logged_user_id = null;
    try {
      const { email, password } = await this.parseJSONBody(req);

      const user = await db.get(
        messages.database.queries.select.check_user_exists,
        [email]
      );

      logged_user_id = user.user_id;

      if (!user) {
        res.writeHead(statusCode, {
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
        statusCode = 401;
        res.writeHead(statusCode, {
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
      statusCode = 200;
      res.writeHead(statusCode, {
        "Content-Type": CORS_CONTENT_TYPE,
        "Access-Control-Allow-Origin": CORS_ORIGIN_URL,
      });
      res.end(JSON.stringify({ token, email: user.email, role: user.role }));
    } catch (error) {
      statusCode = 500;
      res.writeHead(statusCode, {
        "Content-Type": CORS_CONTENT_TYPE,
        "Access-Control-Allow-Origin": CORS_ORIGIN_URL,
      });
      res.end(
        JSON.stringify({
          message: messages.server.errors.generic_500,
          error: error.message,
        })
      );
    } finally {
      await this.logRequest(req, logged_user_id, statusCode);
    }
  }

  async requestPasswordReset(req, res) {
    let statusCode = 404;
    let logged_user_id = null;
    try {
      const { email } = await this.parseJSONBody(req);

      const user = await db.get(
        messages.database.queries.select.check_user_exists,
        [email]
      );
      logged_user_id = user.user_id;
      if (!user) {
        res.writeHead(statusCode, {
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
      statusCode = 200;
      res.writeHead(statusCode, {
        "Content-Type": CORS_CONTENT_TYPE,
        "Access-Control-Allow-Origin": CORS_ORIGIN_URL,
      });
      res.end(
        JSON.stringify({
          message: messages.server.success.reset_code_sent,
        })
      );
    } catch (error) {
      statusCode = 500;
      res.writeHead(statusCode, {
        "Content-Type": CORS_CONTENT_TYPE,
        "Access-Control-Allow-Origin": CORS_ORIGIN_URL,
      });
      res.end(
        JSON.stringify({
          message: messages.server.errors.generic_500,
          error: error.message,
        })
      );
    } finally {
      await this.logRequest(req, logged_user_id, statusCode);
    }
  }

  async resetPassword(req, res) {
    let statusCode = 400;
    let logged_user_id = null;
    try {
      const { email, resetCode, newPassword } = await this.parseJSONBody(req);

      const user = await db.get(
        messages.database.queries.select.check_user_exists,
        [email]
      );
      logged_user_id = user.user_id;
      if (!user || user.reset_code !== resetCode) {
        res.writeHead(statusCode, {
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
        res.writeHead(statusCode, {
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
      statusCode = 200;
      res.writeHead(statusCode, {
        "Content-Type": CORS_CONTENT_TYPE,
        "Access-Control-Allow-Origin": CORS_ORIGIN_URL,
      });
      res.end(
        JSON.stringify({
          message: messages.server.success.password_updated,
        })
      );
    } catch (error) {
      statusCode = 500;
      res.writeHead(statusCode, {
        "Content-Type": CORS_CONTENT_TYPE,
        "Access-Control-Allow-Origin": CORS_ORIGIN_URL,
      });
      res.end(
        JSON.stringify({
          message: messages.server.errors.generic_500,
          error: error.message,
        })
      );
    } finally {
      await this.logRequest(req, logged_user_id, statusCode);
    }
  }

  //----------GET-----------
  async getAllUsersData(req, res) {
    const decoded = this.authenticateToken(req, res);
    let statusCode = 200;
    if (!decoded) return;
    const logged_user_id = decoded.user_id;

    try {
      // Check if the requesting user is an admin
      const isAdmin = await this.isAdmin(req, res);
      if (!isAdmin) {
        statusCode = 403;
        res.writeHead(statusCode, {
          "Content-Type": CORS_CONTENT_TYPE,
          "Access-Control-Allow-Origin": CORS_ORIGIN_URL,
        });
        res.end(JSON.stringify({ message: messages.server.auth.forbidden }));
        return;
      }

      const users = await db.getAll(
        messages.database.queries.select.all_users_requests
      );

      res.writeHead(statusCode, {
        "Content-Type": CORS_CONTENT_TYPE,
        "Access-Control-Allow-Origin": CORS_ORIGIN_URL,
      });
      res.end(JSON.stringify(users));
    } catch (error) {
      statusCode = 500;
      res.writeHead(statusCode, {
        "Content-Type": CORS_CONTENT_TYPE,
        "Access-Control-Allow-Origin": CORS_ORIGIN_URL,
      });
      res.end(
        JSON.stringify({
          message: messages.server.errors.generic_500,
          error: error.message,
        })
      );
    } finally {
      if (logged_user_id) {
        await this.logRequest(req, logged_user_id, statusCode);
      } else {
        console.log("Get requested without Authentication");
      }
    }
  }

  async getNumberOfRequestsByEndpoint(req, res) {
    const decoded = this.authenticateToken(req, res);
    let statusCode = 200;
    if (!decoded) return;

    const logged_user_id = decoded.user_id;

    try {
      // Check if the requesting user is an admin
      const isAdmin = await this.isAdmin(req, res);
      if (!isAdmin) {
        statusCode = 403;
        res.writeHead(statusCode, {
          "Content-Type": CORS_CONTENT_TYPE,
          "Access-Control-Allow-Origin": CORS_ORIGIN_URL,
        });
        res.end(JSON.stringify({ message: messages.server.auth.forbidden }));
        return;
      }

      // SQL query to get the number of requests by endpoint and method
      const query =
        messages.database.queries.select.number_of_requests_by_endpoint;

      // Execute the query and retrieve results
      const results = await db.getAll(query);

      // Send response with the data
      res.writeHead(statusCode, {
        "Content-Type": CORS_CONTENT_TYPE,
        "Access-Control-Allow-Origin": CORS_ORIGIN_URL,
      });
      res.end(JSON.stringify({ data: results }));
    } catch (error) {
      statusCode = 500;
      res.writeHead(statusCode, {
        "Content-Type": CORS_CONTENT_TYPE,
        "Access-Control-Allow-Origin": CORS_ORIGIN_URL,
      });
      res.end(
        JSON.stringify({
          message: messages.server.errors.generic_500,
          error: error.message,
        })
      );
    } finally {
      await this.logRequest(req, logged_user_id, statusCode);
    }
  }

  async getEndpointsCalledByUser(req, res) {
    const decoded = this.authenticateToken(req, res);
    let statusCode = 200;
    if (!decoded) return;
    const logged_user_id = decoded.user_id;

    try {
      // SQL query to get the number of requests by user and endpoint
      const query =
        messages.database.queries.select.number_of_endpoints_called_by_user;

      // Execute the query and retrieve results
      const rows = await db.getAll(query);

      // Organize data for the logged-in user by user_id with endpoints as an array
      const result = rows
        .filter((row) => row.user_id === decoded.user_id) // Filter rows for the logged-in user
        .reduce((acc, row) => {
          const user = acc.find((u) => u.user_id === row.user_id);
          const endpointData = {
            endpoint_name: row.Endpoint,
            NumberOfRequests: row.NumberOfRequests,
          };

          if (user) {
            // If user already exists in the result, add endpoint data to their array
            user.Endpoints.push(endpointData);
          } else {
            // Otherwise, add a new user entry with an Endpoints array
            acc.push({
              user_id: row.user_id, // Use user_id instead of email
              Endpoints: [endpointData],
            });
          }

          return acc;
        }, []);

      // Send response with the formatted data
      res.writeHead(statusCode, {
        "Content-Type": CORS_CONTENT_TYPE,
        "Access-Control-Allow-Origin": CORS_ORIGIN_URL,
      });
      res.end(JSON.stringify({ data: result }));
    } catch (error) {
      statusCode = 500;
      res.writeHead(statusCode, {
        "Content-Type": CORS_CONTENT_TYPE,
        "Access-Control-Allow-Origin": CORS_ORIGIN_URL,
      });
      res.end(
        JSON.stringify({
          message: messages.server.errors.generic_500,
          error: error.message,
        })
      );
    } finally {
      await this.logRequest(req, logged_user_id, statusCode);
    }
  }

  //----------PATCH-----------
  async updateUserRole(req, res, params) {
    const id = params.id;
    const logged_user_id = this.authenticateToken(req, res).user_id;
    let statusCode = 403;
    try {
      // Check if the requesting user is an admin
      const isAdmin = await this.isAdmin(req, res);
      if (!isAdmin) {
        res.writeHead(statusCode, {
          "Content-Type": CORS_CONTENT_TYPE,
          "Access-Control-Allow-Origin": CORS_ORIGIN_URL,
        });
        res.end(JSON.stringify({ message: messages.server.auth.forbidden }));
        return;
      }

      // Retrieve the target user from the database
      const user = await db.get(
        messages.database.queries.select.check_user_exists_by_id,
        [id]
      );
      if (!user) {
        statusCode = 404;
        res.writeHead(statusCode, {
          "Content-Type": CORS_CONTENT_TYPE,
          "Access-Control-Allow-Origin": CORS_ORIGIN_URL,
        });
        res.end(
          JSON.stringify({ message: messages.server.errors.user_not_found })
        );
        return;
      }

      // Toggle the user's role
      const newRole = user.role_id === 2 ? 1 : 2;
      await db.run(messages.database.queries.update.user_role_by_id, [
        newRole,
        id,
      ]);
      statusCode = 200;
      // Send success response with the updated role
      res.writeHead(statusCode, {
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
      statusCode = 500;
      if (!res.headersSent) {
        res.writeHead(statusCode, {
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
    } finally {
      await this.logRequest(req, logged_user_id, statusCode);
    }
  }

  //----------DELETE-----------
  async deleteUser(req, res, params) {
    const id = params.id;
    const logged_user_id = this.authenticateToken(req, res).user_id;
    let statusCode = 403;
    try {
      // Check if the requesting user is an admin
      const isAdmin = await this.isAdmin(req, res);
      if (!isAdmin) {
        res.writeHead(statusCode, {
          "Content-Type": CORS_CONTENT_TYPE,
          "Access-Control-Allow-Origin": CORS_ORIGIN_URL,
        });
        res.end(JSON.stringify({ message: messages.server.auth.unauthorized }));
        return;
      }

      // Check if the target user (to be deleted) exists
      const userToDelete = await db.get(
        messages.database.queries.select.check_user_exists_by_id,
        [id.toString()]
      );

      if (!userToDelete) {
        statusCode = 404;
        res.writeHead(statusCode, {
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

      statusCode = 200;
      // Send success response
      res.writeHead(statusCode, {
        "Content-Type": CORS_CONTENT_TYPE,
        "Access-Control-Allow-Origin": CORS_ORIGIN_URL,
      });
      res.end(JSON.stringify({ message: successMessage }));
    } catch (error) {
      statusCode = 500;
      if (!res.headersSent) {
        res.writeHead(statusCode, {
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
    } finally {
      await this.logRequest(req, logged_user_id, statusCode);
    }
  }

  //----------SERVER-----------
  extractBasePath(url) {
    // Split the URL by '/' and only keep the static parts
    const parts = url.split("/");
    const basePath = parts.slice(0, 2).join("/"); // Keeps only the first two parts, e.g., "/delete"

    return basePath;
  }

  async logRequest(req, userId, statusCode) {
    console.log("Logging request...");
    try {
      // const endpointPath = req.url;
      const endpointPath = this.extractBasePath(req.url);
      const method = req.method;

      const endpoint = await db.get(
        messages.database.queries.select.endpoint_id_by_http_method,
        [endpointPath, method]
      );

      if (!endpoint) {
        console.error(
          `Endpoint not found for path ${endpointPath} and method ${method}`
        );
        return;
      }

      // Log the request with the user ID, endpoint ID, and status code
      await db.run(messages.database.queries.insert.request, [
        userId,
        endpoint.endpoint_id,
        statusCode,
      ]);

      console.log(
        `Logged request: user_id=${userId}, endpoint_id=${endpoint.endpoint_id}, status_code=${statusCode}`
      );
    } catch (error) {
      console.error("Error logging request:", error);
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

    // Handle preflight OPTIONS request
    if (req.method === "OPTIONS") {
      this.handleOptions(req, res);
      return;
    }

    // Redirect `/api-docs` to `/api-docs/`
    if (req.url === "/api-docs") {
      res.writeHead(301, { Location: "/api-docs/" });
      res.end();
      return;
    }

    // Serve Swagger UI if the URL starts with `/api-docs/`
    if (req.url.startsWith("/api-docs")) {
      this.serveSwaggerUI(req, res);
      return;
    }

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
    return user && user.role_id === 1; // Return true if the user is found and has an admin role
  }
}

// Initialize database and start the server
(async () => {
  await db.initializeTables();
  const server = new Server();
  server.start();
})();
