const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const dotenv = require("dotenv");
const cloudinary = require("cloudinary").v2;
const Article = require("./models/Article");
const Video = require("./models/Video");
const Project = require("./models/Project");
const InstagramPost = require("./models/InstagramPost");
const GalleryImage = require("./models/GalleryImage");
const nodemailer = require("nodemailer");
const streamifier = require("streamifier");

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

// ================= helper: Cloudinary stream upload =================
const uploadBufferToCloudinary = (buffer, folder) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      },
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });

app.post("/api/upload/inline", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file" });
    const uploaded = await uploadBufferToCloudinary(
      req.file.buffer,
      "portfolio_inline",
    );
    res.json({ location: uploaded.secure_url });
  } catch (err) {
    console.error("Inline upload failed:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

// ================= ARTICLES =================
app.post("/api/articles", upload.single("thumbnail"), async (req, res) => {
  try {
    const { name, description, date, content } = req.body;
    let thumbnailUrl = "";
    if (req.file) {
      const uploaded = await uploadBufferToCloudinary(
        req.file.buffer,
        "portfolio_articles",
      );
      thumbnailUrl = uploaded.secure_url;
    }
    const newArticle = new Article({
      name,
      description,
      date,
      thumbnail: thumbnailUrl,
      content,
    });
    const saved = await newArticle.save();
    res.json(saved);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/articles", async (req, res) => {
  try {
    const articles = await Article.find(
      {},
      "name description thumbnail date",
    ).sort({ date: -1 });
    res.json(articles);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.delete("/api/articles/:name", async (req, res) => {
  try {
    const { name } = req.params;
    const deleted = await Article.findOneAndDelete({ name });
    if (!deleted) return res.status(404).json({ error: "Article not found" });
    res.json({ message: `Article '${name}' deleted successfully` });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.put("/api/articles/:name", upload.single("thumbnail"), async (req, res) => {
  try {
    const { name } = req.params;
    const { name: newName, description, date, content } = req.body;
    const update = { description, date, content };
    if (newName) update.name = newName;
    if (req.file) {
      const uploaded = await uploadBufferToCloudinary(
        req.file.buffer,
        "portfolio_articles",
      );
      update.thumbnail = uploaded.secure_url;
    }
    const updated = await Article.findOneAndUpdate({ name }, update, { new: true });
    if (!updated) return res.status(404).json({ error: "Article not found" });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/articles/detail/:name", async (req, res) => {
  try {
    const { name } = req.params;
    const article = await Article.findOne(
      { name },
      "name description date thumbnail content",
    );
    if (!article) return res.status(404).json({ error: "Article not found" });
    res.json(article);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

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

// ================= PROJECTS =================
app.post("/api/projects", upload.single("thumbnail"), async (req, res) => {
  try {
    const { name, description, date, content } = req.body;
    let thumbnailUrl = "";
    if (req.file) {
      const uploaded = await uploadBufferToCloudinary(
        req.file.buffer,
        "portfolio_projects",
      );
      thumbnailUrl = uploaded.secure_url;
    }
    const newProject = new Project({
      name,
      description,
      date,
      thumbnail: thumbnailUrl,
      content,
    });
    const saved = await newProject.save();
    res.json(saved);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/projects", async (req, res) => {
  try {
    const projects = await Project.find(
      {},
      "name description thumbnail date",
    ).sort({ date: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/projects/latest", async (req, res) => {
  try {
    const projects = await Project.find({}, "name description thumbnail date")
      .sort({ date: -1 })
      .limit(3);
    res.json(projects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/projects/detail/:name", async (req, res) => {
  try {
    const { name } = req.params;
    const project = await Project.findOne(
      { name },
      "name description date thumbnail content",
    );
    if (!project) return res.status(404).json({ error: "Project not found" });
    res.json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.delete("/api/projects/:name", async (req, res) => {
  try {
    const { name } = req.params;
    const deleted = await Project.findOneAndDelete({ name });
    if (!deleted) return res.status(404).json({ error: "Project not found" });
    res.json({ message: `Project '${name}' deleted successfully` });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.put("/api/projects/:name", upload.single("thumbnail"), async (req, res) => {
  try {
    const { name } = req.params;
    const { name: newName, description, date, content } = req.body;
    const update = { description, date, content };
    if (newName) update.name = newName;
    if (req.file) {
      const uploaded = await uploadBufferToCloudinary(
        req.file.buffer,
        "portfolio_projects",
      );
      update.thumbnail = uploaded.secure_url;
    }
    const updated = await Project.findOneAndUpdate({ name }, update, { new: true });
    if (!updated) return res.status(404).json({ error: "Project not found" });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ================= VIDEOS =================
app.get("/api/videos", async (req, res) => {
  try {
    const videos = await Video.find().sort({ date: -1 });
    res.json(videos);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

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

app.put("/api/videos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, date, youtubeUrl } = req.body;
    const updated = await Video.findByIdAndUpdate(
      id,
      { title, description, date, youtubeUrl },
      { new: true },
    );
    if (!updated) return res.status(404).json({ error: "Video not found" });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/videos/latest", async (req, res) => {
  try {
    const videos = await Video.find().sort({ date: -1 }).limit(3);
    res.json(videos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ================= INSTAGRAM POSTS =================
app.get("/api/instagram-posts", async (req, res) => {
  try {
    const posts = await InstagramPost.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/instagram-posts", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== "string" || !url.trim()) {
      return res.status(400).json({ error: "URL is required" });
    }
    const newPost = new InstagramPost({ url: url.trim() });
    const saved = await newPost.save();
    res.json(saved);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.delete("/api/instagram-posts/:id", async (req, res) => {
  try {
    const deleted = await InstagramPost.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Post not found" });
    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ================= GALLERY =================
const GALLERY_MAX = 12;

app.get("/api/gallery", async (req, res) => {
  try {
    const images = await GalleryImage.find()
      .sort({ createdAt: 1 })
      .limit(GALLERY_MAX);
    res.json(images);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/gallery", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file" });
    const count = await GalleryImage.countDocuments();
    if (count >= GALLERY_MAX) {
      return res.status(400).json({
        error: `Gallery full (max ${GALLERY_MAX}). Delete one to add another.`,
      });
    }
    const uploaded = await uploadBufferToCloudinary(
      req.file.buffer,
      "portfolio_gallery",
    );
    const newImage = new GalleryImage({ url: uploaded.secure_url });
    const saved = await newImage.save();
    res.json(saved);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.delete("/api/gallery/:id", async (req, res) => {
  try {
    const deleted = await GalleryImage.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Image not found" });
    res.json({ message: "Image deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ================= CONTACT EMAIL =================
app.post("/api/send-email", async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: "All fields are required" });
  }
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
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

// ================= AUTH =================
app.post("/api/login", (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res
      .status(400)
      .json({ success: false, message: "Password is required" });
  }
  if (password === process.env.ADMIN_PASSWORD) {
    return res.json({ success: true, message: "Login successful" });
  }
  return res.status(401).json({ success: false, message: "Invalid password" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
