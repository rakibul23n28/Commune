import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCommuneMembership } from "../context/CommuneMembershipContext";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import CommuneNavbar from "../components/CommuneNavbar";
import CommuneFixedNav from "../components/CommuneFixedNav";
import axios from "axios";
import { get } from "lodash";
import { timeAgo, getAuthHeaders } from "../utils/Helper";
import Navbar from "../components/Navbar";

const ViewCommune = () => {
  const { communeid } = useParams();
  const { user } = useAuth(); // Accessing user from AuthContext
  const { fetchMembershipStatus, isMember, getRole, joinCommune } =
    useCommuneMembership();
  const navigate = useNavigate();

  const [commune, setCommune] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState("");
  const [rating, setRating] = useState(1); // Store the star rating
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hover, setHover] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [membership, setMembership] = useState(null); // Store membership data

  useEffect(() => {
    const fetchCommuneData = async () => {
      try {
        const response = await axios.get(`/api/commune/communes/${communeid}`);
        setCommune(response.data.commune);
        setReviews(response.data.reviews);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load commune data");
      } finally {
        setLoading(false);
      }
    };

    const fetchUserMembership = async () => {
      if (user && user.id && !hasFetched) {
        try {
          const membershipStatus = await fetchMembershipStatus(
            communeid,
            user.id
          );
          setMembership(membershipStatus);
        } catch (err) {
          setError(
            err.response?.data?.message || "Failed to fetch membership status"
          );
        }
        setHasFetched(true);
      }
    };

    fetchCommuneData();
    fetchUserMembership();
  }, [communeid, user, hasFetched, fetchMembershipStatus]);

  const handleJoinCommune = async () => {
    if (user == null) {
      location.href = "/login";
      return;
    }

    try {
      await joinCommune(communeid, user.id);
      alert("You have successfully joined the commune!");
      window.location.reload(); // Refresh to update membership status
    } catch (err) {
      setError(err.response?.data?.message || "Failed to join commune.");
    }
  };

  const handleReviewSubmit = async () => {
    if (!newReview) {
      alert("Please enter a review before submitting.");
      return;
    }
    try {
      const response = await axios.post(
        `/api/commune/${communeid}/reviews`,
        {
          review_text: newReview,
          rating,
        },
        {
          headers: getAuthHeaders(),
        }
      );

      setReviews([response.data.review, ...reviews]); // Add new review at the top
      setNewReview(""); // Clear review input
      setRating(1); // Reset rating
    } catch (err) {
      if (err.response?.data?.msg) {
        alert(err.response?.data?.msg);
      }
      setError(err.response?.data?.message || "Failed to submit review.");
    }
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      await axios.delete(`/api/commune/reviews/${reviewId}`, {
        headers: getAuthHeaders(),
      });
      setReviews(reviews.filter((review) => review.review_id !== reviewId));
      alert("Review deleted successfully.");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete review.");
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
        <div className="w-full flex justify-center items-center h-96">
          <p>Loading...</p>
        </div>
      </Layout>
    );
  }
  const canCreateEvent =
    getRole(communeid) === "admin" || getRole() === "moderator";

  return (
    <Layout>
      {/* Navbar */}
      <CommuneFixedNav />
      <CommuneNavbar name={commune?.name} />
      <div className="w-full flex justify-center py-10">
        <div className="max-w-6xl w-full bg-white shadow-xl rounded-lg overflow-hidden grid grid-cols-3 gap-6">
          {/* Left Column: Commune Content */}
          <div className="col-span-2 p-6 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg shadow-md">
            {commune?.commune_image && (
              <img
                src={commune.commune_image}
                alt={`${commune.name} Image`}
                className="w-full h-64 object-cover rounded-lg shadow-md"
              />
            )}
            <div className="mt-6">
              <h2 className="text-4xl font-semibold text-gray-800 mb-4">
                {commune?.name}
              </h2>
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-gray-700">
                  Description
                </h3>
                <p className="text-gray-600 mt-2">{commune?.description}</p>
                <div
                  className="mt-4"
                  dangerouslySetInnerHTML={{
                    __html: commune?.content,
                  }}
                ></div>
              </div>
            </div>
          </div>

          {/* Right Column: Commune Details */}
          <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Location</h3>
              <p className="text-gray-600 mt-2">{commune?.location}</p>
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-800">
                Commune Type
              </h3>
              <p className="text-gray-600 capitalize mt-2">
                {commune?.commune_type}
              </p>
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Privacy</h3>
              <p className="text-gray-600 capitalize mt-2">
                {commune?.privacy}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="max-w-6xl w-full mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
        <h3 className="text-2xl font-semibold mb-4">Reviews</h3>
        <div className="mb-6">
          <textarea
            value={newReview}
            onChange={(e) => setNewReview(e.target.value)}
            className="w-full h-32 p-4 border border-gray-300 rounded-md"
            placeholder="Write your review..."
          ></textarea>
          <div className="flex items-center space-x-2 mt-2">
            <span>Rating:</span>
            {renderStars(rating)}
            <input
              type="range"
              min="1"
              max="5"
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <button
            onClick={handleReviewSubmit}
            className="mt-4 px-6 py-3 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-all"
          >
            Submit Review
          </button>
        </div>

        <div>
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <div key={review.review_id} className="border-b pb-4 mb-4">
                <div className="flex items-center">
                  <img
                    src={review.profile_image}
                    alt={review.username}
                    className="w-10 h-10 rounded-full mr-2"
                  />
                  <p className="text-lg font-semibold">{review.username}</p>
                </div>
                <div className="flex items-center space-x-2">
                  {renderStars(review.rating)}
                </div>
                <p className="text-gray-700 mt-2">{review.review_text}</p>
                <p className="text-gray-600 mt-2">
                  {timeAgo(review.created_at)}
                </p>
                {/* Delete button */}

                {user?.id === review.user_id && (
                  <button
                    onClick={() => handleDeleteReview(review.review_id)}
                    className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Delete
                  </button>
                )}
              </div>
            ))
          ) : (
            <p>No reviews available for this commune yet.</p>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ViewCommune;
