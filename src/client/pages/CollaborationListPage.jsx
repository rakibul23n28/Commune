import React, { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";
import CommuneNavbar from "../components/CommuneNavbar";
import CommuneFixedNav from "../components/CommuneFixedNav";
import { useParams, Link } from "react-router-dom";
import { getAuthHeaders } from "../utils/Helper";
import { useCommuneMembership } from "../context/CommuneMembershipContext";
import { useAuth } from "../context/AuthContext";
import { timeAgo } from "../utils/Helper";

const CollaborationListPage = () => {
  const { communeid } = useParams();
  const { user } = useAuth();
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { getRole, communeData, fetchCommuneData } = useCommuneMembership();
  const [commune, setCommune] = useState(null);
  const [showOptions, setShowOptions] = useState({});
  const [showComments, setShowComments] = useState(null);
  const [commentInput, setCommentInput] = useState("");

  // New state to track comments for each post
  const [newComments, setNewComments] = useState({});

  useEffect(() => {
    const loadCommuneData = async () => {
      try {
        if (!communeData) {
          await fetchCommuneData(communeid);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load commune data");
      }
    };
    loadCommuneData();
  }, [communeid, communeData]);

  useEffect(() => {
    if (communeData) {
      setCommune(communeData);
    }
  }, [communeData]);

  // Helper to transform rows
  const transformRows = (columns, rawRows) => {
    if (!columns || !rawRows) return [];
    const keys = columns.map((col) => col.attribute_name);
    const rowValues = keys.map((key) =>
      (rawRows.find((row) => row[key]) || {})[key]
        ?.split(",")
        .map((val) => val.trim())
    );

    // Transpose rows
    return rowValues[0]?.map((_, index) =>
      keys.reduce((acc, key, colIdx) => {
        acc[key] = rowValues[colIdx][index] || "-";
        return acc;
      }, {})
    );
  };

  useEffect(() => {
    const fetchLists = async () => {
      setLoading(true);

      try {
        const response = await axios.get(
          `/api/collaboration/${communeid}/lists`
        );

        const transformedLists = response.data.map((list) => ({
          ...list,
          rows: transformRows(list.columns, list.rows),
        }));

        setLists(transformedLists);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch lists.");
      } finally {
        setLoading(false);
      }
    };
    fetchLists();
  }, [communeid]);

  const handleOptionsClick = (listId) => {
    setShowOptions((prev) => (prev === listId ? null : listId)); // Toggle visibility of options
  };

  const handleEdit = (listId) => {
    location.href = `/commune/edit/${communeid}/${listId}/list`;
  };

  const handleDeleteCollaboration = async (listId) => {
    if (window.confirm("Are you sure you want to delete this collaboration?")) {
      try {
        const response = await axios.delete(
          `/api/collaboration/${listId}/post`,
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        );
        setLists((prevLists) =>
          prevLists.filter((list) => list.metaData.post_id !== listId)
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

  const handleReaction = async (listId, type) => {
    // Find the target list
    const targetList = lists.find((list) => list.metaData.post_id === listId);

    if (!targetList) {
      alert("List not found.");
      return;
    }

    const userReaction = targetList.metaData.userReaction;

    if (userReaction === type) {
      alert(`You have already ${type}d this post.`);
      return; // Prevent the user from reacting again
    }

    try {
      // Send reaction to the server
      const response = await axios.post(
        `/api/post/${listId}/reactions`,
        { reaction_type: type },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      const updatedReactionCount = response.data.reaction_count;

      // Update the list's reaction data
      setLists((prevLists) =>
        prevLists.map((list) =>
          list.metaData.post_id === listId
            ? {
                ...list,
                metaData: {
                  ...list.metaData,
                  userReaction: type, // Update user reaction
                  likes: response.data.reaction_count.like,

                  hates: response.data.reaction_count.hate,
                },
              }
            : list
        )
      );
    } catch (error) {
      console.error("Error handling reaction:", error);
      alert("Failed to react. Please try again.");
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
  const handleAddComment = async (listId) => {
    const content = commentInput.trim();

    if (!content) {
      alert("Comment cannot be empty.");
      return;
    }

    try {
      const response = await axios.post(
        `/api/post/${listId}/comments`,
        { content },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      const newComment = response.data.comment;

      setNewComments((prev) => ({
        ...prev,
        [listId]: [...(prev[listId] || []), newComment],
      }));

      // Update the specific list with the new comment
      setLists((prevLists) =>
        prevLists.map((list) =>
          list.metaData.post_id === listId
            ? {
                ...list,
                metaData: {
                  ...list.metaData,
                  comments: list.metaData.comments + 1, // Increment comment count
                },
              }
            : list
        )
      );

      // Clear the comment input field
      setCommentInput("");

      alert("Comment added!");
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("Failed to add comment. Please try again.");
    }
  };

  const handleCopyLink = (postId) => {
    const link = `${window.location.origin}/commune/${communeid}/list/${postId}`;
    navigator.clipboard.writeText(link);
    alert("Post link copied to clipboard!");
  };

  if (loading) {
    return (
      <Layout>
        <CommuneFixedNav />
        <CommuneNavbar name={`${communeData?.name}`} />
        <div className="w-full text-center py-20 text-gray-500">Loading...</div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <CommuneFixedNav />
        <CommuneNavbar name={`${communeData?.name}`} />
        <div className="w-full text-center py-20 text-red-500">{error}</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <CommuneFixedNav />
      <CommuneNavbar name={`${communeData?.name}`} />
      <div className="w-10/12 mx-auto p-6 bg-white rounded-lg shadow-md mt-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">
          Lists for Commune {communeid}
        </h1>
        {lists.length === 0 ? (
          <p className="text-center text-gray-500">No lists available.</p>
        ) : (
          lists.map((list, index) => (
            <div
              key={index}
              className="mb-8 p-6 bg-gray-50 rounded-lg shadow-lg border"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex ">
                  <img
                    src={list.metaData.profile_image}
                    alt="User Avatar"
                    className="w-10 h-10 rounded-full mr-4"
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700">
                      {list.metaData.username}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {timeAgo(list.metaData.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex relative">
                  <button
                    onClick={() => handleOptionsClick(list.metaData.post_id)}
                    className="text-gray-600 hover:text-gray-800 p-2"
                  >
                    <i className="fas fa-ellipsis-v"></i>
                  </button>
                  {showOptions === list.metaData.post_id && (
                    <div className="absolute right-0 mt-10 w-48 bg-white border rounded-lg shadow-lg z-1">
                      <button
                        onClick={() => handleCopyLink(list.metaData.post_id)}
                        className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <i className="fas fa-link mr-2"></i> Copy Link
                      </button>
                      {(getRole(communeid) === "admin" ||
                        getRole(communeid) === "moderator") && (
                        <>
                          <button
                            onClick={() => handleEdit(list.metaData.post_id)}
                            className="block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteCollaboration(list.metaData.post_id)
                            }
                            className="block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100"
                          >
                            <i className="fas fa-trash mr-2"></i> Collaboration
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-between">
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                  <Link
                    to={`/commune/${communeid}/list/${list.metaData.post_id}`}
                    className="hover:underline text-blue-500"
                  >
                    {list.metaData.title}
                  </Link>
                </h2>
              </div>
              <p className="text-gray-600 mb-4 break-words">
                {list.metaData.description}
              </p>

              <div className="overflow-x-auto mt-6">
                <table className="min-w-full border-collapse border border-gray-300">
                  <thead>
                    <tr>
                      {list.columns.map((column, idx) => (
                        <th
                          key={idx}
                          className="border px-4 py-2 bg-gray-100 text-gray-600"
                        >
                          {column.attribute_name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {list.rows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={list.columns.length}
                          className="border px-4 py-2 text-center text-gray-500"
                        >
                          No data available.
                        </td>
                      </tr>
                    ) : (
                      list.rows.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {list.columns.map((column, colIndex) => (
                            <td key={colIndex} className="border px-4 py-2">
                              {column.attribute_type === "link" ? (
                                row[column.attribute_name] ? (
                                  <a
                                    href={row[column.attribute_name]}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:underline"
                                  >
                                    {row[column.attribute_name]}
                                  </a>
                                ) : (
                                  "-"
                                )
                              ) : (
                                row[column.attribute_name] || "-"
                              )}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                <div className="flex justify-between w-full space-x-4 mt-4">
                  <div className="flex space-x-2">
                    <button
                      onClick={() =>
                        handleReaction(list.metaData.post_id, "like")
                      }
                      className="text-green-600"
                    >
                      👍 {list.metaData.likes || 0}
                    </button>
                    <button
                      onClick={() =>
                        handleReaction(list.metaData.post_id, "hate")
                      }
                      className="text-red-600"
                    >
                      👎 {list.metaData.hates || 0}
                    </button>
                  </div>
                  <div className="flex space-x-2 relative">
                    <button
                      onClick={() =>
                        handleToggleComments(list.metaData.post_id)
                      }
                      className="text-gray-600"
                    >
                      💬 {list.metaData.comments || 0}
                    </button>
                    {showComments === list.metaData.post_id && (
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
                            {Array.isArray(
                              newComments[list.metaData.post_id]
                            ) &&
                              newComments[list.metaData.post_id]?.map(
                                (comment) => (
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
                                        <Link
                                          to={`/profile/${comment.username}`}
                                        >
                                          <strong className="font-semibold text-blue-500">
                                            {comment.username}
                                          </strong>
                                        </Link>
                                      </p>
                                    </div>
                                  </div>
                                )
                              )}
                          </div>
                          {/* Comment input field */}
                          <textarea
                            value={commentInput}
                            onChange={(e) => setCommentInput(e.target.value)}
                            className="w-full mt-2 border rounded p-2"
                            placeholder="Add a comment..."
                          ></textarea>
                          <button
                            onClick={() =>
                              handleAddComment(list.metaData.post_id)
                            }
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
            </div>
          ))
        )}
      </div>
    </Layout>
  );
};

export default CollaborationListPage;
