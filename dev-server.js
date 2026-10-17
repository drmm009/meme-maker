import { createServer } from 'vite';

async function start() {
  const server = await createServer({
    server: {
      host: true,
      port: 5173
    }
  });
  await server.listen();
  server.printUrls();
}

start().catch((err) => {
  console.error('Failed to start Vite dev server:', err);
  process.exit(1);
});
