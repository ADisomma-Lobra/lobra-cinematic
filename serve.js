/**
 * serve.js — zero-dependency static file server for local preview.
 * Uses only Node's built-in http/fs modules (no npm install needed).
 * Run with: node serve.js   (then open http://localhost:5500)
 *
 * Why a server at all? The site loads its copy and content from JSON via
 * fetch(). Browsers block fetch() against file:// URLs for security
 * reasons, so double-clicking index.html will show an empty/untranslated
 * page. Any static server (this one, VS Code Live Server, nginx, IIS...)
 * solves it — this script just means nothing extra has to be installed
 * to preview the site right now.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5500;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.woff2': 'font/woff2'
};

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';
  const filePath = path.join(ROOT, urlPath);

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 — Not found: ' + urlPath);
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Lobra — anteprima locale su http://localhost:${PORT}`);
  console.log('Premi CTRL+C per chiudere il server.');
});
