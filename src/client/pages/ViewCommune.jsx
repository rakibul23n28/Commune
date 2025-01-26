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
  const { leaveCommune, getRole } = useCommuneMembership();
  const navigate = useNavigate();

  const [commune, setCommune] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState("");
  const [rating, setRating] = useState(1); // Store the star rating
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCommuneData = async () => {
      try {
        const response = await axios.get(`/api/commune/communes/${communeid}`);
        setCommune(response.data.commune);
        if (response.data.reviews[0].username !== null) {
          setReviews(response.data.reviews);
        }

        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.msg || "Failed to load commune data");
      }
    };

    fetchCommuneData();
  }, [communeid, user]);

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
          <p>{error}</p>
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
      <div className="w-full flex justify-center py-10 ">
        <div className="max-w-6xl w-full   overflow-hidden grid grid-cols-3 gap-1">
          {/* Left Column: Commune Content */}
          <div className="col-span-2 p-6 w-full max-w-3xl border-2 rounded-md">
            {/* Commune Image and Name */}
            <div className="flex flex-row mb-4 gap-1 justify-between">
              <div className="flex flex-col gap-2  justify-center">
                <h3 className="font-semibold truncate text-3xl">
                  {commune.name}
                </h3>
                <p className="text-gray-600">{commune?.description}</p>
              </div>
              <img
                src={commune.commune_image}
                alt={`${commune.name} Image`}
                className="max-w-md h-48 object-cover rounded-full shadow-md"
              />
            </div>
            <hr className="border-4 border-red-100 rounded-lg w-48" />
            <div className="mt-6">
              <div className="mb-4">
                <div
                  className="mt-4 break-words"
                  dangerouslySetInnerHTML={{
                    __html: commune?.content,
                  }}
                ></div>
              </div>
            </div>
            {/* Right Column: Commune Details */}
            <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200 flex justify-between gap-6">
              <div className=" rounded-xl bg-red-100 p-4">
                <h3 className="text-xl font-semibold text-gray-800">
                  Location
                </h3>
                <p className="text-gray-600 mt-2">{commune?.location}</p>
              </div>
              <div className="rounded-xl bg-red-200 p-4">
                <h3 className="text-xl font-semibold text-gray-800">
                  Commune Type
                </h3>
                <p className="text-gray-600 capitalize mt-2">
                  {commune?.commune_type}
                </p>
              </div>
              <div className=" rounded-xl bg-red-300 p-4">
                <h3 className="text-xl font-semibold text-gray-800">Privacy</h3>
                <p className="text-gray-600 capitalize mt-2">
                  {commune?.privacy}
                </p>
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="w-full mx-auto p-6 rounded-lg border-2">
            <h3 className="text-2xl font-semibold mb-4">Reviews</h3>
            <div className="mb-6">
              <textarea
                value={newReview}
                onChange={(e) => setNewReview(e.target.value)}
                className="w-full h-16 p-4 border border-gray-300 rounded-md"
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
                className="mt-4 px-4 py-2 bg-indigo-600 w-full text-white rounded-full shadow-lg hover:bg-indigo-700 transition-all"
              >
                Submit Review
              </button>
            </div>

            <div>
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <div key={review.review_id} className="border-b pb-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <img
                          src={review.profile_image}
                          alt={review.username}
                          className="w-10 h-10 rounded-full mr-2"
                        />
                        <div className="flex flex-col ">
                          <p className="text-lg font-semibold">
                            {review.username}
                          </p>
                          <p className="text-gray-600 text-sm">
                            {timeAgo(review.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end">
                          <div className="flex items-center space-x-2">
                            {renderStars(review.rating)}
                          </div>
                          <p className="text-gray-700 ">{review.review_text}</p>
                        </div>
                        {user?.id === review.user_id && (
                          <i
                            className="fas fa-trash text-red-600 cursor-pointer"
                            onClick={() => handleDeleteReview(review.review_id)}
                          ></i>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p>No reviews available for this commune yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ViewCommune;
