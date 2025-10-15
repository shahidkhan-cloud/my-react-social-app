const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/user");
const cloudinary = require("cloudinary").v2;

// 🟢 Cloudinary config
cloudinary.config({
  cloud_name: "ddxuael58", // 🔹 your cloud name
  api_key: "142743491188937", // 🔹 replace with your Cloudinary API key
  api_secret: "emRfjOtJSPV77IzZkcGaODu0Gs8", // 🔹 replace with your Cloudinary secret
});

// 🟩 Get a user by ID
router.get("/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// 🟦 Update user profile (Edit details + image + optional password)
router.put("/:userId", async (req, res) => {
  try {
    const { username, bio, password, profilePic } = req.body;

    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // 🟢 Update basic fields
    if (username) user.username = username;
    if (bio) user.bio = bio;

    // 🟢 If new password provided → hash and save
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
    }

    // 🟢 If new profile picture (Cloudinary URL) provided → update
    if (profilePic && profilePic.startsWith("http")) {
      user.profilePic = profilePic;
    }

    const updatedUser = await user.save();
    res.json({
      message: "Profile updated successfully ✅",
      user: { ...updatedUser._doc, password: undefined },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error ❌" });
  }
});

// 🟥 Delete user profile
router.delete("/:userId", async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
