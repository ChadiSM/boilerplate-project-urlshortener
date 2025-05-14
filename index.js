require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const mongoose = require("mongoose");
const dns = require("dns");
const { URL } = require("url");
const path = require("path");
const Url = require(path.join(__dirname, "models", "url"));

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/public", express.static(process.cwd() + "/public"));

app.get("/", (req, res) => {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Conexión a MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Conectado a MongoDB"))
  .catch((err) => console.error("Error de conexión:", err));

// POST /api/shorturl
app.post("/api/shorturl", async (req, res) => {
  const { url: originalUrl } = req.body;

  try {
    const parsedUrl = new URL(originalUrl);

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return res.json({ error: "invalid url" });
    }

    dns.lookup(parsedUrl.hostname, async (err) => {
      if (err) return res.json({ error: "invalid url" });

      let existing = await Url.findOne({ original_url: originalUrl });

      if (existing) {
        return res.json({
          original_url: existing.original_url,
          short_url: existing.short_url,
        });
      }

      const count = await Url.countDocuments({});
      const shortUrl = count + 1;

      const newUrl = new Url({
        original_url: originalUrl,
        short_url: shortUrl,
      });

      await newUrl.save();

      res.json({
        original_url: newUrl.original_url,
        short_url: newUrl.short_url,
      });
    });
  } catch (err) {
    return res.json({ error: "invalid url" });
  }
});

// GET /api/shorturl/:shortUrl
app.get("/api/shorturl/:shortUrl", async (req, res) => {
  const short = parseInt(req.params.shortUrl);
  const urlDoc = await Url.findOne({ short_url: short });

  if (!urlDoc) {
    return res.json({ error: "No short URL found for the given input" });
  }

  res.redirect(urlDoc.original_url);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
