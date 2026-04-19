const mongoose = require("mongoose");

/**
 * A single Instagram post the owner wants featured in the site's Social Feed.
 * Only the post URL is stored — the frontend converts it to an embed URL on
 * render (e.g. https://www.instagram.com/p/<id>/ → .../p/<id>/embed).
 */
const InstagramPostSchema = new mongoose.Schema({
  url: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("InstagramPost", InstagramPostSchema);
