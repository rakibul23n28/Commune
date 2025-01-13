import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import axios from "axios";
import { Link, useParams } from "react-router-dom";

import { getAuthHeaders, timeAgo } from "../utils/Helper.js";

const Profile = () => {
  const { username } = useParams(); // Get the user ID from URL params
  const [user, setUser] = useState(null); // User profile data
  const [communes, setCommunes] = useState([]); // User's communes
  const [expandedCommuneId, setExpandedCommuneId] = useState(null); // To toggle commune content expansion

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await axios.get(`/api/user/profile/${username}`, {
          headers: getAuthHeaders(),
        });
        setUser(response.data.user);
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
        alert("User does not exist or cannot be fetched.");
      }
    };

    const fetchUserCommunes = async () => {
      try {
        const response = await axios.get(`/api/commune/${username}`, {
          headers: getAuthHeaders(),
        });
        setCommunes(response.data.communes);
      } catch (err) {
        console.error("Failed to fetch communes:", err);
      }
    };

    fetchUserProfile();
    fetchUserCommunes();
  }, [username]);

  // Function to handle commune deletion
  const handleDelete = async (commune_id) => {
    const isConfirmed = window.confirm(
      "Are you sure you want to delete this commune? There is no undo no history."
    );
    if (!isConfirmed) return; // If user cancels, do nothing

    try {
      const response = await axios.delete(`/api/commune/delete/${commune_id}`, {
        headers: getAuthHeaders(),
      });
      if (response.data.success) {
        setCommunes((prevCommunes) =>
          prevCommunes.filter((commune) => commune.commune_id !== commune_id)
        );
        alert("Commune deleted successfully!");
      }
    } catch (err) {
      console.error("Failed to delete commune:", err);
      alert("Failed to delete commune.");
    }
  };

  // Toggle the expansion of the notes
  const toggleCommuneExpansion = (noteId) => {
    setExpandedCommuneId((prevId) => (prevId === noteId ? null : noteId));
  };

  // Render if user data is not available
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-lg text-gray-600">User does not exist.</p>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="flex justify-center mt-8">
        <div className="w-full p-6 relative">
          <div className="space-y-6 flex w-full items-center justify-center">
            {/* Profile Picture and Bio Section */}
            <div>
              <div className="flex flex-col items-center justify-center space-x-6">
                <div className="flex flex-col items-center">
                  <div className="rounded-full bg-blue-100 h-36 w-36 flex items-center justify-center text-blue-500 font-bold text-lg">
                    <img
                      src={user.profile_image}
                      alt={`${user.first_name} ${user.last_name}`}
                      className="rounded-full w-full h-full object-cover"
                    />
                  </div>
                  <h1 className="text-2xl font-bold">{`${user.first_name} ${user.last_name}`}</h1>
                  {user.is_verified ? (
                    <span className="text-green-500 font-semibold">
                      Verified
                    </span>
                  ) : (
                    <span className="text-red-500 font-semibold">
                      Unverified
                    </span>
                  )}
                </div>
              </div>
              <div className="space-y-4 mt-6 flex flex-col items-center">
                <div>
                  <span className="font-semibold">Username:</span>{" "}
                  {user.username}
                </div>
                <div>
                  <span className="font-semibold">Email:</span> {user.email}
                </div>

                {user.created_at && (
                  <div>
                    <span className="font-semibold">Joined:</span>{" "}
                    {new Date(user.created_at).toLocaleDateString()}
                  </div>
                )}
                <div className="mt-4">
                  <Link to="/editprofile">
                    <button className="px-4 py-2 bg-blue-500 text-white rounded-lg">
                      <i className="fas fa-pen mr-2"></i> Edit
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* User's Communes Section */}
          <div className="mt-8 mb-20">
            <h2 className="text-xl font-semibold mb-4">Communes</h2>
            <div className="flex flex-col items-center">
              {communes.length > 0 ? (
                communes.map((commune) => (
                  <div
                    key={commune.commune_id}
                    className={`border p-4 rounded-lg shadow-md transition-all duration-300 w-full max-w-lg my-8 ${
                      expandedCommuneId === commune.commune_id
                        ? "h-auto"
                        : "h-52"
                    }`}
                    onDoubleClick={() =>
                      toggleCommuneExpansion(commune.commune_id)
                    }
                    style={{ cursor: "pointer" }}
                  >
                    <div className="flex flex-col mb-6">
                      {/* Commune Image and Name */}
                      <div className="flex items-center justify-between">
                        <img
                          src={`${commune.commune_image}`}
                          alt={commune.name}
                          className="w-12 h-12 object-cover rounded-full"
                        />
                        <div className="flex items-center justify-center space-x-6">
                          <Link to={`/editcommune/${commune.commune_id}`}>
                            <button className="text-green-500 text-sm hover:underline">
                              Edit
                            </button>
                          </Link>
                          <Link to={`/managecommune/${commune.commune_id}`}>
                            <button className="text-green-500 text-sm hover:underline">
                              Manage
                            </button>
                          </Link>
                          <button
                            onClick={() => handleDelete(commune.commune_id)}
                            className="text-red-500 text-sm hover:underline"
                          >
                            Delete
                          </button>
                          <Link to={`/commune/${commune.commune_id}`}>
                            <button className="text-blue-500 text-sm hover:underline">
                              View
                            </button>
                          </Link>
                          <span
                            className={`status-label ${
                              commune.privacy === "public"
                                ? "text-green-500"
                                : "text-yellow-500"
                            }`}
                          >
                            {commune.privacy.charAt(0).toUpperCase() +
                              commune.privacy.slice(1)}
                          </span>
                        </div>
                      </div>

                      {/* Commune meta information */}
                      <div className="flex items-center justify-between  overflow-hidden">
                        <div className="w-full pr-4">
                          <h3 className="font-semibold text-lg truncate">
                            {commune.name}
                          </h3>
                          <p className="text-gray-500 text-xs">
                            {timeAgo(commune.created_at)} by{" "}
                            {user.username || "Admin"}
                          </p>
                          <p className="text-gray-600 text-sm truncate">
                            {commune.description ?? "No description provided."}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Commune description */}
                    <div className="bg-gray-100 rounded-lg p-4">
                      <div
                        className={`commune-description text-sm text-gray-800 transition-all duration-300 whitespace-pre-wrap break-words ${
                          expandedCommuneId === commune.commune_id
                            ? "line-clamp-none"
                            : "line-clamp-5"
                        }`}
                        dangerouslySetInnerHTML={{
                          __html: commune.content,
                        }}
                      ></div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-600 mt-4">
                  No communes found.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
