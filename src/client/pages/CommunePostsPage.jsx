import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import Layout from "../components/Layout";
import CommuneNavbar from "../components/CommuneNavbar";
import CommuneFixedNav from "../components/CommuneFixedNav";
import { timeAgo } from "../utils/Helper";
import { useCommuneMembership } from "../context/CommuneMembershipContext";
import { useAuth } from "../context/AuthContext";

const CommunePostsPage = () => {
  const { communeid } = useParams();
  const [posts, setPosts] = useState([]);
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const { getRole, fetchCommuneData, communeData } = useCommuneMembership();
  const [commune, setCommune] = useState(null);
  const [showCollaboration, setShowCollaboration] = useState(false);
  const [userCommunes, setUserCommunes] = useState([]);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [showOptions, setShowOptions] = useState(null); // State for showing options

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
  }, [communeData]);

  useEffect(() => {
    if (communeData) {
      setCommune(communeData);
    }
  }, [communeData]);

  const fetchCommunePosts = async () => {
    try {
      const response = await axios.get(`/api/commune/${communeid}/posts`);
      setPosts(response.data.posts);
    } catch (error) {
      setErrorMessage("Error fetching posts. Please try again.");
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (postId) => {
    location.href = `/commune/edit/${communeid}/${postId}/post`;
  };

  const handleDelete = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await axios.delete(`/api/commune/post/${postId}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      fetchCommunePosts(); // Refresh posts after deletion
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Error deleting post. Please try again.");
    }
  };

  const handleOptionsClick = (postId) => {
    setShowOptions((prev) => (prev === postId ? null : postId)); // Toggle visibility of options
  };

  const fetchUserCommunes = async () => {
    try {
      const response = await axios.get(
        `/api/user/communes/info/${user.id}?commune_id=${communeid}`
      );
      setUserCommunes(response.data.communes);
    } catch (error) {
      console.error("Error fetching user communes:", error);
    }
  };

  const makeCollaboration = async (commune_id_2, post_id) => {
    try {
      const response = await axios.post(
        `/api/collaboration/post`,
        {
          commune_id_1: communeid, // Current commune ID
          commune_id_2, // Selected commune ID
          post_id,
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      alert(response.data.message);
      setShowCollaboration(false);
    } catch (error) {
      console.error("Error creating collaboration:", error);
      alert(
        error.response?.data?.message ||
          "Failed to create collaboration. Please try again."
      );
    }
  };

  const handleCollaborationClick = (post_id) => {
    setSelectedPostId(post_id); // Set the selected post ID
    fetchUserCommunes();
    setShowCollaboration(true);
  };

  const closeCollaborationPopup = () => {
    setShowCollaboration(false);
  };

  useEffect(() => {
    fetchCommunePosts();
  }, [communeid]);

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

  const handleCopyLink = (postId) => {
    const link = `${window.location.origin}/commune/${communeid}/post/${postId}`;
    navigator.clipboard.writeText(link);
    alert("Post link copied to clipboard!");
  };

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
                        <p className="text-lg font-medium text-gray-800 hover:underline">
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
                      onClick={() => handleCollaborationClick(post.post_id)}
                      className="text-green-500 hover:text-green-700 p-2"
                    >
                      Collaboration
                    </button>
                    <button
                      onClick={() => handleOptionsClick(post.post_id)}
                      className="text-gray-600 hover:text-gray-800 p-2"
                    >
                      <i className="fas fa-ellipsis-v"></i>
                    </button>
                    {showOptions === post.post_id && (
                      <div className="absolute right-0 mt-10 w-48 bg-white border rounded-lg shadow-lg z-1">
                        <button
                          onClick={() => handleCopyLink(post.post_id)}
                          className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center"
                        >
                          <i className="fas fa-link mr-2"></i> Copy Link
                        </button>
                        {(getRole(communeid) === "admin" ||
                          getRole(communeid) === "moderator") && (
                          <>
                            <button
                              onClick={() => handleEdit(post.post_id)}
                              className="block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(post.post_id)}
                              className="block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100"
                            >
                              Delete
                            </button>
                          </>
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
                <a
                  href={`/commune/${communeid}/post/${post.post_id}`}
                  className="mt-4 inline-block text-blue-600 hover:underline font-medium"
                >
                  Read more
                </a>
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

      {/* Collaboration Popup */}
      {showCollaboration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-3/4 max-h-96 overflow-y-auto relative">
            <button
              onClick={closeCollaborationPopup}
              className="absolute top-3 right-3 bg-red-500 text-white px-4 py-2 rounded-full text-sm hover:bg-red-600 transition duration-200"
            >
              Close
            </button>
            <h2 className="text-xl font-bold mb-4">
              Collaborate this post with your communes
            </h2>
            {userCommunes.length > 0 ? (
              <ul className="space-y-4">
                {userCommunes.map((commune) => (
                  <li
                    key={commune.commune_id}
                    className="flex justify-between space-x-4 shadow p-2 rounded"
                  >
                    <div className="space-y-2">
                      <div className="flex space-x-4">
                        <img
                          src={commune.commune_image || "/default-commune.png"}
                          alt={commune.commune_name}
                          className="w-10 h-10 rounded-full"
                        />
                        <p className="text-lg font-medium">
                          {commune.commune_name} ({commune.role})
                        </p>
                      </div>
                      <h2>{commune.description}</h2>
                    </div>
                    <div className="flex space-x-4">
                      <button
                        onClick={() =>
                          makeCollaboration(commune.commune_id, selectedPostId)
                        }
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                      >
                        Collaborate
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No communes found.</p>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
};

export default CommunePostsPage;
