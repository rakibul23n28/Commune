import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import Layout from "../components/Layout";
import CommuneNavbar from "../components/CommuneNavbar";
import CommuneFixedNav from "../components/CommuneFixedNav";
import { timeAgo } from "../utils/Helper";
import { useCommuneMembership } from "../context/CommuneMembershipContext";
import { useAuth } from "../context/AuthContext";

const CollaborationPostPage = () => {
  const { communeid } = useParams();
  const [posts, setPosts] = useState([]);
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const { getRole, fetchCommuneData, communeData } = useCommuneMembership();
  const [commune, setCommune] = useState(null);
  const [showOptions, setShowOptions] = useState(null);
  const [showComments, setShowComments] = useState(null);
  const [commentInput, setCommentInput] = useState("");

  // New state to track comments for each post
  const [newComments, setNewComments] = useState({});

  useEffect(() => {
    const loadCommuneData = async () => {
      if (!communeData) {
        try {
          await fetchCommuneData(communeid);
        } catch (err) {
          setErrorMessage(
            err.response?.data?.message || "Failed to load commune data"
          );
        }
      }
    };
    loadCommuneData();
  }, [communeData, communeid]);

  useEffect(() => {
    if (communeData) {
      setCommune(communeData);
    }
  }, [communeData]);

  const fetchCommunePosts = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/collaboration/${communeid}/posts`);
      setPosts(response.data.posts);
    } catch (error) {
      setErrorMessage("Error fetching posts. Please try again.");
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionsClick = (postId) => {
    setShowOptions((prev) => (prev === postId ? null : postId));
  };

  const handleCopyLink = (postId) => {
    const link = `${window.location.origin}/commune/${communeid}/post/${postId}`;
    navigator.clipboard.writeText(link);
    alert("Post link copied to clipboard!");
  };

  const handleDeleteCollaboration = async (postId) => {
    if (window.confirm("Are you sure you want to delete this collaboration?")) {
      try {
        const response = await axios.delete(
          `/api/collaboration/${postId}/post`,
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        );
        // alert(response.data.message);
        setPosts((prevPosts) =>
          prevPosts.filter((post) => post.post_id !== postId)
        );
      } catch (error) {
        console.error("Error deleting collaboration:", error);
        alert(
          error.response?.data?.message ||
            "Failed to delete collaboration. Please try again."
        );
      }
    }
  };
  const handleReaction = async (postId, type) => {
    // Check if the user has already reacted
    const userReaction = posts.find(
      (post) => post.post_id === postId
    )?.userReaction;

    if (userReaction === type) {
      alert(`You have already ${type}d this post.`);
      return; // Prevent the user from reacting again
    }

    try {
      // Send reaction to the server
      const response = await axios.post(
        `/api/post/${postId}/reactions`,
        { reaction_type: type },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      console.log(response.data);

      // Update the reaction counts based on the new reaction
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.post_id === postId
            ? {
                ...post,
                userReaction: type, // Track the user's reaction
                likes: response.data.reaction_count.like,

                hates: response.data.reaction_count.hate,
              }
            : post
        )
      );
    } catch (error) {
      console.error("Error handling reaction:", error);
      alert("Failed to react. Please try again.");
    }
  };

  const handleToggleComments = (postId) => {
    if (showComments === postId) {
      setShowComments(null);
    } else {
      setShowComments(postId);
      // Clear the comment input field when toggling the comments
      setNewComments((prev) => ({
        ...prev,
        [postId]: "", // Reset the comment input to be empty
      }));
      fetchComments(postId);
    }
  };

  const handleAddComment = async (postId) => {
    const content = commentInput;
    console.log(content);

    if (!content.trim()) {
      alert("Comment cannot be empty.");
      return;
    }

    try {
      const response = await axios.post(
        `/api/post/${postId}/comments`,
        { content },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      const newComment = response.data.comment;
      // console.log(newComment, "asdsadsd");

      setNewComments((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), newComment],
      }));

      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.post_id === postId
            ? {
                ...post,
                comments: post.comments + 1,
              }
            : post
        )
      );

      setCommentInput("");

      alert("Comment added!");
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("Failed to add comment. Please try again.");
    }
  };

  const fetchComments = async (postId) => {
    try {
      const response = await axios.get(`/api/post/${postId}/comments`);
      setNewComments((prev) => ({
        ...prev,
        [postId]: response.data.comments || [],
      }));
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  useEffect(() => {
    fetchCommunePosts();
  }, [communeid]);

  if (loading) {
    return <div className="text-center py-10">Loading posts...</div>;
  }

  return (
    <Layout>
      <CommuneFixedNav />
      <CommuneNavbar name={communeData?.name} />
      <div className="w-1/2 mx-auto p-6 mt-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-3xl font-extrabold mb-6 text-gray-800 border-b pb-2">
          Posts in {communeData?.name}
        </h2>
        {errorMessage && (
          <div className="text-red-600 mb-4 font-medium">{errorMessage}</div>
        )}
        <div className="space-y-8">
          {posts.length > 0 &&
            posts.map((post) => (
              <div
                key={post.post_id}
                className="bg-gray-50 p-6 border rounded-lg shadow-sm hover:shadow-md transition duration-300"
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center justify-center">
                    <img
                      src={post.profile_image || "/default-avatar.png"}
                      alt="User avatar"
                      className="w-12 h-12 rounded-full mr-4 border"
                    />
                    <div>
                      <Link to={`/profile/${post.username}`}>
                        <p className="text-lg font-medium text-gray-800">
                          {post.username}
                        </p>
                      </Link>
                      <p className="text-sm text-gray-500">
                        {timeAgo(post.created_at)} ago
                      </p>
                    </div>
                  </div>
                  <div className="flex relative">
                    <button
                      onClick={() => handleOptionsClick(post.post_id)}
                      className="text-gray-600 hover:text-gray-800 p-2"
                    >
                      <i className="fas fa-ellipsis-v"></i>
                    </button>
                    {showOptions === post.post_id && (
                      <div className="absolute right-0 mt-10 w-48 bg-white border rounded-lg shadow-lg z-10">
                        <button
                          onClick={() => handleCopyLink(post.post_id)}
                          className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center"
                        >
                          <i className="fas fa-link mr-2"></i> Copy Link
                        </button>
                        {(getRole(communeid) === "admin" ||
                          getRole(communeid) === "moderator") && (
                          <button
                            onClick={() =>
                              handleDeleteCollaboration(post.post_id)
                            }
                            className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center"
                          >
                            <i className="fas fa-trash mr-2"></i> Collaboration
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                  <Link to={`/commune/${communeid}/post/${post.post_id}`}>
                    {post.title}
                  </Link>
                </h3>
                <div
                  className="text-gray-700 overflow-hidden max-h-96 overflow-ellipsis break-words"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                ></div>
                <div className="flex justify-between w-full space-x-4 mt-4">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleReaction(post.post_id, "like")}
                      className="text-green-600"
                    >
                      👍 {post.likes || 0}
                    </button>
                    <button
                      onClick={() => handleReaction(post.post_id, "hate")}
                      className="text-red-600"
                    >
                      👎 {post.hates || 0}
                    </button>
                  </div>
                  <div className="flex space-x-2 relative">
                    <button
                      onClick={() => handleToggleComments(post.post_id)}
                      className="text-gray-600"
                    >
                      💬 {post.comments || 0}
                    </button>
                    {showComments === post.post_id && (
                      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50">
                        {/* Comments modal */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white border rounded-lg shadow-lg p-4 z-60">
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="text-lg font-bold">Comments</h4>
                            <button
                              onClick={() => setShowComments(null)}
                              className="text-gray-600 hover:text-gray-800"
                            >
                              ✖
                            </button>
                          </div>
                          <div className="space-y-2 mt-2 max-h-96 overflow-y-auto">
                            {Array.isArray(newComments[post.post_id]) &&
                              newComments[post.post_id]?.map((comment) => (
                                <div
                                  key={comment.comment_id}
                                  className="border-b pb-2 flex items-start space-x-4"
                                >
                                  {/* Display user profile image */}
                                  <img
                                    src={
                                      comment.profile_image ||
                                      "/default-avatar.png"
                                    }
                                    alt={`${comment.username}'s avatar`}
                                    className="w-10 h-10 rounded-full"
                                  />
                                  <div className="flex-1">
                                    {/* Display comment content */}
                                    <p className="text-gray-800">
                                      {comment.content}
                                    </p>
                                    {/* Display time ago and username */}
                                    <p className="text-sm text-gray-500">
                                      {timeAgo(comment.created_at)} by{" "}
                                      <Link to={`/profile/${comment.username}`}>
                                        <strong className="font-semibold text-blue-500">
                                          {comment.username}
                                        </strong>
                                      </Link>
                                    </p>
                                  </div>
                                </div>
                              ))}
                          </div>
                          {/* Comment input field */}
                          <textarea
                            value={commentInput}
                            onChange={(e) => setCommentInput(e.target.value)}
                            className="w-full mt-2 border rounded p-2"
                            placeholder="Add a comment..."
                          ></textarea>
                          <button
                            onClick={() => handleAddComment(post.post_id)}
                            className="mt-2 bg-blue-500 text-white px-4 py-2 rounded"
                          >
                            Comment
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </Layout>
  );
};

export default CollaborationPostPage;
