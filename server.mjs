// Локальный статический сервер без зависимостей: node server.mjs [порт]
// Отдаёт файлы проекта (текст — со сжатием gzip, как на хостинге), неизвестные адреса — 404.html с кодом 404.
// Только для просмотра на своём компьютере.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.argv[2] || process.env.PORT || 5180);
const TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".avif": "image/avif", ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8", ".xml": "application/xml; charset=utf-8", ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json",
};
const TEXT = new Set([".html", ".css", ".js", ".mjs", ".svg", ".json", ".txt", ".xml"]);
const PRIVATE = /^\/(tools|notes|node_modules|\.claude|\.git)(\/|$)|^\/(server\.mjs|README\.md)$/i;

http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p.endsWith("/")) p += "index.html";
  const file = path.join(ROOT, path.normalize(p));
  const send = (code, f) => {
    const ext = path.extname(f).toLowerCase();
    const gz = TEXT.has(ext) && /\bgzip\b/.test(req.headers["accept-encoding"] || "");
    res.writeHead(code, {
      "Content-Type": TYPES[ext] || "application/octet-stream",
      // HTML всегда свежий; остальное с ?v= в адресе — можно кэшировать надолго
      "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      ...(gz ? { "Content-Encoding": "gzip", Vary: "Accept-Encoding" } : {}),
    });
    const stream = fs.createReadStream(f);
    (gz ? stream.pipe(zlib.createGzip({ level: 9 })) : stream).pipe(res);
  };
  if (!file.startsWith(ROOT) || PRIVATE.test(p)) return send(404, path.join(ROOT, "404.html"));
  fs.stat(file, (err, st) => (!err && st.isFile() ? send(200, file) : send(404, path.join(ROOT, "404.html"))));
}).listen(PORT, () => console.log(`Сайт курса: http://localhost:${PORT}/`));
