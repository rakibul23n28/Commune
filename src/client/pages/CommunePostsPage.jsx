import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
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
        `/api/commune/collaboration/post`,
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
                  {/* Three dot options */}
                  {(getRole(communeid) === "admin" ||
                    user.id === post.user_id) && (
                    <div className="flex">
                      <button
                        onClick={() => handleCollaborationClick(post.post_id)}
                        className="text-green-500 hover:text-green-700 p-2"
                      >
                        Collaboration
                      </button>
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
                          </div>
                        )}
                      </div>
                    </div>
                  )}
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
