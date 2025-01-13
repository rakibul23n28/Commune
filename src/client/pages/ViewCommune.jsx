import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCommuneMembership } from "../context/CommuneMembershipContext";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import CommuneNavbar from "../components/CommuneNavbar";
import axios from "axios";
import { get } from "lodash";
import { timeAgo, getAuthHeaders } from "../utils/Helper";

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
        setReviews(response.data.reviews || []);
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
          user_id: user.id,
        },
        {
          headers: getAuthHeaders(),
        }
      );
      setReviews([response.data.review, ...reviews]); // Add new review at the top
      setNewReview(""); // Clear review input
      setRating(1); // Reset rating
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit review.");
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

  if (error) {
    return (
      <Layout>
        <div className="w-full flex justify-center items-center h-96">
          <p className="text-red-500">{error}</p>
        </div>
      </Layout>
    );
  }
  const canCreateEvent =
    getRole(communeid) === "admin" || getRole() === "moderator";
  console.log(getRole(communeid));

  return (
    <Layout>
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
            reviews.map((review, index) => (
              <div key={index} className="border-b pb-4 mb-4">
                <p className="text-lg font-semibold">{review.username}</p>
                <div className="flex items-center space-x-2">
                  {renderStars(review.rating)}
                </div>
                <p className="text-gray-700 mt-2">{review.review_text}</p>
                <p className="text-gray-600 mt-2">
                  {timeAgo(review.created_at)}
                </p>
              </div>
            ))
          ) : (
            <p>No reviews available for this commune yet.</p>
          )}
        </div>
      </div>

      {/* Join or Action Button */}
      {isMember(communeid) ? (
        <div
          className="fixed bottom-6 right-6 bg-indigo-600 text-white rounded-full shadow-lg w-16 h-16 flex items-center justify-center cursor-pointer hover:bg-indigo-700 transition-all z-50"
          onClick={() => setHover(!hover)}
        >
          <i className="fas fa-plus text-2xl"></i>
          {hover && (
            <div className="absolute bottom-20 right-0 bg-white shadow-lg rounded-lg p-4 text-black space-y-2">
              <button
                className="flex items-center w-full text-left px-4 py-2 hover:bg-gray-200 rounded-md"
                onClick={() => handleActionClick("post")}
              >
                <i className="fas fa-pencil-alt text-indigo-600 mr-2"></i> Post
              </button>
              <button
                className="flex items-center w-full text-left px-4 py-2 hover:bg-gray-200 rounded-md"
                onClick={() => handleActionClick("list")}
              >
                <i className="fas fa-list text-indigo-600 mr-2"></i> Listing
              </button>
              {canCreateEvent && (
                <button
                  className="flex items-center w-full text-left px-4 py-2 hover:bg-gray-200 rounded-md"
                  onClick={() => handleActionClick("event")}
                >
                  <i className="fas fa-calendar text-indigo-600 mr-2"></i> Event
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="fixed bottom-6 right-6">
          <button
            onClick={handleJoinCommune}
            className="bg-indigo-600 text-white px-6 py-3 rounded-full shadow-lg hover:bg-indigo-700 transition-all"
          >
            Join Commune
          </button>
        </div>
      )}
    </Layout>
  );
};

export default ViewCommune;
