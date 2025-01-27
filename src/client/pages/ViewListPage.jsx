import React, { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";
import CommuneNavbar from "../components/CommuneNavbar";
import CommuneFixedNav from "../components/CommuneFixedNav";
import { useParams, Link } from "react-router-dom";
import { getAuthHeaders, timeAgo } from "../utils/Helper";
import { useCommuneMembership } from "../context/CommuneMembershipContext";

const ViewListPage = () => {
  const { communeid, listid } = useParams(); // Capture communeid and listid from URL params
  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [commentInput, setCommentInput] = useState("");
  const [showComments, setShowComments] = useState(null);
  const [newComments, setNewComments] = useState({});
  const { getRole, communeData } = useCommuneMembership();

  const transformRows = (columns, rawRows) => {
    if (!columns || !rawRows) return [];
    const keys = columns.map((col) => col.attribute_name);
    const rowValues = keys.map((key) =>
      (rawRows.find((row) => row[key]) || {})[key]
        ?.split(",")
        .map((val) => val.trim())
    );
    return rowValues[0]?.map((_, index) =>
      keys.reduce((acc, key, colIdx) => {
        acc[key] = rowValues[colIdx][index] || "-";
        return acc;
      }, {})
    );
  };

  useEffect(() => {
    const fetchList = async () => {
      try {
        const response = await axios.get(`/api/commune/list/${listid}`, {
          headers: getAuthHeaders(),
        });
        const transformedList = {
          ...response.data,
          rows: transformRows(response.data.columns, response.data.rows),
        };
        setList(transformedList);
      } catch (err) {
        setError("Failed to fetch the list.");
      } finally {
        setLoading(false);
      }
    };

    fetchList();
  }, [communeid, listid]);

  const handleReaction = async (type) => {
    if (list.metaData.userReaction === type) {
      alert(`You have already ${type}d this post.`);
      return;
    }

    try {
      const response = await axios.post(
        `/api/post/${list.metaData.post_id}/reactions`,
        { reaction_type: type },
        { headers: getAuthHeaders() }
      );

      const { like, hate } = response.data.reaction_count;

      console.log(response.data);

      setList((prevList) => ({
        ...prevList,
        metaData: {
          ...prevList.metaData,
          userReaction: type,
          likes: like,
          hates: hate,
        },
      }));
    } catch (err) {
      console.error("Error handling reaction:", err);
      alert("Failed to react. Please try again.");
    }
  };

  const fetchComments = async () => {
    try {
      const response = await axios.get(
        `/api/post/${list.metaData.post_id}/comments`
      );
      setNewComments((prev) => ({
        ...prev,
        [list.metaData.post_id]: response.data.comments || [],
      }));
    } catch (err) {
      console.error("Error fetching comments:", err);
    }
  };

  const handleToggleComments = () => {
    if (showComments) {
      setShowComments(null);
    } else {
      setShowComments(list.metaData.post_id);
      fetchComments();
    }
  };

  const handleAddComment = async () => {
    const content = commentInput.trim();

    if (!content) {
      alert("Comment cannot be empty.");
      return;
    }

    try {
      const response = await axios.post(
        `/api/post/${list.metaData.post_id}/comments`,
        { content },
        { headers: getAuthHeaders() }
      );

      const newComment = response.data.comment;

      setNewComments((prev) => ({
        ...prev,
        [list.metaData.post_id]: [
          ...(prev[list.metaData.post_id] || []),
          newComment,
        ],
      }));

      setList((prevList) => ({
        ...prevList,
        metaData: {
          ...prevList.metaData,
          comments: prevList.metaData.comments + 1,
        },
      }));

      setCommentInput("");
      alert("Comment added!");
    } catch (err) {
      console.error("Error adding comment:", err);
      alert("Failed to add comment. Please try again.");
    }
  };

  if (loading) {
    return (
      <Layout>
        <CommuneFixedNav />
        <CommuneNavbar name={communeData?.name} />
        <div className="w-full text-center py-20 text-gray-500">Loading...</div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <CommuneFixedNav />
        <CommuneNavbar name={communeData?.name} />
        <div className="w-full text-center py-20 text-red-500">{error}</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <CommuneFixedNav />
      <CommuneNavbar name={communeData?.name} />
      <div className="w-8/12 mx-auto p-6 bg-white rounded-lg shadow-md mt-8">
        <div className="flex items-center mb-4">
          <img
            src={list.metaData.profile_image || "/default-avatar.png"}
            alt="User avatar"
            className="w-12 h-12 rounded-full border mr-4"
          />
          <div>
            <Link
              to={`/profile/${list.metaData.username}`}
              className="text-lg font-medium text-gray-800"
            >
              {list.metaData.username}
            </Link>
            <p className="text-sm text-gray-500">
              {timeAgo(list.metaData.created_at)} ago
            </p>
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-800 mb-8">
          {list.metaData.title}
        </h1>
        <p className="text-gray-600 mb-4">{list.metaData.description}</p>

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
        </div>
        <div className="flex justify-between mt-4">
          <div className="flex space-x-2">
            <button
              onClick={() => handleReaction("like")}
              className="text-green-600"
            >
              👍 {list.metaData.likes || 0}
            </button>
            <button
              onClick={() => handleReaction("hate")}
              className="text-red-600"
            >
              👎 {list.metaData.hates || 0}
            </button>
          </div>
          <div className="flex space-x-2 relative">
            <button onClick={handleToggleComments} className="text-gray-600">
              💬 {list.metaData.comments || 0}
            </button>
            {showComments && (
              <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white border rounded-lg shadow-lg p-4">
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
                    {newComments[list.metaData.post_id]?.map((comment) => (
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
                            by{" "}
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
      </div>
    </Layout>
  );
};

export default ViewListPage;
