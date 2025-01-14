import React, { useState, useEffect } from "react";
import axios from "axios";
import Layout from "../components/Layout";
import { Link } from "react-router-dom";
import { getAuthHeaders } from "../utils/Helper.js";
import { useAuth } from "../context/AuthContext.jsx"; // Assuming you have this context for authentication

const UserCommunes = () => {
  const [communes, setCommunes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { user } = useAuth(); // Fetch the current user from your context

  useEffect(() => {
    const fetchJoinedCommunes = async () => {
      try {
        const response = await axios.get(`/api/commune/joined/${user.id}`, {
          headers: getAuthHeaders(),
        });
        setCommunes(response.data.data); // Assuming the response has a "data" field with communes
      } catch (err) {
        console.error("Error fetching user communes:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchJoinedCommunes();
  }, [user]);

  // Render loading state
  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-screen">
          <p className="text-lg text-gray-600">Loading communes...</p>
        </div>
      </Layout>
    );
  }

  // Render error state
  if (error) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-screen">
          <p className="text-lg text-red-600">{error}</p>
        </div>
      </Layout>
    );
  }

  // Function to sort communes by role (Admin > Moderator > Member)
  const roleOrder = {
    admin: 1,
    moderator: 2,
    member: 3,
  };

  const sortedCommunes = communes.sort((a, b) => {
    return roleOrder[a.role.toLowerCase()] - roleOrder[b.role.toLowerCase()];
  });

  return (
    <Layout>
      <div className="w-1/2 mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="w-full p-6">
          <h1 className="text-2xl font-bold mb-4">
            {user.username}'s Joined Communes
          </h1>
          <div className="space-y-6">
            {sortedCommunes.length > 0 ? (
              sortedCommunes.map((commune) => (
                <div
                  key={commune.commune_id}
                  className="border p-4 rounded-lg shadow-md hover:shadow-lg transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <img
                        src={
                          commune.commune_image ||
                          "/uploads/default-commune.jpg"
                        }
                        alt={commune.name}
                        className="w-16 h-16 object-cover rounded-full"
                      />
                      <h3 className="text-xl font-semibold">
                        <Link
                          to={`/commune/${commune.commune_id}`}
                          className="hover:underline text-blue-600"
                        >
                          {commune.name}
                        </Link>
                      </h3>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm">{commune.description}</p>
                  <div className="mt-4 text-sm text-gray-500">
                    <p>
                      <strong>Role:</strong>{" "}
                      <span
                        className={`${
                          commune.role === "admin"
                            ? "text-red-500"
                            : commune.role === "moderator"
                            ? "text-yellow-500"
                            : "text-green-500"
                        }`}
                      >
                        {commune.role.charAt(0).toUpperCase() +
                          commune.role.slice(1)}
                      </span>
                    </p>
                    <p>
                      <strong>Privacy:</strong> {commune.privacy}
                    </p>
                    <p>
                      <strong>Location:</strong> {commune.location}
                    </p>
                    <p>
                      <strong>Type:</strong> {commune.commune_type}
                    </p>
                    <p>
                      <strong>Created At:</strong>{" "}
                      {new Date(commune.created_at).toLocaleDateString()}
                    </p>
                    <div className="mt-2">
                      <Link
                        to={`/commune/${commune.commune_id}`}
                        className="text-blue-500 hover:underline"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-600">
                You have not joined any communes.
              </p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default UserCommunes;
