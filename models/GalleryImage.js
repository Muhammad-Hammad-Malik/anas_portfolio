const mongoose = require("mongoose");

/**
 * A single image in the Services page gallery.
 * Collection is capped at 12 images at the route layer (backend/server.js).
 * URL points at a Cloudinary asset in the `portfolio_gallery` folder.
 */
const GalleryImageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("GalleryImage", GalleryImageSchema);
