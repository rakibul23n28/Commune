import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom"; // Import Link for navigation
import axios from "axios";
import Layout from "../components/Layout";
import { getAuthHeaders } from "../utils/Helper.js";

const AllCommunes = () => {
  const [communes, setCommunes] = useState([]); // List of all communes
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState(null); // Error state

  // Fetch all communes
  useEffect(() => {
    const fetchAllCommunes = async () => {
      try {
        const response = await axios.get("/api/commune/all", {
          headers: getAuthHeaders(),
        });
        setCommunes(response.data.communes);
      } catch (err) {
        setError("Failed to load communes.");
        console.error("Error fetching communes:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllCommunes();
  }, []);

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

  return (
    <Layout>
      <div className="flex justify-center mt-8">
        <div className="w-full p-6">
          <h1 className="text-2xl font-bold mb-4">All Communes</h1>
          <div className="space-y-6">
            {communes.length > 0 ? (
              communes.map((commune) => (
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
                No communes available.
              </p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AllCommunes;
