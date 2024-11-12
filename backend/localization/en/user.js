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
    },
    warnings: {
      skipped_user_insert:
        "User with email '{email}' already exists. Skipping insertion.",
    },
    queries: {
      create: {
        user_table: `
          CREATE TABLE IF NOT EXISTS User (
            user_id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL UNIQUE,
            number_of_requests INTEGER DEFAULT 0,
            password TEXT NOT NULL,
            salt TEXT NOT NULL,
            role INTEGER DEFAULT 0,
            reset_code TEXT,
            reset_code_expiry DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_login DATETIME,
            is_active BOOLEAN DEFAULT 1
          )`,
        request_table: `
          CREATE TABLE IF NOT EXISTS Request (
            service_id INTEGER PRIMARY KEY AUTOINCREMENT,
            prompt TEXT,
            user_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            is_active BOOLEAN DEFAULT 1,
            description TEXT,
            FOREIGN KEY (user_id) REFERENCES User(user_id)
          )`,
      },
      insert: {
        user: "INSERT INTO User (email, password, salt, role) VALUES (?, ?, ?, ?)",
      },
      select: {
        check_user_exists: "SELECT * FROM User WHERE email = ?",
        check_user_exists_by_id: "SELECT * FROM User WHERE user_id = ?",
        all_users_requests: "SELECT email, number_of_requests FROM User",
        num_user_requests:
          "SELECT number_of_requests FROM User WHERE user_id = ?",
        single_user_requests:
          "SELECT number_of_requests FROM User WHERE user_id = ?",
      },
      update: {
        num_user_requests:
          "UPDATE User SET number_of_requests = ? WHERE user_id = ?",
        password_clear_reset_code:
          "UPDATE User SET password = ?, salt = ?, reset_code = NULL, reset_code_expiry = NULL WHERE email = ?",
        user_reset_code:
          "UPDATE User SET reset_code = ?, reset_code_expiry = ? WHERE email = ?",
        user_role_by_id: "UPDATE User SET role = ? WHERE user_id = ?",
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
      allow_methods: "GET, POST, OPTIONS, PATCH",
      allow_origin: {
        dev: "*",
        prod: "https://comp4537moodzicfrontend-b5c3a7hpddbjfeft.canadacentral-01.azurewebsites.net/",
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
    },
    success: {
      password_updated: "Password Updated Successfully",
      request_updated: "Number of Requests Updated Successfully",
      reset_code_sent: "Reset Code Sent Successfully",
      server_running: "Server is running on port {port}.",
      user_created: "User Created Successfully",
    },
    warnings: {
      usage_exceeded:
        "All free tokens have been used up. Your requests will still be processed.",
      user_exists: "User already exists",
    },
    port: 3000,
  },
};

module.exports = messages;