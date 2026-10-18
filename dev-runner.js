import { createServer } from 'vite';
import http from 'http';
import net from 'net';

// Prevent Node from exiting when stdin closes
if (process.stdin.setEncoding) process.stdin.resume();
process.stdin.on('end', () => {});
process.stdin.on('close', () => {});

async function main() {
  // 1. Start Vite Server on Port 5173
  const viteServer = await createServer({
    configFile: './vite.config.js',
    server: {
      port: 5173,
      host: '0.0.0.0',
      strictPort: true
    }
  });

  await viteServer.listen();
  console.log('Vite Dev Server listening on port 5173 (0.0.0.0)');
  viteServer.printUrls();

  // 2. Start Proxy Forwarders for Port 5174 and 5175
  const TARGET_PORT = 5173;

  function createProxy(port) {
    const server = http.createServer((req, res) => {
      const options = {
        hostname: '127.0.0.1',
        port: TARGET_PORT,
        path: req.url,
        method: req.method,
        headers: { ...req.headers, host: `localhost:${TARGET_PORT}` }
      };

      const proxyReq = http.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res, { end: true });
      });

      proxyReq.on('error', (err) => {
        res.writeHead(502, { 'Content-Type': 'text/plain' });
        res.end('Proxy Error: ' + err.message);
      });

      req.pipe(proxyReq, { end: true });
    });

    server.on('upgrade', (req, socket, head) => {
      const proxySocket = net.connect(TARGET_PORT, '127.0.0.1', () => {
        proxySocket.write(`${req.method} ${req.url} HTTP/${req.httpVersion}\r\n`);
        for (let i = 0; i < req.rawHeaders.length; i += 2) {
          const key = req.rawHeaders[i];
          const val = key.toLowerCase() === 'host' ? `localhost:${TARGET_PORT}` : req.rawHeaders[i + 1];
          proxySocket.write(`${key}: ${val}\r\n`);
        }
        proxySocket.write('\r\n');
        if (head && head.length > 0) proxySocket.write(head);
        proxySocket.pipe(socket);
        socket.pipe(proxySocket);
      });

      proxySocket.on('error', () => {
        socket.destroy();
      });
    });

    server.listen(port, '0.0.0.0', () => {
      console.log(`Port ${port} proxy listening and forwarding to ${TARGET_PORT}`);
    });

    server.on('error', (err) => {
      console.log(`Port ${port} error: ${err.message}`);
    });
  }

  createProxy(5174);
  createProxy(5175);
}

main().catch(err => {
  console.error('Failed to start dev-runner:', err);
});
