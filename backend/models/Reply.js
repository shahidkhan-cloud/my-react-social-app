const mongoose = require("mongoose");

const replySchema = new mongoose.Schema({
  comment: { type: mongoose.Schema.Types.ObjectId, ref: "Comment", required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, required: true },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
}, { timestamps: true });

module.exports = mongoose.model("Reply", replySchema);
