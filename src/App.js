import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Signup from "./Screens/Signup";
import Login from "./Screens/Login";
import Feed from "./Screens/Feed";
import Profile from "./Screens/Profile";


function App() {
  // ✅ Get the logged-in user from localStorage
  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Private Routes */}
        <Route path="/feed" element={user ? <Feed /> : <Navigate to="/login" />} />
         <Route path="/profile/:userId" element={<Profile />} />
    

        

        {/* Dynamic Profile route (other users) */}
        <Route path="/profile/:userId" element={user ? <Profile /> : <Navigate to="/login" />} />

        {/* Redirect /profile to logged-in user's profile */}
        <Route
          path="/profile"
          element={user ? <Navigate to={`/profile/${user._id}`} /> : <Navigate to="/login" />}
        />
      </Routes>
    </Router>
  );
}

export default App;
