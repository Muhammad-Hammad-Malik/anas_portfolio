const mongoose = require("mongoose");

const GraphicSchema = new mongoose.Schema({
  imageUrl: { type: String, required: true }, // Cloudinary image URL
});

module.exports = mongoose.model("Graphic", GraphicSchema);
