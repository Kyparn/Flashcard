// Local mobile preview: serves the exported files, without any quiz API or database.
const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const { networkInterfaces } = require("node:os");
const root = path.resolve(__dirname, "../dist");
const types = { ".html": "text/html; charset=utf-8", ".js": "application/javascript",
  ".json": "application/json", ".css": "text/css", ".ttf": "font/ttf", ".png": "image/png", ".ico": "image/x-icon" };
const port = Number(process.env.PORT) || 3002;
http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    const file = path.resolve(root, "." + (pathname === "/" ? "/index.html" : pathname));
    if (!file.startsWith(root + path.sep) || !["GET", "HEAD"].includes(req.method)) {
      res.writeHead(403); res.end(); return;
    }
    const content = await fs.readFile(file);
    res.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-store" });
    res.end(req.method === "HEAD" ? undefined : content);
  } catch {
    res.writeHead(404); res.end("Sidan finns inte. Bygg webbversionen med npm run build:web.");
  }
}).listen(port, "0.0.0.0", () => {
  console.log(`Computer: http://localhost:${port}`);
  for (const entries of Object.values(networkInterfaces()))
    for (const info of entries)
      if (info.family === "IPv4" && !info.internal)
        console.log(`Mobile (same Wi-Fi): http://${info.address}:${port}`);
});
