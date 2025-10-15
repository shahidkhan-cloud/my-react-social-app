const Post = require("../models/Post");
const Comment = require("../models/Comment");
const Reply = require("../models/Reply");
const mongoose = require("mongoose");

// ✅ Create a new post
const createPost = async (req, res) => {
  try {
    const userId = req.user._id;
    const { text, images } = req.body;

    if (!text && (!images || images.length === 0)) {
      return res.status(400).json({ message: "Post text or image required!" });
    }

    const newPost = new Post({ user: userId, text, images });
    await newPost.save();

    const populatedPost = await Post.findById(newPost._id)
      .populate("user", "username profilePic")
      .populate("likes", "username profilePic")
      .populate({
        path: "comments",
        populate: { path: "user", select: "username profilePic" },
      });

    res.status(201).json({ message: "Post created successfully ✅", post: populatedPost });
  } catch (err) {
    console.error("❌ Error creating post:", err);
    res.status(500).json({ message: "Failed to create post", error: err.message });
  }
};

// ✅ Get all posts
const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("user", "username profilePic")
      .populate("likes", "username profilePic")
      .populate({
        path: "comments",
        populate: { path: "user", select: "username profilePic" },
      })
      .sort({ createdAt: -1 });

    res.status(200).json(posts);
  } catch (err) {
    console.error("❌ Error fetching posts:", err);
    res.status(500).json({ message: "Failed to fetch posts", error: err.message });
  }
};

// ✅ Get posts by specific user
const getPostsByUser = async (req, res) => {
  try {
    const userId = req.params.userId;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const posts = await Post.find({ user: userId })
      .populate("user", "username profilePic")
      .populate("likes", "username profilePic")
      .populate({
        path: "comments",
        populate: [
          { path: "user", select: "username profilePic" },
          { path: "likes", select: "username profilePic" },
        ],
      })
      .sort({ createdAt: -1 });

    res.status(200).json(posts);
  } catch (err) {
    console.error("❌ Error fetching user posts:", err);
    res.status(500).json({ message: "Failed to fetch posts", error: err.message });
  }
};

// ✅ Like / Unlike a Post
const toggleLike = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const isLiked = post.likes.includes(userId);
    if (isLiked) post.likes.pull(userId);
    else post.likes.push(userId);

    await post.save();

    const updatedPost = await Post.findById(postId)
      .populate("likes", "username profilePic")
      .select("likes");

    res.status(200).json({ message: isLiked ? "Post unliked" : "Post liked", likes: updatedPost.likes });
  } catch (err) {
    console.error("❌ Error toggling like:", err);
    res.status(500).json({ message: "Failed to toggle like", error: err.message });
  }
};

// ✅ Add Comment
const addComment = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: "Comment text required" });

    const newComment = await Comment.create({ post: postId, user: userId, text });
    await Post.findByIdAndUpdate(postId, { $push: { comments: newComment._id } });

    const populatedComment = await Comment.findById(newComment._id).populate("user", "username profilePic");

    res.status(201).json({ comment: populatedComment });
  } catch (err) {
    console.error("❌ Error adding comment:", err);
    res.status(500).json({ message: "Failed to add comment", error: err.message });
  }
};

// ✅ Like / Unlike a Comment
const toggleCommentLike = async (req, res) => {
  try {
    const commentId = req.params.id;
    const userId = req.user._id;

    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    const isLiked = comment.likes.includes(userId);
    if (isLiked) comment.likes.pull(userId);
    else comment.likes.push(userId);

    await comment.save();

    const updatedComment = await Comment.findById(commentId)
      .populate("user", "username profilePic")
      .populate("likes", "username");

    res.status(200).json({ message: isLiked ? "Comment unliked" : "Comment liked", comment: updatedComment });
  } catch (err) {
    console.error("❌ Error liking comment:", err);
    res.status(500).json({ message: "Failed to toggle comment like", error: err.message });
  }
};

// ✅ Like / Unlike a Reply
const toggleReplyLike = async (req, res) => {
  try {
    const replyId = req.params.id;
    const userId = req.user._id;

    const reply = await Reply.findById(replyId);
    if (!reply) return res.status(404).json({ message: "Reply not found" });

    const isLiked = reply.likes.includes(userId);
    if (isLiked) reply.likes.pull(userId);
    else reply.likes.push(userId);

    await reply.save();

    const updatedReply = await Reply.findById(replyId)
      .populate("user", "username profilePic")
      .populate("likes", "username");

    res.status(200).json({ message: isLiked ? "Reply unliked" : "Reply liked", reply: updatedReply });
  } catch (err) {
    console.error("❌ Error liking reply:", err);
    res.status(500).json({ message: "Failed to toggle reply like", error: err.message });
  }
};

// ✅ Edit Post
const updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ message: "Post not found" });
    if (post.user.toString() !== req.user.id)
      return res.status(403).json({ message: "Not authorized" });

    post.text = req.body.text || post.text;
    await post.save();

    res.json({ message: "Post updated successfully", text: post.text });
  } catch (error) {
    console.error("❌ Update Post Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Delete Post
const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (post.user.toString() !== req.user.id)
      return res.status(403).json({ message: "Not authorized" });

    await post.deleteOne();
    res.json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("❌ Delete Post Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Delete Comment
// commentController.js or inside commentRoutes.js
const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);

    if (!comment)
      return res.status(404).json({ message: "Comment not found" });

    // Only allow the owner of the comment or post owner to delete
    if (String(comment.user) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // ✅ Use deleteOne instead of remove (remove is deprecated)
    await comment.deleteOne();

    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting comment:", error);
    res.status(500).json({ message: "Server error deleting comment" });
  }
};




// ✅ Delete Reply
const deleteReply = async (req, res) => {
  try {
    const reply = await Reply.findById(req.params.id);
    if (!reply) return res.status(404).json({ message: "Reply not found" });

    if (String(reply.user) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await reply.deleteOne();
    res.json({ message: "Reply deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting reply:", err);
    res.status(500).json({ message: "Failed to delete reply", error: err.message });
  }
};

// ✅ Export all
module.exports = {
  createPost,
  getAllPosts,
  toggleLike,
  addComment,
  toggleCommentLike,
  toggleReplyLike,
  getPostsByUser,
  updatePost,
  deletePost,
  deleteComment,
  deleteReply,
};
