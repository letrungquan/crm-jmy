import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/tiktok/event", async (req, res) => {
    try {
      const accessToken = req.headers['access-token'];
      if (!accessToken) {
        return res.status(401).json({ error: "Missing access token" });
      }

      const response = await fetch('https://business-api.tiktok.com/open_api/v1.3/event/track/', {
        method: 'POST',
        headers: {
          'Access-Token': accessToken as string,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(req.body),
      });

      const result = await response.json();
      res.status(response.status).json(result);
    } catch (error: any) {
      console.error("TikTok API Proxy Error:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  app.post("/api/meta/event", async (req, res) => {
    try {
      const { pixelId, ...eventData } = req.body;
      if (!pixelId) {
        return res.status(400).json({ error: "Missing pixelId" });
      }

      const url = `https://graph.facebook.com/v19.0/${pixelId}/events`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      const result = await response.json();
      res.status(response.status).json(result);
    } catch (error: any) {
      console.error("Meta API Proxy Error:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
