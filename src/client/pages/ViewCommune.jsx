import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import CommuneNavbar from "../components/CommuneNavbar";
import axios from "axios";

const ViewCommune = () => {
  const { communeid } = useParams(); // Get the commune ID from the URL
  const navigate = useNavigate();
  const [commune, setCommune] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCommune = async () => {
      try {
        const response = await axios.get(`/api/commune/communes/${communeid}`);
        setCommune(response.data.communes);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load commune data");
      } finally {
        setLoading(false);
      }
    };

    fetchCommune();
  }, [communeid]);

  if (loading) {
    return (
      <Layout>
        <div className="w-full flex justify-center items-center h-96">
          <p>Loading...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="w-full flex justify-center items-center h-96">
          <p className="text-red-500">{error}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <CommuneNavbar name={commune.name} />
      <div className="w-full flex justify-center py-10">
        <div className="max-w-6xl w-full bg-white shadow-xl rounded-lg overflow-hidden grid grid-cols-3 gap-6">
          {/* Left Column: Commune Content */}
          <div className="col-span-2 p-6 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg shadow-md">
            {commune.commune_image && (
              <img
                src={commune.commune_image}
                alt={`${commune.name} Image`}
                className="w-full h-64 object-cover rounded-lg shadow-md"
              />
            )}
            <div className="mt-6">
              <h2 className="text-4xl font-semibold text-gray-800 mb-4">
                {commune.name}
              </h2>
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-gray-700">
                  Description
                </h3>
                <p className="text-gray-600 mt-2">{commune.description}</p>
              </div>
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-gray-700">Content</h3>
                <div
                  className="prose max-w-none mt-2 text-gray-600"
                  dangerouslySetInnerHTML={{ __html: commune.content }}
                ></div>
              </div>
            </div>
          </div>

          {/* Right Column: Commune Details */}
          <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Location</h3>
              <p className="text-gray-600 mt-2">{commune.location}</p>
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-800">
                Commune Type
              </h3>
              <p className="text-gray-600 capitalize mt-2">
                {commune.commune_type}
              </p>
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Privacy</h3>
              <p className="text-gray-600 capitalize mt-2">{commune.privacy}</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ViewCommune;
