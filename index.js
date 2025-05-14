require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const path = require("path");
const mongoose = require("mongoose");

const dns = require("dns");
const url = require("url");
const Url = require(path.join(__dirname, "models", "url"));

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Conexión a MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Conectado a MongoDB"))
  .catch((err) => console.error("Error de conexión a MongoDB:", err));

// Rutas
app.post("/api/shorturl", async (req, res) => {
  const { url: originalUrl } = req.body;

  try {
    // Validar URL
    const parsedUrl = new URL(originalUrl);
    if (
      !parsedUrl.protocol ||
      !["http:", "https:"].includes(parsedUrl.protocol)
    ) {
      return res.json({ error: "invalid url" });
    }

    // Verificar dominio
    dns.lookup(parsedUrl.hostname, async (err) => {
      if (err) {
        return res.json({ error: "invalid url" });
      }

      // Buscar o crear URL acortada
      let urlDoc = await Url.findOne({ original_url: originalUrl });

      if (!urlDoc) {
        const shortUrl = Math.floor(Math.random() * 100000).toString();
        urlDoc = new Url({
          original_url: originalUrl,
          short_url: shortUrl,
        });
        await urlDoc.save();
      }

      res.json({
        original_url: urlDoc.original_url,
        short_url: urlDoc.short_url,
      });
    });
  } catch (err) {
    res.json({ error: "invalid url" });
  }
});

app.get("/api/shorturl/:shortUrl", async (req, res) => {
  const { shortUrl } = req.params;
  const urlDoc = await Url.findOne({ short_url: shortUrl });

  if (!urlDoc) {
    return res.status(404).json({ error: "URL no encontrada" });
  }

  res.redirect(urlDoc.original_url);
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
