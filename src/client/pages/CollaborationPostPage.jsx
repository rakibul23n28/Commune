import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
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
      const response = await axios.get(
        `/api/commune/collaboration/${communeid}/posts`
      );
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
          `/api/commune/collaboration/${postId}`,
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        );
        alert(response.data.message);
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
                      <p className="text-lg font-medium text-gray-800">
                        {post.username}
                      </p>
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
                          className=" w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center"
                        >
                          <i className="fas fa-link mr-2"></i> Copy Link
                        </button>
                        {(getRole(communeid) === "admin" ||
                          getRole(communeid) === "moderator") && (
                          <button
                            onClick={() =>
                              handleDeleteCollaboration(post.post_id)
                            }
                            className=" w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center"
                          >
                            <i className="fas fa-trash mr-2"></i>
                            Collaboration
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                  {post.title}
                </h3>
                <div
                  className="text-gray-700 overflow-hidden max-h-96 overflow-ellipsis"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                ></div>
                <a
                  href={`/commune/${communeid}/post/${post.post_id}`}
                  className="mt-4 inline-block text-blue-600 hover:underline font-medium"
                >
                  Read more
                </a>
              </div>
            ))}
        </div>
      </div>
    </Layout>
  );
};

export default CollaborationPostPage;
