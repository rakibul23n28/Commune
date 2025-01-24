import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Layout from "../components/Layout";
import { getAuthHeaders } from "../utils/Helper.js";

import { timeAgo } from "../utils/Helper.js";

const AllCommunes = () => {
  const [communes, setCommunes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedDescription, setExpandedDescription] = useState(null);
  const [selectedCommune, setSelectedCommune] = useState(null);
  const [reviews, setReviews] = useState([]); // State to hold reviews
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewError, setReviewError] = useState(null);

  useEffect(() => {
    const fetchAllCommunes = async () => {
      try {
        const response = await axios.get("/api/commune/all", {
          headers: getAuthHeaders(),
        });
        setCommunes(response.data.communes);
      } catch (err) {
        // setError("Failed to load communes.");
        console.error("Error fetching communes:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllCommunes();
  }, []);

  const handleDescriptionToggle = (id) => {
    setExpandedDescription((prev) => (prev === id ? null : id));
  };

  const closeReviewModal = () => {
    setReviewModalVisible(false);
    setSelectedCommune(null);
    setReviews([]); // Clear reviews when modal is closed
  };

  const handleReviewClick = async (commune) => {
    setSelectedCommune(commune);
    try {
      const response = await axios.get(
        `/api/commune/${commune.commune_id}/reviews`
      );

      setReviews(response.data.reviews);
      setReviewModalVisible(true);
    } catch (err) {
      setReviewError("Failed to load reviews.");
      console.error("Error fetching reviews:", err);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          className={`inline-block text-sm ${
            i <= rating ? "text-yellow-400" : "text-gray-300"
          }`}
        >
          ★
        </span>
      );
    }
    return stars;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center ">
          <p className="text-lg text-gray-600">Loading communes...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex justify-center items-center">
          <p className="text-lg text-red-600">{error}</p>sfsdfdsfdsf
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex justify-center mt-8">
        <div className="w-full max-w-6xl p-6">
          <h1 className="text-3xl font-bold mb-6 text-center">All Communes</h1>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto border-collapse border border-gray-300 bg-white text-left">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 border">#</th>
                  <th className="px-4 py-2 border">Image</th>
                  <th className="px-4 py-2 border">Name</th>
                  <th className="px-4 py-2 border">Description</th>
                  <th className="px-4 py-2 border">Privacy</th>
                  <th className="px-4 py-2 border">Type</th>
                  <th className="px-4 py-2 border">Location</th>
                  <th className="px-4 py-2 border">Joined Users</th>
                  <th className="px-4 py-2 border">Reviews</th>
                  <th className="px-4 py-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {communes.length > 0 ? (
                  communes.map((commune, index) => (
                    <tr key={commune.commune_id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 border">{index + 1}</td>
                      <td className="px-4 py-2 border">
                        <img
                          src={commune.commune_image || "/uploads/default.jpg"}
                          alt={commune.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      </td>
                      <td className="px-4 py-2 border">
                        <Link
                          to={`/commune/${commune.commune_id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {commune.name}
                        </Link>
                      </td>
                      <td
                        className="px-4 py-2 border text-sm cursor-pointer"
                        onClick={() =>
                          handleDescriptionToggle(commune.commune_id)
                        }
                      >
                        {expandedDescription === commune.commune_id
                          ? commune.description
                          : commune.description.slice(0, 100) + "..."}
                      </td>
                      <td className="px-4 py-2 border">{commune.privacy}</td>
                      <td className="px-4 py-2 border">
                        {commune.commune_type}
                      </td>
                      <td className="px-4 py-2 border">{commune.location}</td>
                      <td className="px-4 py-2 border">
                        {commune.total_joined_users || 0}
                      </td>
                      <td
                        title="Click to view reviews"
                        className="px-4 py-2 border cursor-pointer text-yellow-400"
                        onClick={() => handleReviewClick(commune)}
                      >
                        {renderStars(commune.avg_rating || 0)}
                        <span className="text-gray-600">
                          ({commune.review_count || 0} reviews)
                        </span>
                      </td>
                      <td className="px-4 py-2 border">
                        <Link
                          to={`/commune/${commune.commune_id}`}
                          className="text-blue-500 hover:underline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="9"
                      className="text-center text-gray-600 py-4 border"
                    >
                      No communes available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {reviewModalVisible && selectedCommune && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
            <ul className="space-y-4 h-96 overflow-auto">
              {reviewError && <p className="text-red-600">{reviewError}</p>}
              {reviews.length > 0 ? (
                reviews.map((review, index) => (
                  <li key={index} className="border-b pb-2">
                    <div className="flex items-center space-x-3">
                      <img
                        src={review.profile_image || "/uploads/default.jpg"}
                        alt={review.username}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <p className="font-semibold text-gray-800">
                        {review.username}
                      </p>
                    </div>
                    <p className="text-gray-800 mt-2">{review.review_text}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Rating: {renderStars(review.rating)}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {timeAgo(review.created_at)} ago
                    </p>
                  </li>
                ))
              ) : (
                <p className="text-gray-600">No reviews available.</p>
              )}
            </ul>
            <button
              onClick={closeReviewModal}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default AllCommunes;
