const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const dotenv = require("dotenv");
const cloudinary = require("cloudinary").v2;
const Article = require("./models/Article");
const Video = require("./models/Video");
const nodemailer = require("nodemailer");
const Graphic = require("./models/Graphic");

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fieldSize: 100 * 1024 * 1024, // 100 MB for editor content
    fileSize: 20 * 1024 * 1024, // 20 MB for thumbnails
  },
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error(err));

// Routes
app.post("/api/articles", upload.single("thumbnail"), async (req, res) => {
  try {
    const { name, description, date, content } = req.body;
    let thumbnailUrl = "";
    if (req.file) {
      const uploadResult = await cloudinary.uploader.upload_stream(
        { folder: "portfolio_articles" },
        (error, result) => {
          if (error) throw error;
          thumbnailUrl = result.secure_url;
          const newArticle = new Article({
            name,
            description,
            date,
            thumbnail: thumbnailUrl,
            content,
          });

          newArticle.save().then((article) => {
            res.json(article);
          });
        }
      );
      uploadResult.end(req.file.buffer);
    } else {
      const newArticle = new Article({
        name,
        description,
        date,
        content,
      });
      await newArticle.save();
      res.json(newArticle);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/articles", async (req, res) => {
  try {
    const articles = await Article.find(
      {},
      "name description thumbnail date"
    ).sort({ date: -1 }); // sort newest first
    res.json(articles);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.delete("/api/articles/:name", async (req, res) => {
  try {
    const { name } = req.params;
    const deleted = await Article.findOneAndDelete({ name });

    if (!deleted) {
      return res.status(404).json({ error: "Article not found" });
    }

    res.json({ message: `Article '${name}' deleted successfully` });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET article detail by name
app.get("/api/articles/detail/:name", async (req, res) => {
  try {
    const { name } = req.params;
    const article = await Article.findOne(
      { name },
      "name date content" // only return what we need
    );

    if (!article) {
      return res.status(404).json({ error: "Article not found" });
    }

    res.json(article);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ================= VIDEO PROJECTS =================

// GET all videos
app.get("/api/videos", async (req, res) => {
  try {
    const videos = await Video.find().sort({ date: -1 });
    res.json(videos);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// CREATE new video
app.post("/api/videos", async (req, res) => {
  try {
    const { title, description, date, youtubeUrl } = req.body;

    const newVideo = new Video({ title, description, date, youtubeUrl });
    await newVideo.save();

    res.json(newVideo);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE video by ID
app.delete("/api/videos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Video.findByIdAndDelete(id);

    if (!deleted) return res.status(404).json({ error: "Video not found" });

    res.json({ message: "Video deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ================= GRAPHIC DESIGN =================

// GET all graphics
app.get("/api/graphics", async (req, res) => {
  try {
    const graphics = await Graphic.find();
    res.json(graphics);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/graphics", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const stream = cloudinary.uploader.upload_stream(
      { folder: "graphics" },
      async (error, result) => {
        if (error) {
          console.error(error);
          return res.status(500).json({ error: "Upload failed" });
        }

        const newGraphic = new Graphic({ imageUrl: result.secure_url });
        const saved = await newGraphic.save();
        res.json(saved);
      }
    );

    // send buffer directly
    const streamifier = require("streamifier");
    streamifier.createReadStream(req.file.buffer).pipe(stream);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE graphic by ID
app.delete("/api/graphics/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Graphic.findByIdAndDelete(id);

    if (!deleted) return res.status(404).json({ error: "Graphic not found" });

    res.json({ message: "Graphic deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/send-email", async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // configure mail transporter (example: Gmail)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // your email
        pass: process.env.EMAIL_PASS, // app password (not regular password)
      },
    });

    const mailOptions = {
      from: `"Portfolio Contact Form" <${process.env.EMAIL_USER}>`,
      to: "anasir.connect@gmail.com",
      subject: `New Message from ${name}: ${subject}`,
      html: `
        <h3>New Contact Form Submission</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong><br/>${message}</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.json({ success: true, message: "Email sent successfully" });
  } catch (err) {
    console.error("Error sending email:", err);
    res.status(500).json({ success: false, error: "Failed to send email" });
  }
});

// GET only 3 latest videos
app.get("/api/videos/latest", async (req, res) => {
  try {
    const videos = await Video.find().sort({ date: -1 }).limit(3);
    res.json(videos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET only 3 latest articles (basic info)
app.get("/api/articles/latest", async (req, res) => {
  try {
    const articles = await Article.find({}, "name description thumbnail date")
      .sort({ date: -1 })
      .limit(3);
    res.json(articles);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/login", (req, res) => {
  const { password } = req.body;

  // Validate input
  if (!password) {
    return res
      .status(400)
      .json({ success: false, message: "Password is required" });
  }

  // Compare with password stored in .env
  if (password === process.env.ADMIN_PASSWORD) {
    return res.json({ success: true, message: "Login successful" });
  } else {
    return res
      .status(401)
      .json({ success: false, message: "Invalid password" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
