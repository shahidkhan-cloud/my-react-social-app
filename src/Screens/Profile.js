import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Heart } from "lucide-react";



const DEFAULT_AVATAR = "https://via.placeholder.com/40";

const Profile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();

  // commentText keyed by postId
  const [commentText, setCommentText] = useState({});
  const [openReplies, setOpenReplies] = useState({});
  const [replyText, setReplyText] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);

  // Image modal (gallery)
  const [modalImages, setModalImages] = useState([]);
  const [modalIndex, setModalIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Like animation per post
  const [likeAnimating, setLikeAnimating] = useState({});

  // Per-post comments expand/collapse
  const [commentsExpanded, setCommentsExpanded] = useState({});

  // Likes list modal (Facebook-style)
  const [likesModal, setLikesModal] = useState({ open: false, likes: [], postId: null });

  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const token = localStorage.getItem("token");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const finalUserId = userId || currentUser?.id;
  const isOwner = currentUser && String(currentUser.id) === String(finalUserId);

  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  

  const hasLiked = (likes) => {
    if (!likes || !currentUser) return false;
    return likes.some((like) => {
      const likeId = typeof like === "string" ? like : like?._id;
      return likeId?.toString() === currentUser?._id?.toString();
    });
  };

  // Fetch user & posts
  useEffect(() => {
    if (!finalUserId) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const [userRes, postsRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/users/${finalUserId}`, { headers }),
          axios.get(`http://localhost:5000/api/posts/user/${finalUserId}`, { headers }),
        ]);
        setUser(userRes.data);
        setPosts(postsRes.data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load profile ❌");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [finalUserId]);

  // Edit Bio
  const handleEditProfile = async () => {
    const newBio = prompt("Enter new bio:", user?.bio || "");
    if (newBio === null) return;
    try {
      const res = await axios.put(
        `http://localhost:5000/api/users/${finalUserId}`,
        { bio: newBio },
        { headers }
      );
      setUser((prev) => ({ ...prev, bio: res.data.bio }));
      toast.success("Profile updated ✅");
    } catch {
      toast.error("Failed to update profile ❌");
    }
  };

  // Change profile picture (Cloudinary)
  const handleProfilePicChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setSelectedImage(URL.createObjectURL(file));
      toast.loading("Uploading profile picture...");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "ml_default");
      const uploadRes = await axios.post(
        "https://api.cloudinary.com/v1_1/ddxuael58/image/upload",
        formData
      );
      const imageUrl = uploadRes.data.secure_url;
      const res = await axios.put(
        `http://localhost:5000/api/users/${finalUserId}`,
        { profilePic: imageUrl },
        { headers }
      );
      setUser((prev) => ({ ...prev, profilePic: res.data.profilePic }));
      toast.dismiss();
      toast.success("Profile picture updated ✅");
    } catch (err) {
      console.error(err);
      toast.dismiss();
      toast.error("Failed to update profile picture ❌");
    }
  };

  // Delete profile
  const handleDeleteProfile = async () => {
    if (!window.confirm("Are you sure you want to delete your profile?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/users/${finalUserId}`, { headers });
      localStorage.clear();
      toast.success("Profile deleted ✅");
      navigate("/login");
    } catch {
      toast.error("Failed to delete profile ❌");
    }
  };

  // Like post with animation
  const handleLikePost = async (postId) => {
    if (!currentUser) return toast.error("Please login first ❌");

    // local pulse animation
    setLikeAnimating((prev) => ({ ...prev, [postId]: true }));
    setTimeout(() => setLikeAnimating((prev) => ({ ...prev, [postId]: false })), 400);

    try {
      const res = await axios.post(
        `http://localhost:5000/api/posts/${postId}/like`,
        {},
        { headers }
      );
      setPosts((prev) =>
        prev.map((p) => (p._id === postId ? { ...p, likes: res.data.likes } : p))
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to like post ❌");
    }
  };

  // Edit post
  const handleEditPost = async (postId, oldText) => {
    const newText = prompt("Edit your post:", oldText);
    if (!newText || newText === oldText) return;
    try {
      const res = await axios.put(
        `http://localhost:5000/api/posts/${postId}`,
        { text: newText },
        { headers }
      );
      setPosts((prev) =>
        prev.map((p) => (p._id === postId ? { ...p, text: res.data.text } : p))
      );
      toast.success("Post updated ✅");
    } catch {
      toast.error("Failed to update post ❌");
    }
  };
  const handleEditPostPic = async (postId, files) => {
  if (!files || files.length === 0) return;

  try {
    toast.loading("Uploading images...");

    const uploadedUrls = [];

    for (let i = 0; i < files.length; i++) {
      const formData = new FormData();
      formData.append("file", files[i]);
      formData.append("upload_preset", "ml_default");

      const uploadRes = await axios.post(
        "https://api.cloudinary.com/v1_1/ddxuael58/image/upload",
        formData
      );
      uploadedUrls.push(uploadRes.data.secure_url);
    }

    // Update post with new images
    const res = await axios.put(
      `http://localhost:5000/api/posts/${postId}`,
      { images: uploadedUrls }, // replace or merge depending on your backend
      { headers }
    );

    // Update posts state
    setPosts((prev) =>
      prev.map((p) =>
        p._id === postId
          ? { ...p, images: res.data.images || uploadedUrls }
          : p
      )
    );

    // Clear the file input
    const input = document.getElementById(`editPostPic-${postId}`);
    if (input) input.value = "";

    toast.dismiss();
    toast.success("Post image(s) updated ✅");
  } catch (err) {
    console.error(err);
    toast.dismiss();
    toast.error("Failed to update post images ❌");
  }
};


  // Delete post
  const handleDeletePost = async (postId) => {
    if (!window.confirm("Delete this post?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/posts/${postId}`, { headers });
      setPosts((prev) => prev.filter((p) => p._id !== postId));
      toast.success("Post deleted ✅");
    } catch {
      toast.error("Failed to delete post ❌");
    }
  };

  // Comment / Reply handlers (unchanged)
  const handleComment = async (postId) => {
    const text = commentText[postId];
    if (!text?.trim()) return toast.error("Comment cannot be empty!");
    try {
      const res = await axios.post(
        `http://localhost:5000/api/posts/${postId}/comment`,
        { text },
        { headers }
      );
      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId ? { ...p, comments: [...p.comments, res.data.comment] } : p
        )
      );
      setCommentText((prev) => ({ ...prev, [postId]: "" }));
    } catch {
      toast.error("Failed to add comment ❌");
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    try {
      await axios.delete(`http://localhost:5000/api/comments/${commentId}`, { headers });
      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId
            ? { ...p, comments: p.comments.filter((c) => c._id !== commentId) }
            : p
        )
      );
      toast.success("Comment deleted ✅");
    } catch {
      toast.error("Failed to delete comment ❌");
    }
  };

  const handleReply = async (commentId) => {
    const text = replyText[commentId];
    if (!text?.trim()) return toast.error("Reply cannot be empty!");
    try {
      const res = await axios.post(
        `http://localhost:5000/api/replies/${commentId}/create`,
        { text },
        { headers }
      );
      setOpenReplies((prev) => ({
        ...prev,
        [commentId]: [...(prev[commentId] || []), res.data.reply],
      }));
      setReplyText((prev) => ({ ...prev, [commentId]: "" }));
    } catch {
      toast.error("Failed to add reply ❌");
    }
  };

  const toggleReplies = async (commentId) => {
    if (openReplies[commentId]) {
      setOpenReplies((prev) => ({ ...prev, [commentId]: null }));
    } else {
      try {
        const res = await axios.get(`http://localhost:5000/api/replies/${commentId}`);
        setOpenReplies((prev) => ({ ...prev, [commentId]: res.data }));
      } catch {
        toast.error("Failed to load replies ❌");
      }
    }
  };

  const handleDeleteReply = async (commentId, replyId) => {
    try {
      await axios.delete(`http://localhost:5000/api/replies/${replyId}`, { headers });
      setOpenReplies((prev) => ({
        ...prev,
        [commentId]: prev[commentId]?.filter((r) => r._id !== replyId),
      }));
      toast.success("Reply deleted ✅");
    } catch {
      toast.error("Failed to delete reply ❌");
    }
  };
  

// ✅ Like Comment
const handleLikeComment = async (commentId, postId) => {
  if (!user) return toast.error("Please login first ❌");
  try {
    const res = await axios.post(
  `http://localhost:5000/api/posts/comment/${commentId}/like`,
  {},
  { headers: { Authorization: `Bearer ${token}` } }
);

    const updatedLikes = res.data.comment?.likes || [];

    // Update the posts state correctly
    setPosts((prevPosts) =>
      prevPosts.map((p) =>
        p._id === postId
          ? {
              ...p,
              comments: p.comments.map((c) =>
                c._id === commentId ? { ...c, likes: updatedLikes } : c
              ),
            }
          : p
      )
    );
  } catch (err) {
    console.error(err);
    toast.error("Failed to like comment ❌");
  }
};

const handleLogout = () => {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
  toast.success("Logged out ✅");
  navigate("/login");
};

// ✅ Like Reply (already correct)
const handleLikeReply = async (replyId, commentId) => {
  if (!user) return toast.error("Please login first ❌");
  try {
    const res = await axios.post(
      `http://localhost:5000/api/replies/${replyId}/like`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const updatedReply = res.data.reply;
    setOpenReplies((prev) => ({
      ...prev,
      [commentId]: prev[commentId].map((r) =>
        r._id === replyId ? updatedReply : r
      ),
    }));
  } catch (err) {
    console.error(err);
    toast.error("Failed to like reply ❌");
  }
};



  

  // Gallery modal helpers
  const openImageModal = (imagesArray = [], index = 0) => {
    setModalImages(imagesArray);
    setModalIndex(index);
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setIsModalOpen(false);
    setModalImages([]);
    setModalIndex(0);
  };
  const showPrevImage = (e) => {
    e?.stopPropagation();
    if (!modalImages.length) return;
    setModalIndex((prev) => (prev - 1 + modalImages.length) % modalImages.length);
  };
  const showNextImage = (e) => {
    e?.stopPropagation();
    if (!modalImages.length) return;
    setModalIndex((prev) => (prev + 1) % modalImages.length);
  };

  // Keyboard nav for gallery
  const handleKeyDown = useCallback(
    (e) => {
      if (!isModalOpen) return;
      if (e.key === "Escape") closeModal();
      if (e.key === "ArrowLeft") showPrevImage();
      if (e.key === "ArrowRight") showNextImage();
    },
    [isModalOpen, modalImages]
  );
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Likes modal 
  const openLikesModal = (post) => {
    const likesArr = post.likes || [];
    // normalize like entries: if like contains user object or id strings, prefer object
    // assume post.likes is an array of user objects { _id, username, profilePic }
    setLikesModal({ open: true, likes: likesArr, postId: post._id });
  };
  const closeLikesModal = () => setLikesModal({ open: false, likes: [], postId: null });

  if (loading) return <p className="mt-10 text-center">Loading...</p>;
  if (!user) return <p className="mt-10 text-center">User not found ❌</p>;

  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster />
      <div className="max-w-2xl py-6 mx-auto space-y-6">
        {/* USER INFO */}
        <div className="flex items-center gap-4 p-5 bg-white shadow-md rounded-2xl">
          <div className="relative">
            <img
              src={selectedImage || user.profilePic || DEFAULT_AVATAR}
              alt="profile"
              className="object-cover w-20 h-20 rounded-full"
               onClick={() => openImageModal([selectedImage || user.profilePic || DEFAULT_AVATAR], 0)} // Open modal
  />
            
            {isOwner && (
              <>
                <label
                  htmlFor="profilePicUpload"
                  className="absolute bottom-0 right-0 p-1 text-xs text-white bg-blue-500 rounded-full cursor-pointer hover:bg-blue-600"
                >
                  📸
                </label>
                <input
                  id="profilePicUpload"
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePicChange}
                  className="hidden"
                />
              </>
            )}
          </div>

          <div className="flex-1">
            <h2 className="text-2xl font-bold">{user.username}</h2>
            <p className="mt-1 text-gray-600">{user.bio}</p>
          </div>

          {isOwner && (
            <div className="flex flex-col gap-2">
              <button
                onClick={handleEditProfile}
                className="px-3 py-1 text-sm text-white bg-blue-500 rounded-2xl hover:bg-blue-600"
              >
                Edit Bio
              </button>
              <button
                onClick={handleDeleteProfile}
                className="px-3 py-1 text-sm text-white bg-red-500 rounded-2xl hover:bg-red-600"
              >
                Delete
              </button>
              
    <button
      onClick={handleLogout}
      className="px-3 py-1 text-sm text-white bg-gray-700 rounded-2xl hover:bg-gray-800"
    >
      Logout
    </button>
            </div>
          )}
        </div>

        {/* USER POSTS */}
        {posts.map((post) => (
          <div key={post._id} className="p-4 bg-white shadow-md rounded-2xl">
            <p className="text-gray-800">{post.text}</p>

            {/* Facebook-style grid with click opening modal (pass whole array so modal can navigate) */}
            {post.images && post.images.length > 0 && (
              <div className="relative w-full mt-3 overflow-hidden rounded-2xl">
                {post.images.length === 1 && (
                  <img
                    src={post.images[0]}
                    alt="post"
                    className="object-cover w-full max-h-[500px] rounded-2xl cursor-pointer"
                    onClick={() => openImageModal(post.images, 0)}
                  />
                )}

                {post.images.length === 2 && (
                  <div className="grid grid-cols-2 gap-2">
                    {post.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`post-${idx}`}
                        className="object-cover w-full h-64 cursor-pointer rounded-2xl"
                        onClick={() => openImageModal(post.images, idx)}
                      />
                    ))}
                  </div>
                )}

                {post.images.length === 3 && (
                  <div className="grid grid-rows-2 gap-2">
                    <img
                      src={post.images[0]}
                      alt="main"
                      className="object-cover w-full h-64 cursor-pointer rounded-2xl"
                      onClick={() => openImageModal(post.images, 0)}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      {post.images.slice(1).map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`post-${idx + 1}`}
                          className="object-cover w-full h-48 cursor-pointer rounded-2xl"
                          onClick={() => openImageModal(post.images, idx + 1)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {post.images.length >= 4 && (
                  <div className="grid grid-cols-2 grid-rows-2 gap-2">
                    {post.images.slice(0, 4).map((img, idx) => (
                      <div
                        key={idx}
                        className="relative overflow-hidden cursor-pointer rounded-2xl"
                        onClick={() => openImageModal(post.images, idx)}
                      >
                        <img
                          src={img}
                          alt={`post-${idx}`}
                          className="object-cover w-full h-56"
                        />
                        {idx === 3 && post.images.length > 4 && (
                          <div className="absolute inset-0 flex items-center justify-center text-2xl font-semibold text-white bg-black bg-opacity-60">
                            +{post.images.length - 4}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Like / Edit / Delete */}
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-3">
  {/* Heart button with animation */}
  <motion.button
    onClick={() => handleLikePost(post._id)}
    whileTap={{ scale: 0.95 }}
    className="flex items-center gap-2"
  >
    <motion.span
      animate={
        hasLiked(post.likes) || likeAnimating[post._id]
          ? { scale: [1, 1.4, 1], color: "#ef4444" }
          : { scale: 1, color: "#9ca3af" }
      }
      transition={{ duration: 0.35 }}
      style={{ fontSize: 22, display: "inline-block" }}
    >
      ❤️
    </motion.span>
  </motion.button>

  {/* Likes count button (separate, not nested) */}
  <button
    onClick={() => openLikesModal(post)}
    className="text-sm text-gray-700 hover:underline"
  >
    {post.likes?.length || 0} Likes
  </button>
</div>


             {isOwner && (
  <div className="flex gap-3">
    <button
      onClick={() => handleEditPost(post._id, post.text)}
      className="text-green-500 hover:underline"
    >
      Edit
    </button>
    <button
      onClick={() => handleDeletePost(post._id)}
      className="text-red-500 hover:underline"
    >
      Delete
    </button>

    <label
      htmlFor={`editPostPic-${post._id}`}
      className="text-blue-500 cursor-pointer hover:underline"
    >
      Edit Image
    </label>
    <input
      id={`editPostPic-${post._id}`}
      type="file"
      accept="image/*"
      multiple
      onChange={(e) => handleEditPostPic(post._id, e.target.files)}
      className="hidden"
    />
  </div>
)}

            </div>

            {/* COMMENTS + REPLIES */}
<div className="pt-3 mt-4 space-y-3 border-t border-gray-200">
  {(() => {
    const allComments = post.comments || [];
    const expanded = commentsExpanded[post._id];
    const showCount = expanded ? allComments.length : Math.min(2, allComments.length);
    const visibleComments = expanded ? allComments : allComments.slice(-showCount);

    return (
      <>
        <AnimatePresence initial={false}>
          {visibleComments.map((comment, idx) => (
            <motion.div
              key={comment._id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.18, delay: idx * 0.02 }}
              className="ml-2"
            >
              {/* Comment text + delete */}
              <div className="flex items-start justify-between">
                <p className="flex-1">
                  <span className="font-semibold">{comment.user?.username || "User"}:</span>{" "}
                  {comment.text}
                </p>
                {(isOwner || comment.user?.id === currentUser?.id) && (
                  <button
                    onClick={() => handleDeleteComment(post._id, comment._id)}
                    className="flex-shrink-0 ml-2 text-xs text-red-500 hover:underline"
                  >
                    Delete
                  </button>
                )}
              </div>

              {/* Comment actions: Like + View Replies */}
              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleLikeComment(comment._id, post._id)}
                    className={`transition ${hasLiked(comment.likes) ? "text-red-500" : "text-gray-400 hover:text-red-400"}`}
                  >
                    <Heart size={18} />
                  </button>
                  <span className="text-sm text-gray-500">{comment.likes?.length || 0}</span>
                </div>

                <button
                  onClick={() => toggleReplies(comment._id)}
                  className="text-xs text-blue-500 hover:underline"
                >
                  {openReplies[comment._id] ? "Hide replies" : "View replies"}
                </button>
              </div>

              {/* Replies */}
              {openReplies[comment._id] && (
                <div className="mt-2 ml-6 space-y-2">
                  {openReplies[comment._id]?.map((reply) => (
                    <div key={reply._id} className="flex items-start justify-between">
                      <p className="flex-1 text-sm text-gray-700">
                        <span className="font-semibold">{reply.user?.username || "User"}:</span>{" "}
                        {reply.text}
                      </p>

                      <div className="flex items-center flex-shrink-0 gap-2">
                        {/* Like button */}
                        <button
                          onClick={() => handleLikeReply(reply._id, comment._id)}
                          className={`transition ${hasLiked(reply.likes) ? "text-red-500" : "text-gray-400 hover:text-red-400"}`}
                        >
                          <Heart size={16} />
                        </button>
                        <span className="text-xs text-gray-500">{reply.likes?.length || 0}</span>

                        {/* Delete */}
                        {(isOwner || reply.user?.id === currentUser?.id) && (
                          <button
                            onClick={() => handleDeleteReply(comment._id, reply._id)}
                            className="text-xs text-red-500 hover:underline"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Add reply input */}
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="text"
                      placeholder="Write a reply..."
                      value={replyText[comment._id] || ""}
                      onChange={(e) =>
                        setReplyText({ ...replyText, [comment._id]: e.target.value })
                      }
                      className="flex-1 p-1 text-sm border rounded-2xl focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                    <button
                      onClick={() => handleReply(comment._id)}
                      className="px-2 py-1 text-xs text-white bg-green-500 rounded-2xl hover:bg-green-600"
                    >
                      Reply
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Toggle view all / hide */}
        {post.comments?.length > 2 && (
          <div className="ml-2">
            <button
              onClick={() =>
                setCommentsExpanded((prev) => ({ ...prev, [post._id]: !prev[post._id] }))
              }
              className="text-xs text-blue-500 hover:underline"
            >
              {commentsExpanded[post._id] ? "Hide comments" : `View all comments (${post.comments.length})`}
            </button>
          </div>
        )}

        {/* Add comment input */}
        <div className="flex items-center gap-3 mt-3">
          <input
            type="text"
            placeholder="Add a comment..."
            value={commentText[post._id] || ""}
            onChange={(e) =>
              setCommentText({ ...commentText, [post._id]: e.target.value })
            }
            className="flex-1 p-2 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={() => handleComment(post._id)}
            className="px-3 py-1 text-white bg-green-500 rounded-2xl hover:bg-green-600"
          >
            Comment
          </button>
        </div>
      </>
    );
  })()}
</div>

            </div>
          
        ))}

        {/* Gallery Modal */}
        <AnimatePresence>
          {isModalOpen && modalImages.length > 0 && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
            >
              <motion.div
                className="relative max-w-4xl max-h-[90vh] w-full px-4"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Prev */}
                {modalImages.length > 1 && (
                  <button
                    onClick={showPrevImage}
                    className="absolute z-50 p-2 text-white -translate-y-1/2 bg-black rounded-full left-3 top-1/2 bg-opacity-40 hover:bg-opacity-60"
                  >
                    <ChevronLeft size={28} />
                  </button>
                )}

                {/* Next */}
                {modalImages.length > 1 && (
                  <button
                    onClick={showNextImage}
                    className="absolute z-50 p-2 text-white -translate-y-1/2 bg-black rounded-full right-3 top-1/2 bg-opacity-40 hover:bg-opacity-60"
                  >
                    <ChevronRight size={28} />
                  </button>
                )}

                {/* Close */}
                <button
                  onClick={closeModal}
                  className="absolute z-50 p-2 text-white bg-black bg-opacity-50 rounded-full top-3 right-3 hover:bg-opacity-80"
                >
                  <X size={22} />
                </button>

                <motion.img
                  key={modalImages[modalIndex]}
                  src={modalImages[modalIndex]}
                  alt="zoomed"
                  className="mx-auto max-h-[82vh] object-contain rounded-2xl"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.18 }}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Likes List Modal (Facebook-style centered small popup) */}
        <AnimatePresence>
          {likesModal.open && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeLikesModal}
            >
              <motion.div
                className="w-full max-w-md overflow-hidden bg-white shadow-xl rounded-2xl"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                transition={{ duration: 0.18 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-4 py-3 border-b">
                  <h3 className="text-lg font-semibold">Liked by</h3>
                  <button
                    onClick={closeLikesModal}
                    className="p-1 rounded-full hover:bg-gray-100"
                    aria-label="Close likes"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="overflow-auto max-h-72">
                  {likesModal.likes && likesModal.likes.length > 0 ? (
                    likesModal.likes.map((u) => {
                      // u may be an id string or an object; try to use object fields
                      const id = u?._id || u?.id || u;
                      const name = u?.username || u?.name || "User";
                      const pic = u?.profilePic || DEFAULT_AVATAR;
                      return (
                        <div
                          key={id}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50"
                        >
                          <img
                            src={pic}
                            alt={name}
                            className="object-cover w-10 h-10 rounded-full"
                            onError={(e) => (e.currentTarget.src = DEFAULT_AVATAR)}
                          />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-800">{name}</div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 text-sm text-gray-500">No likes yet</div>
                  )}
                </div>
                
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Profile;
