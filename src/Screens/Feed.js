import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

 
const DEFAULT_AVATAR = "https://via.placeholder.com/40";

const Feed = () => {
   const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [files, setFiles] = useState([]);
  const [commentText, setCommentText] = useState({});
  const [replyText, setReplyText] = useState({});
  const [openReplies, setOpenReplies] = useState({});
  const [likeAnimation, setLikeAnimation] = useState({}); // reused for animation trigger
  // gallery modal
  const [modalImages, setModalImages] = useState([]);
  const [modalIndex, setModalIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // per-post comments expanded
  const [commentsExpanded, setCommentsExpanded] = useState({});
  // likes list modal
  const [likesModal, setLikesModal] = useState({ open: false, likes: [], postId: null });

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const token = localStorage.getItem("token");
  

  const hasLiked = (likes) => {
    if (!likes || !user) return false;
    return likes.some((like) => {
      const likeId = typeof like === "string" ? like : like?._id;
      return likeId?.toString() === user?._id?.toString();
    });
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await axios.get("https://my-react-social-app-backend.vercel.com/api/posts");
      setPosts(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load posts ❌");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // --- Likes Handlers ---
  const handleDoubleTap = (postId) => {
    setLikeAnimation((prev) => ({ ...prev, [postId]: true }));
    setTimeout(() => setLikeAnimation((prev) => ({ ...prev, [postId]: false })), 800);
    handleLikePost(postId);
  };

  const handleLikePost = async (postId) => {
    if (!user) return toast.error("Please login first ❌");
    // local pulse animation trigger
    setLikeAnimation((prev) => ({ ...prev, [postId]: true }));
    setTimeout(() => setLikeAnimation((prev) => ({ ...prev, [postId]: false })), 400);

    try {
      const res = await axios.post(
        `https://my-react-social-app-backend.vercel.com/api/posts/${postId}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPosts((prev) =>
        prev.map((p) => (p._id === postId ? { ...p, likes: res.data.likes } : p))
      );
    } catch (err) {
      console.error(err);
      toast.error("Like action failed ❌");
    }
  };

  const handleLikeComment = async (commentId, postId) => {
    if (!user) return toast.error("Please login first ❌");
    try {
      const res = await axios.post(
        `https://my-react-social-app-backend.vercel.com/api/posts/comment/${commentId}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updatedLikes = res.data.comment?.likes || [];
      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId
            ? { ...p, comments: p.comments.map((c) => (c._id === commentId ? { ...c, likes: updatedLikes } : c)) }
            : p
        )
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to like comment ❌");
    }
  };

  const handleLikeReply = async (replyId, commentId) => {
    if (!user) return toast.error("Please login first ❌");
    try {
      const res = await axios.post(
        `https://my-react-social-app-backend.vercel.com/api/replies/${replyId}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updatedReply = res.data.reply;
      setOpenReplies((prev) => (console.log(prev) || {
        ...prev,
        [commentId]: prev[commentId].map((r) => (r._id === replyId ? updatedReply : r)),
      }));
    } catch (err) {
      console.error(err);
      toast.error("Failed to like reply ❌");
    }
  };

  // --- Comments & Replies Handlers ---
  const handleComment = async (postId) => {
    if (!user) return toast.error("Please login first ❌");
    const t = commentText[postId];
    if (!t?.trim()) return toast.error("Comment cannot be empty!");
    try {
      const res = await axios.post(
        `https://my-react-social-app-backend.vercel.com/api/posts/${postId}/comment`,
        { text: t },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPosts((prev) =>
        prev.map((p) => (p._id === postId ? { ...p, comments: [...p.comments, res.data.comment] } : p))
      );
      setCommentText((prev) => ({ ...prev, [postId]: "" }));
    } catch (err) {
      console.error(err);
      toast.error("Failed to add comment ❌");
    }
  };

  const handleReply = async (commentId) => {
    if (!user) return toast.error("Please login first ❌");
    const t = replyText[commentId];
    if (!t?.trim()) return toast.error("Reply cannot be empty!");
    try {
      const res = await axios.post(
        `https://my-react-social-app-backend.vercel.com/api/replies/${commentId}/create`,
        { text: t },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOpenReplies((prev) => ({
        ...prev,
        [commentId]: [...(prev[commentId] || []), res.data.reply],
      }));
      setReplyText((prev) => ({ ...prev, [commentId]: "" }));
    } catch (err) {
      console.error(err);
      toast.error("Failed to add reply ❌");
    }
  };

  const toggleReplies = async (commentId) => {
    if (openReplies[commentId]) {
      setOpenReplies((prev) => ({ ...prev, [commentId]: null }));
    } else {
      try {
        const res = await axios.get(`https://my-react-social-app-backend.vercel.com/api/replies/${commentId}`);
        setOpenReplies((prev) => ({ ...prev, [commentId]: res.data }));
      } catch (err) {
        console.error(err);
        toast.error("Failed to load replies ❌");
      }
    }
  };

  // --- Post Upload ---
  const handlePostUpload = async (e) => {
    e.preventDefault();
    if (!user) return toast.error("Please login first ❌");
    if (!text && files.length === 0) return toast.error("Please add text or images!");
    try {
      setLoading(true);
      let images = [];
      if (files.length > 0) {
        const uploadPromises = files.map(async (file) => {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("upload_preset", "ml_default");
          const cloudRes = await axios.post(
            "https://api.cloudinary.com/v1_1/ddxuael58/image/upload",
            formData
          );
          return cloudRes.data.secure_url;
        });
        images = await Promise.all(uploadPromises);
      }
      await axios.post(
        "https://my-react-social-app-backend.vercel.com/api/posts/create",
        { text, images },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Post uploaded ✅");
      setText("");
      setFiles([]);
      fetchPosts();
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload post ❌");
    } finally {
      setLoading(false);
    }
  };

  // --- Gallery modal helpers (open with images array & index) ---
  const openImageModal = (imagesArray = [], index = 0) => {
    setModalImages(imagesArray);
    setModalIndex(index);
    setIsModalOpen(true);
  };
  const closeImageModal = () => {
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

  // keyboard nav for modal
  const handleKeyDown = useCallback(
    (e) => {
      if (!isModalOpen) return;
      if (e.key === "Escape") closeImageModal();
      if (e.key === "ArrowLeft") showPrevImage();
      if (e.key === "ArrowRight") showNextImage();
    },
    [isModalOpen, modalImages]
  );
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Likes modal (open from post.likes)
  const openLikesModal = (post) => {
    const likesArr = post.likes || [];
    setLikesModal({ open: true, likes: likesArr, postId: post._id });
  };
  const closeLikesModal = () => setLikesModal({ open: false, likes: [], postId: null });

  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster />
      {/* Header */}
      <header className="flex items-center justify-between max-w-2xl px-5 py-3 mx-auto bg-white shadow-md rounded-b-2xl">
        <h1 className="text-xl font-bold text-blue-600">Feed</h1>
        {user ? (
          <Link
            to={`/profile/${user.id}`}
            className="flex items-center gap-2 px-3 py-1 text-sm font-medium text-white transition bg-blue-500 rounded-full hover:bg-blue-600"
          >
            <img
              src={user.profilePic || DEFAULT_AVATAR}
              alt="me"
              className="object-cover w-8 h-8 border border-white rounded-full shadow-sm"
            />
            <span className="hidden sm:inline">My Profile</span>
          </Link>
        ) : (
          <Link
            to="/login"
            className="px-3 py-1 text-sm text-blue-600 border border-blue-500 rounded-full hover:bg-blue-50"
          >
            Login
          </Link>
        )}
      </header>

      {/* Create Post */}
      <div className="max-w-2xl py-6 mx-auto space-y-6">
        <form onSubmit={handlePostUpload} className="p-5 space-y-3 bg-white shadow-md rounded-2xl">
          <div className="flex items-center space-x-3">
            <img
              src={user?.profilePic || DEFAULT_AVATAR}
              alt="profile"
              className="object-cover w-10 h-10 rounded-full"
            />
            <textarea
              placeholder="What's on your mind?"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="flex-1 p-3 border resize-none rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <input
            type="file"
            multiple
            onChange={(e) => setFiles([...e.target.files])}
            className="w-full text-sm text-gray-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 font-semibold text-white bg-blue-500 rounded-2xl hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? "Uploading..." : "Post"}
          </button>
        </form>

        {/* Posts */}
        {loading ? (
          <p className="text-center text-gray-400">Loading posts...</p>
        ) : posts.length === 0 ? (
          <p className="text-center text-gray-400">No posts yet</p>
        ) : (
          posts.map((post) => (
            <div
              key={post._id}
              className="relative overflow-hidden bg-white shadow-md rounded-2xl"
              onDoubleClick={() => handleDoubleTap(post._id)}
            >
              {likeAnimation[post._id] && (
  <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
    <span className="text-6xl text-red-500 animate-ping">❤️</span>
  </div>
)}


              {/* Post Header */}
              <div className="flex items-center p-4 space-x-3">
                <Link
                  to={post.user?._id ? `/profile/${post.user._id}` : "#"}
                  className="flex items-center gap-3"
                >
                  <img
                    src={post.user?.profilePic || DEFAULT_AVATAR}
                    alt="profile"
                    className="object-cover w-10 h-10 rounded-full cursor-pointer"
                  />
                  <h3 className="font-semibold cursor-pointer">{post.user?.username}</h3>
                </Link>
              </div>

              {/* Post Content */}
              <div className="grid gap-2 px-4 pb-3">
                <p className="mb-3 text-gray-800">{post.text}</p>

                {/* Image grid (uses openImageModal now) */}
                {post.images && post.images.length > 0 && (
                  <div className="relative w-full overflow-hidden rounded-2xl">
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
                          className="object-cover w-full h-64 row-span-1 cursor-pointer rounded-2xl"
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
              </div>

              {/* Likes */}
              <div className="flex items-center justify-between px-4 py-2 text-gray-600">
                <div className="flex items-center gap-2">
  {/* ❤️ Like Button */}
  <motion.button
  onClick={() => handleLikePost(post._id)}
  whileTap={{ scale: 0.9 }}
  whileHover={{ scale: 1.1 }}
  className="text-2xl select-none"
>
  <motion.span
    animate={{
      scale: hasLiked(post.likes) || likeAnimation[post._id] ? [1, 1.4, 1] : 1,
    }}
    transition={{ duration: 0.3 }}
    style={{
      color:
        hasLiked(post.likes) || likeAnimation[post._id]
          ? "#ef4444" // ❤️ red when liked
          : "#9ca3af", // 🤍 gray when not liked
      display: "inline-block",
      filter:
        hasLiked(post.likes) || likeAnimation[post._id]
          ? "drop-shadow(0 0 6px rgba(239,68,68,0.4))"
          : "none",
    }}
  >
    ❤️
  </motion.span>
</motion.button>


  {/* 🧍‍♂️ Like Count (Opens Modal, No Like Toggle) */}
  <button
    onClick={() => openLikesModal(post)}
    className="text-sm text-gray-700 hover:underline"
  >
    {post.likes?.length || 0} Likes
  </button>
</div>

                <span className="text-xs text-gray-400">{new Date(post.createdAt).toLocaleString()}</span>
              </div>

              {/* Comments */}
              <div className="px-4 py-3 space-y-3 border-t border-gray-200">
                {(() => {
                 // 🏆 Sort comments so most liked appear first
const allComments = (post.comments || []).sort(
  (a, b) => (b.likes?.length || 0) - (a.likes?.length || 0)
);

                  const expanded = commentsExpanded[post._id];
                  const showCount = expanded ? allComments.length : Math.min(2, allComments.length);
                  const visibleComments = expanded ? allComments : allComments.slice(-showCount);

                  return (
                    <>
                      {/* comment input */}
                      <div className="flex items-center gap-3">
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

                      {/* visible comments */}
{visibleComments.map((c) => (
  <div key={c._id} className="ml-3 space-y-1">
    <div className="flex items-center justify-between">
      <div className="text-gray-800">
        <Link
          to={c.user?._id ? `/profile/${c.user._id}` : "#"}
          className="font-semibold hover:underline"
        >
          {c.user?.username}:
        </Link>{" "}
        {c.text}
      </div>
      <div className="flex items-center gap-1 text-sm text-gray-500">
        <button
          onClick={() => handleLikeComment(c._id, post._id)}
          className={`${hasLiked(c.likes) ? "text-red-500" : "text-gray-400"}`}
        >
          ❤️
        </button>
        <span>{c.likes?.length || 0}</span>
      </div>
    </div>


                          {/* replies list */}
                          {openReplies[c._id]?.map((r) => (
                            <div key={r._id} className="flex items-center justify-between mt-2 ml-5 text-gray-700">
                              <div>
                                <Link
                                  to={r.user?._id ? `/profile/${r.user._id}` : "#"}
                                  className="font-semibold hover:underline"
                                >
                                  {r.user?.username}:
                                </Link>{" "}
                                {r.text}
                              </div>
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <button
                                  onClick={() => handleLikeReply(r._id, c._id)}
                                  className={`${hasLiked(r.likes) ? "text-red-500" : "text-gray-400"}`}
                                >
                                  ❤️
                                </button>
                                <span>{r.likes?.length || 0}</span>
                              </div>
                            </div>
                          ))}

                          {/* toggle replies */}
                          <button
                            onClick={() => toggleReplies(c._id)}
                            className="ml-3 text-xs text-blue-500 hover:underline"
                          >
                            {openReplies[c._id] ? "Hide Replies" : "View Replies"}
                          </button>

                          {/* reply input */}
                          {openReplies[c._id] && (
                            <div className="flex items-center gap-2 mt-2 ml-6">
                              <input
                                type="text"
                                placeholder="Write a reply..."
                                value={replyText[c._id] || ""}
                                onChange={(e) =>
                                  setReplyText({ ...replyText, [c._id]: e.target.value })
                                }
                                className="flex-1 p-2 text-sm border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                              />
                              <button
                                onClick={() => handleReply(c._id)}
                                className="px-3 py-1 text-xs text-white bg-blue-500 rounded-2xl hover:bg-blue-600"
                              >
                                Reply
                              </button>
                            </div>
                          )}
                        </div>
                      ))}

                      {/* view all / hide toggle */}
                      {post.comments?.length > 2 && (
                        <div className="ml-3">
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
                    </>
                  );
                })()}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Gallery Modal */}
      <AnimatePresence>
        {isModalOpen && modalImages.length > 0 && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeImageModal}
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
                onClick={closeImageModal}
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
    const id = u?._id || u?.id || u;
    const name = u?.username || u?.name || "User";
    const pic = u?.profilePic || DEFAULT_AVATAR;

    return (
      <div
        key={id}
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50"
        onClick={() => {
          navigate(`/profile/${id}`);
          closeLikesModal();
        }}
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
  );
};

export default Feed;
