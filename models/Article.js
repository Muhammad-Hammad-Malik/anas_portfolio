const mongoose = require("mongoose");
// testing
const ArticleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  date: { type: Date },
  thumbnail: { type: String }, // Cloudinary URL
  content: { type: String }, // Full editor content (HTML string)
});

module.exports = mongoose.model("Article", ArticleSchema);
