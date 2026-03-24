import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { createWSServer } from "./src/lib/ws-server";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  try {
    createWSServer(server);
    console.log("> WebSocket server attached on /ws");
  } catch (err) {
    console.error("> Failed to create WebSocket server:", err);
    console.error("> Dashboard will run without real-time updates");
  }

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> PIPELINES_DIR: ${process.env.PIPELINES_DIR || "(default: ../pipelines)"}`);
  });
}).catch((err) => {
  console.error("Failed to start dashboard:", err);
  process.exit(1);
});
