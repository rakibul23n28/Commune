import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import Layout from "../components/Layout";
import CommuneNavbar from "../components/CommuneNavbar";
import CommuneFixedNav from "../components/CommuneFixedNav";
import { timeAgo } from "../utils/Helper";
import { useCommuneMembership } from "../context/CommuneMembershipContext";
import { useAuth } from "../context/AuthContext";

const ViewPostPage = () => {
  const { communeid, postid } = useParams();
  const { user } = useAuth();
  const { getRole, communeData } = useCommuneMembership();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [showComments, setShowComments] = useState(false); // Toggle for showing comments modal
  const [commentInput, setCommentInput] = useState("");
  const [newComments, setNewComments] = useState([]); // Default to an empty array

  const handleReaction = async (postId, type) => {
    if (post?.userReaction === type) {
      alert(`You have already ${type}d this post.`);
      return; // Prevent duplicate reactions
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

      // Update the reaction counts and user's reaction
      setPost((prevPost) => ({
        ...prevPost,
        userReaction: type, // Store the user's reaction
        likes: response.data.reaction_count.like,
        hates: response.data.reaction_count.hate,
      }));
    } catch (error) {
      console.error("Error handling reaction:", error);
      alert("Failed to react. Please try again.");
    }
  };

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await axios.get(`/api/commune/post/${postid}`);

        setPost(response.data.post);
        setNewComments(response.data.post.comments); // Initial comments load
      } catch (error) {
        setErrorMessage("Failed to fetch the post. Please try again later.");
        console.error("Error fetching post:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [communeid, postid]);

  const handleToggleComments = () => {
    setShowComments((prev) => !prev); // Toggle the comment section visibility
    if (!showComments) fetchComments(); // Fetch comments only when opening the section
  };

  const fetchComments = async () => {
    try {
      const response = await axios.get(`/api/post/${postid}/comments`);
      // Check if the response data is in the expected format (array)
      if (Array.isArray(response.data.comments)) {
        setNewComments(response.data.comments);
      } else {
        console.error("Unexpected comments data format:", response.data);
        setNewComments([]); // Set an empty array if the data format is incorrect
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
      setNewComments([]); // Set an empty array in case of error
    }
  };

  const handleAddComment = async () => {
    if (!commentInput.trim()) {
      alert("Comment cannot be empty.");
      return;
    }

    try {
      const response = await axios.post(
        `/api/post/${postid}/comments`,
        { content: commentInput },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      const newComment = response.data.comment;
      setNewComments((prevComments) => [...prevComments, newComment]);
      setCommentInput(""); // Clear input after adding comment
      alert("Comment added!");
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("Failed to add comment. Please try again.");
    }
  };

  if (loading) {
    return <div className="text-center py-10">Loading post...</div>;
  }

  if (errorMessage) {
    return (
      <Layout>
        <CommuneFixedNav />
        <CommuneNavbar name={communeData?.name || "Commune"} />
        <div className="text-center py-10 text-red-600">{errorMessage}</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <CommuneFixedNav />
      <CommuneNavbar name={communeData?.name || "Commune"} />
      <div className="w-1/2 mx-auto p-6 mt-6 bg-white rounded-lg shadow-lg">
        <h1 className="text-3xl font-extrabold mb-4 text-gray-800">
          {post.title}
        </h1>
        <div className="flex items-center mb-4">
          <img
            src={post.profile_image || "/default-avatar.png"}
            alt="User avatar"
            className="w-12 h-12 rounded-full border mr-4"
          />
          <div>
            <Link
              to={`/profile/${post.username}`}
              className="text-lg font-medium text-gray-800"
            >
              {post.username}
            </Link>
            <p className="text-sm text-gray-500">
              {timeAgo(post.created_at)} ago
            </p>
          </div>
        </div>
        <div
          className="prose max-w-none mb-6 break-words"
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
            <button onClick={handleToggleComments} className="text-gray-600">
              💬 {post.comments || 0}
            </button>
            {showComments && (
              <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50">
                {/* Comments modal */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white border rounded-lg shadow-lg p-4 z-60">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-bold">Comments</h4>
                    <button
                      onClick={() => setShowComments(false)}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      ✖
                    </button>
                  </div>
                  <div className="space-y-2 mt-2 max-h-96 overflow-y-auto">
                    {Array.isArray(newComments) && newComments.length > 0 ? (
                      newComments.map((comment) => (
                        <div
                          key={comment.comment_id}
                          className="border-b pb-2 flex items-start space-x-4"
                        >
                          <img
                            src={comment.profile_image || "/default-avatar.png"}
                            alt={`${comment.username}'s avatar`}
                            className="w-10 h-10 rounded-full"
                          />
                          <div className="flex-1">
                            <p className="text-gray-800">{comment.content}</p>
                            <p className="text-sm text-gray-500">
                              {timeAgo(comment.created_at)} by{" "}
                              <strong className="font-semibold text-blue-500">
                                {comment.username}
                              </strong>
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p>No comments yet.</p>
                    )}
                  </div>
                  <textarea
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    className="w-full mt-2 border rounded p-2"
                    placeholder="Add a comment..."
                  ></textarea>
                  <button
                    onClick={handleAddComment}
                    className="mt-2 bg-blue-500 text-white px-4 py-2 rounded"
                  >
                    Comment
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Edit and Delete buttons for Admin or Post Owner */}
        {getRole(communeid) === "admin" || user.id === post.user_id ? (
          <div className="mt-4">
            <Link
              to={`/commune/edit/${communeid}/${postid}/post`}
              className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 mr-2"
            >
              Edit Post
            </Link>
            <button
              onClick={() => {
                if (
                  window.confirm("Are you sure you want to delete this post?")
                ) {
                  axios
                    .delete(`/api/commune/post/${postid}`)
                    .then(() => {
                      alert("Post deleted successfully.");
                      location.href = `/commune/${communeid}/posts`;
                    })
                    .catch((error) => {
                      console.error("Error deleting post:", error);
                    });
                }
              }}
              className="bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600"
            >
              Delete Post
            </button>
          </div>
        ) : null}
      </div>
    </Layout>
  );
};

export default ViewPostPage;
