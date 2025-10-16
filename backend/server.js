const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();



app.use(cors({ origin: '*' }));
app.use(express.json());

const app = express();

// Middleware
app.use(
  cors({
    origin: ["https://my-react-social-app.vercel.app"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());

// ✅ Basic routes
app.get("/", (req, res) => {
  res.json({ 
    message: "Server is running! 🚀",
    status: "OK",
    timestamp: new Date().toISOString()
  });
});

app.get("/health", (req, res) => {
  res.json({ 
    status: "Healthy ✅",
    database: "Not connected yet",
    timestamp: new Date().toISOString()
  });
});

// ✅ STEP 1: Add back ONLY auth routes first
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

// ❌ Keep other routes commented out for now
// const postRoutes = require("./routes/postRoutes");
// const replyRoutes = require("./routes/replyRoutes");
// const userRoutes = require("./routes/userRoutes");
// app.use("/api/posts", postRoutes);
// app.use("/api/replies", replyRoutes);
// app.use("/api/users", userRoutes);
// app.use("/api/comments", require("./routes/commentRoutes"));
// app.use("/uploads", express.static("uploads"));

// MongoDB Connect
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ MongoDB Error:", err));

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;