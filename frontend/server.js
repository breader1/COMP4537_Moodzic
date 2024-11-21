// server.js

const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 8888;

const server = http.createServer((req, res) => {
  // Map the file extension to the MIME type
  const mimeTypes = {
    '.html': 'text/html',
    '.js':   'text/javascript',
    '.css':  'text/css',
    '.png':  'image/png',
    '.jpg':  'image/jpeg',
    '.gif':  'image/gif',
    '.svg':  'image/svg+xml',
  };

  // Build the file path
  let filePath = '.' + req.url;
  if (filePath === './') {
    filePath = './index.html';
  }

  // Get the file extension
  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = mimeTypes[extname] || 'application/octet-stream';

  // Read and serve the file
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // File not found
        res.setHeader(404, { "Content-Type": "text/plain" });
        res.end('404 Not Found');
      } else {
        // Server error
        res.setHeader(500, { "Content-Type": "text/plain" });
        res.end('500 Internal Server Error');
      }
    } else {
      // Success
      res.setHeader(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
