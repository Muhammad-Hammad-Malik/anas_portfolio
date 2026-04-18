const mongoose = require("mongoose");

const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  date: { type: Date },
  thumbnail: { type: String }, // Cloudinary URL
  content: { type: String }, // Full editor content (HTML string)
});

module.exports = mongoose.model("Project", ProjectSchema);
