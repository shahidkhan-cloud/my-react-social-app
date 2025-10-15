import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom"; // ✅ import useNavigate
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";

const Signup = () => {
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [password, setPassword] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate(); // ✅ initialize navigate

  // Submit signup form
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !bio || !password || !file) {
      return toast.error("All fields are required!");
    }

    try {
      setLoading(true);

      // ✅ Step 1: Upload file to Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "ml_default"); // your preset

      const uploadRes = await axios.post(
        "https://api.cloudinary.com/v1_1/ddxuael58/image/upload", // your Cloudinary cloud name
        formData
      );

      const profilePic = uploadRes.data.secure_url;
      console.log("✅ Cloudinary uploaded:", profilePic);

      // ✅ Step 2: Send signup data to backend
      const res = await axios.post("http://localhost:5000/api/auth/signup", {
        username,
        bio,
        password,
        profilePic,
      });

      console.log("Signup response:", res.data);
      toast.success("Signup successful ✅");

      // ✅ Navigate to login after short delay
      setTimeout(() => {
        navigate("/login"); // redirect to login page
      }, 1500);

      // Clear form
      setUsername("");
      setBio("");
      setPassword("");
      setFile(null);
    } catch (err) {
      console.log(err);
      toast.error(err.response?.data?.message || "Signup failed ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Toaster />
      <form
        onSubmit={handleSubmit}
        className="flex flex-col w-full max-w-sm p-10 space-y-4 bg-white shadow-lg rounded-2xl"
      >
        {/* Title */}
        <h2 className="text-3xl font-bold text-center text-gray-800">Sign Up</h2>

        {/* Username */}
        <div className="flex flex-col">
          <label className="mb-1 font-medium text-gray-600">Username</label>
          <input
            type="text"
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Bio */}
        <div className="flex flex-col">
          <label className="mb-1 font-medium text-gray-600">Bio</label>
          <input
            type="text"
            placeholder="Enter bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Password */}
        <div className="flex flex-col">
          <label className="mb-1 font-medium text-gray-600">Password</label>
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* File Upload */}
        <div className="flex flex-col">
          <label className="mb-1 font-medium text-gray-600">Profile Picture</label>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            className="w-full p-2 text-gray-600 border rounded-lg cursor-pointer"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 font-semibold text-white transition bg-blue-500 rounded-lg shadow-md hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? "Processing..." : "Sign Up"}
        </button>

        <p className="mt-4 text-center text-gray-600">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-blue-500 hover:underline">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Signup;
