const mongoose = require("mongoose");

const VideoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  date: { type: Date, required: true },
  youtubeUrl: { type: String, required: true },
});

module.exports = mongoose.model("Video", VideoSchema);
