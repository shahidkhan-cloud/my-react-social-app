
//const User = require('./models/User');
import User from '../models/User.js';

// Or if that doesn't work, try absolute path
//const User = require(`${process.cwd()}/models/User`);
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// SIGNUP
const signup = async (req, res) => {
  try {
    const { username, bio, password, profilePic } = req.body;

    if (!username || !bio || !password) {
      return res.status(400).json({ message: "All fields are required!" });
    }

    // check if user exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "Username already taken!" });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      bio,
      profilePic,
      password: hashedPassword,
    });

    await newUser.save();

    res.status(201).json({ message: "User created successfully ✅" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error ❌" });
  }
};

// LOGIN
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "All fields are required!" });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: "User not found!" });
    }

    // check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials!" });
    }

    // create token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({
      message: "Login successful ✅",
      token,
      user: {
        id: user._id,
        username: user.username,
        bio: user.bio,
        profilePic: user.profilePic,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error ❌" });
  }
};

module.exports = { signup, login };
