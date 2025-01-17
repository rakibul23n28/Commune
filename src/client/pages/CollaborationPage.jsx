import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Layout from "../components/Layout";
import CommuneNavbar from "../components/CommuneNavbar";
import CommuneFixedNav from "../components/CommuneFixedNav";
import { useAuth } from "../context/AuthContext";

const CollaborationPage = () => {
  const { communeid } = useParams();
  const { user } = useAuth(); // Auth context for the current logged-in user
  const [posts, setPosts] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [userCommunes, setUserCommunes] = useState([]);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [showCollaboration, setShowCollaboration] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axios.get(
          `/api/commune/collaboration/${communeid}/posts`
        );
        setPosts(response.data.posts);
        console.log(response.data.posts, "llllll");
      } catch (error) {
        if (error.response.data.message) {
          setErrorMessage(error.response.data.message);
        } else {
          setErrorMessage("Error fetching posts.");
        }
      } finally {
        setLoading(false);
      }
    };

    // const fetchUserCommunes = async () => {
    //   try {
    //     const response = await axios.get(`/api/user/communes/${user.id}`);
    //     setUserCommunes(response.data.communes);
    //   } catch (error) {
    //     setErrorMessage("Error fetching your communes.");
    //   }
    // };

    fetchPosts();
  }, [communeid, user.id]);

  const handleCollaborationClick = (postId) => {
    setSelectedPostId(postId);
    setShowCollaboration(true);
  };

  const closeCollaborationPopup = () => {
    setShowCollaboration(false);
  };

  const makeCollaboration = async (commune_id_2) => {
    try {
      const response = await axios.post(
        `/api/commune/collaboration`,
        {
          commune_id_1: communeid, // Current commune ID
          commune_id_2, // Selected commune ID for collaboration
          post_id: selectedPostId, // Post ID being collaborated on
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      alert(response.data.message);
      setShowCollaboration(false); // Close the popup after collaboration is made
    } catch (error) {
      setErrorMessage("Failed to create collaboration.");
      console.error("Error creating collaboration:", error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Layout>
      <CommuneFixedNav />
      <CommuneNavbar name="Collaboration Page" />
      <div className="w-1/2 mx-auto p-6 mt-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-3xl font-extrabold mb-6 text-gray-800">
          Select a Post to Collaborate
        </h2>
        {errorMessage && (
          <div className="text-red-600 mb-4 font-medium">{errorMessage}</div>
        )}

        <div className="space-y-6">
          {posts.length > 0 ? (
            posts.map((post) => (
              <div
                key={post.post_id}
                className="bg-gray-50 p-6 border rounded-lg shadow-sm"
              >
                <h3 className="text-xl font-semibold text-gray-800">
                  {post.title}
                </h3>
                <p className="text-gray-700 mt-2">{post.content}</p>
                <button
                  onClick={() => handleCollaborationClick(post.post_id)}
                  className="bg-blue-500 text-white px-4 py-2 rounded mt-4"
                >
                  Start Collaboration
                </button>
              </div>
            ))
          ) : (
            <></>
          )}
        </div>
      </div>

      {/* Collaboration Popup */}
      {showCollaboration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-3/4 max-h-96 overflow-y-auto relative">
            <button
              onClick={closeCollaborationPopup}
              className="absolute top-3 right-3 bg-red-500 text-white px-4 py-2 rounded-full text-sm"
            >
              Close
            </button>
            <h2 className="text-xl font-bold mb-4">
              Collaborate on this post with your communes
            </h2>
            {userCommunes.length > 0 ? (
              <ul className="space-y-4">
                {userCommunes.map((commune) => (
                  <li key={commune.commune_id} className="flex justify-between">
                    <div>
                      <p className="text-lg font-medium">
                        {commune.commune_name}
                      </p>
                    </div>
                    <button
                      onClick={() => makeCollaboration(commune.commune_id)}
                      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                      Collaborate
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No communes found for collaboration.</p>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
};

export default CollaborationPage;
