// File di adattamento per Railway
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic, log } from "./vite";
import path from "path";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configura logging
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Registra API routes
  const server = await registerRoutes(app);

  // Error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    console.error(err);
  });

  // Usa serveStatic per l'app in produzione
  try {
    serveStatic(app);
  } catch (error) {
    console.error("Error setting up static files:", error);
    // Fallback: serve almeno un messaggio di errore
    app.use("*", (_req, res) => {
      res.status(500).send("Server configuration error. Check build output.");
    });
  }

  // Usa la porta assegnata da Railway
  const port = process.env.PORT || 5000;
  server.listen({
    port: parseInt(port.toString()),
    host: "0.0.0.0",
  }, () => {
    log(`Railway deployment serving on port ${port}`);
  });
})();