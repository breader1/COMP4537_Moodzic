const messages = {
  database: {
    admin_user_email: "admin@admin.com",
    admin_user_password: "111",
    database_name: "moodzic.db",
    default_user_email: "john@john.com",
    default_user_password: "123",
    errors: {
      closing_db: "Error closing the Database:",
      connection: "Could not connect to the Database:",
      table_creation: "Error creating tables:",
      fetch_all_rows: "Error fetching rows:",
      fetch_single_row: "Error fetching row:",
      sql_execution: "Error running SQL:",
    },
    success: {
      connection: "Connected to the Sqlite Database.",
      closed_db: "Closed the database connection.",
      user_insert: "User with email '{email}' has been added to the database.",
      user_deleted: "User with id '{id}' has been deleted from the database.",
      role_insert: "Role '{role_name}' has been added to the database.",
      method_insert:
        "HTTP Method '{method_name}' has been added to the database.",
      endpoint_insert:
        "Endpoint '{endpoint_name}' has been added to the database.",
      request_insert: "Request has been added to the database.",
      initialization: "Database has been initialized and seeded.",
    },
    warnings: {
      skipped_user_insert:
        "User with email '{email}' already exists. Skipping insertion.",
      skipped_role_insert:
        "Role '{role_name}' already exists. Skipping insertion.",
      skipped_method_insert:
        "HTTP Method '{method_name}' already exists. Skipping insertion",
      skipped_endpoint_insert:
        "Endpoint '{endpoint_name}' already exists. Skipping insertion.",
      skipped_request_insert: "Request already exists. Skipping insertion.",
    },
    queries: {
      create: {
        endpoint_table: `
          CREATE TABLE IF NOT EXISTS Endpoint (
            endpoint_id INTEGER PRIMARY KEY AUTOINCREMENT,
            method_id INTEGER NOT NULL,
            endpoint_name TEXT NOT NULL,
            FOREIGN KEY (method_id) REFERENCES Method(method_id)
          );`,
        method_table: `
          CREATE TABLE IF NOT EXISTS Method (
            method_id INTEGER PRIMARY KEY AUTOINCREMENT,
            method_name TEXT NOT NULL UNIQUE
          );`,
        role_table: `
          CREATE TABLE IF NOT EXISTS Role (
            role_id INTEGER PRIMARY KEY AUTOINCREMENT,
            role_name TEXT NOT NULL UNIQUE
          );`,
        user_table: `
          CREATE TABLE IF NOT EXISTS User (
            user_id INTEGER PRIMARY KEY AUTOINCREMENT,
            role_id INTEGER NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            salt TEXT NOT NULL,
            reset_code TEXT,
            reset_code_expiry DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            is_active BOOLEAN DEFAULT 1,
            FOREIGN KEY (role_id) REFERENCES Role(role_id)
          );`,
        request_table: `
          CREATE TABLE IF NOT EXISTS Request (
            request_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            endpoint_id INTEGER NOT NULL,
            status_code INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES User(user_id),
            FOREIGN KEY (endpoint_id) REFERENCES Endpoint(endpoint_id)
          );`,
      },
      insert: {
        user: "INSERT INTO User (role_id, email, password, salt) VALUES (?, ?, ?, ?)",
        role: "INSERT INTO Role (role_name) VALUES (?)",
        method: "INSERT INTO Method (method_name) VALUES (?)",
        endpoint:
          "INSERT INTO Endpoint (method_id, endpoint_name) VALUES (?, ?)",
        request:
          "INSERT INTO Request (user_id, endpoint_id, status_code) VALUES (?, ?, ?)",
      },
      select: {
        endpoint_id_by_http_method: `
          SELECT endpoint_id 
            FROM Endpoint 
            JOIN Method ON Endpoint.method_id = Method.method_id 
            WHERE endpoint_name = ? AND method_name = ?;`,
        check_user_exists: "SELECT * FROM User WHERE email = ?",
        check_user_exists_by_id: "SELECT * FROM User WHERE user_id = ?",
        check_role_exists: "SELECT * FROM Role WHERE role_name = ?",
        check_role_exists_by_id: "SELECT * FROM Role WHERE role_id = ?",
        check_method_exists: "SELECT * FROM Method WHERE method_name = ?",
        check_method_exists_by_id: "SELECT * FROM Method WHERE method_id = ?",
        check_endpoint_exists: "SELECT * FROM Endpoint WHERE endpoint_name = ?",
        check_endpoint_exists_by_id:
          "SELECT * FROM Endpoint WHERE endpoint_id = ?",
        check_request_exists:
          "SELECT * FROM Request WHERE user_id = ? AND endpoint_id = ?",
        all_users_requests: `
          SELECT 
              User.user_id,
              User.role_id,
              User.email,
              COUNT(Request.request_id) AS number_of_requests
          FROM 
              User
          LEFT JOIN 
              Request ON User.user_id = Request.user_id
          GROUP BY 
              User.user_id;`,
        num_user_requests:
          "SELECT number_of_requests FROM User WHERE user_id = ?",
        single_user_requests:
          "SELECT number_of_requests FROM User WHERE user_id = ?",
        number_of_requests_by_endpoint: `
            SELECT 
                Method.method_name AS Method,
                Endpoint.endpoint_name AS Endpoint,
                COUNT(Request.request_id) AS NumberOfRequests
            FROM 
                Request
            JOIN 
                Endpoint ON Request.endpoint_id = Endpoint.endpoint_id
            JOIN 
                Method ON Endpoint.method_id = Method.method_id
            GROUP BY 
                Method.method_name, Endpoint.endpoint_name;
        `,
        number_of_endpoints_called_by_user: `
          SELECT 
            User.user_id,
            Endpoint.endpoint_name AS Endpoint,
            COUNT(Request.request_id) AS NumberOfRequests
          FROM 
            User
          LEFT JOIN 
            Request ON User.user_id = Request.user_id
          LEFT JOIN 
            Endpoint ON Request.endpoint_id = Endpoint.endpoint_id
          GROUP BY 
            User.user_id, Endpoint.endpoint_name;`,
      },
      update: {
        num_user_requests:
          "UPDATE User SET number_of_requests = ? WHERE user_id = ?",
        password_clear_reset_code:
          "UPDATE User SET password = ?, salt = ?, reset_code = NULL, reset_code_expiry = NULL WHERE email = ?",
        user_reset_code:
          "UPDATE User SET reset_code = ?, reset_code_expiry = ? WHERE email = ?",
        user_role_by_id: "UPDATE User SET role_id = ? WHERE user_id = ?",
      },
      delete: {
        user_by_id: "DELETE FROM User WHERE user_id = ?",
      },
    },
  },
  server: {
    auth: {
      forbidden: "Forbidden",
      unauthorized: "Unauthorized",
    },
    cors: {
      allow_content_type: "application/json",
      allow_headers: "Content-Type, Authorization",
      allow_methods: "GET, POST, OPTIONS, PATCH, DELETE",
      allow_origin: {
        dev: "http://localhost:8888",
        prod: "https://mango-wave-08f7a541e.5.azurestaticapps.net/",
      },
    },
    email: {
      body: "Your password reset code is: {reset_code}",
      body_html: `<p>You requested a password reset.</p><p>Your reset code is: <b>{resetCode}</b></p>`,
      service: "gmail",
      subject: "Password Reset Request",
    },
    errors: {
      generic_500: "Error processing the request",
      invalid_credentials: "Invalid Credentials",
      invalid_reset: "Invalid Reset Code or User Not Found",
      reset_code_expired: "Reset Code has expired.",
      route_not_found: "Route Not Found",
      user_not_found: "User Not Found",
      llm_api_error: "Error with LLM API: ",
      generate_audio: "Error generating audio",
    },
    success: {
      password_updated: "Password Updated Successfully",
      request_updated: "Number of Requests Updated Successfully",
      reset_code_sent: "Reset Code Sent Successfully",
      server_running: "Server is running on port {port}.",
      user_created: "User Created Successfully",
      logged_in: "Logged in successfully",
    },
    warnings: {
      usage_exceeded:
        "All free tokens have been used up. Your requests will still be processed.",
      user_exists: "User already exists",
    },
    http_methods: {
      get: "GET",
      post: "POST",
      patch: "PATCH",
      delete: "DELETE",
    },
    port: 3000,
    llm_endpoint: "https://fresh-insect-severely.ngrok-free.app/generate-audio",
  },
};

module.exports = messages;
