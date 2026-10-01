const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  let parsedUrl = req.url.split('?')[0];
  let filePath = parsedUrl === '/' ? '/index.html' : parsedUrl;
  let fullPath = path.normalize(path.join(__dirname, filePath));

  if (!fullPath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(fullPath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }
    const ext = path.extname(fullPath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
    res.end(content);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Servidor iniciado com sucesso: http://localhost:${PORT}/`);
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    const fallbackPort = 8080;
    server.listen(fallbackPort, '127.0.0.1', () => {
      console.log(`Servidor iniciado na porta alternativa: http://localhost:${fallbackPort}/`);
    });
  } else {
    console.error(e);
  }
});
