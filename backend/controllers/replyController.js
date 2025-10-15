const Reply = require("../models/Reply");
const Comment = require("../models/Comment");
const User = require("../models/User");

// ✅ Get all replies for a specific comment
const getRepliesByComment = async (req, res) => {
  try {
    const replies = await Reply.find({ comment: req.params.commentId })
      .populate("user", "username profilePic")
      .sort({ createdAt: 1 });
    res.json(replies);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch replies" });
  }
};

// ✅ Create a new reply
const createReply = async (req, res) => {
  try {
    const userId = req.user._id;
    const { text } = req.body;
    const commentId = req.params.commentId;

    if (!text) {
      return res.status(400).json({ message: "Reply text is required" });
    }

    const newReply = new Reply({
      comment: commentId,
      user: userId,
      text,
    });

    await newReply.save();
    const populatedReply = await newReply.populate("user", "username profilePic");

    res.status(201).json({ message: "Reply added", reply: populatedReply });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to add reply" });
  }
};
// ✅ Delete a reply (only post owner can delete)
const Post = require("../models/Post");

const deleteReply = async (req, res) => {
  try {
    const reply = await Reply.findById(req.params.replyId).populate({
      path: "comment",
      populate: { path: "post", select: "user" },
    });

    if (!reply) {
      return res.status(404).json({ message: "Reply not found" });
    }

    // Check if logged-in user is the post owner
    if (String(reply.comment.post.user) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not authorized to delete this reply" });
    }

    // Delete the reply
    await Reply.findByIdAndDelete(reply._id);

    // Also remove it from the comment's replies array
    await Comment.findByIdAndUpdate(reply.comment._id, {
      $pull: { replies: reply._id },
    });

    res.status(200).json({ message: "Reply deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete reply" });
  }
};


// ✅ Like or unlike a reply

const toggleReplyLike = async (req, res) => {
  try {
    const reply = await Reply.findById(req.params.replyId);
    if (!reply) return res.status(404).json({ message: "Reply not found" });

    const userId = req.user._id;

    // Toggle like
    const index = reply.likes.indexOf(userId);
    if (index === -1) {
      reply.likes.push(userId);
    } else {
      reply.likes.splice(index, 1);
    }

    await reply.save();

    // Populate user and likes before sending
    const updatedReply = await Reply.findById(reply._id)
      .populate("user", "username profilePic")
      .populate("likes", "username profilePic");

    res.status(200).json({ reply: updatedReply });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to toggle like" });
  }
};


module.exports = {
  getRepliesByComment,
  createReply,
  toggleReplyLike,
   deleteReply,
};
