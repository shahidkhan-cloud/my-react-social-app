const express = require("express");
const router = express.Router();
const {
  createPost,
  getAllPosts,
  toggleLike,
  addComment,
  toggleCommentLike,
  toggleReplyLike,
  getPostsByUser,
  updatePost,     // ✅ new
  deletePost,     // ✅ new
} = require("../controllers/postController");

const protect = require("../middleware/authMiddleware");

// ✅ Create a new post
router.post("/create", protect, createPost);

// ✅ Get all posts
router.get("/", getAllPosts);

// ✅ Like or Unlike a specific post
router.post("/:id/like", protect, toggleLike);

// ✅ Edit a post
router.put("/:id", protect, updatePost);   // ✅ new

// ✅ Delete a post
router.delete("/:id", protect, deletePost); // ✅ new

// ✅ Add a comment
router.post("/:id/comment", protect, addComment);

// ✅ Like or Unlike a comment
router.post("/comment/:id/like", protect, toggleCommentLike);

// ✅ Like or Unlike a reply
router.post("/reply/:id/like", protect, toggleReplyLike);

// ✅ Get posts by user
router.get("/user/:userId", getPostsByUser);

module.exports = router;
