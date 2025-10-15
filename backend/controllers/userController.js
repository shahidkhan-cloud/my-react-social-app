// PUT /api/users/:id/upload
const uploadProfilePic = async (req, res) => {
  try {
    const { profilePic } = req.body; // Cloudinary image URL
    const userId = req.params.id;

    if (!profilePic) {
      return res.status(400).json({ message: "No image URL provided ❌" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found ❌" });
    }

    user.profilePic = profilePic;
    await user.save();

    res.status(200).json({
      message: "Profile picture updated ✅",
      profilePic: user.profilePic,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error ❌" });
  }
};

module.exports = { uploadProfilePic };
