import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Layout from "../components/Layout";
import { getAuthHeaders, timeAgo } from "../utils/Helper.js";
import { useAuth } from "../context/AuthContext";

const Home = () => {
  const [communes, setCommunes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedDescription, setExpandedDescription] = useState(null);
  const [interests, setInterests] = useState([]);
  const [newInterest, setNewInterest] = useState("");

  const [selectedCommune, setSelectedCommune] = useState(null);
  const [reviews, setReviews] = useState([]); // State to hold reviews
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewError, setReviewError] = useState(null);
  const [expandedCommuneId, setExpandedCommuneId] = useState(null);
  const { user } = useAuth();
  useEffect(() => {
    const fetchInterests = async () => {
      try {
        const response = await axios.get("/api/user/interests", {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });
        setInterests(response.data.interests);
      } catch (err) {
        console.error("Error fetching interests:", err);
      }
    };

    fetchInterests();
  }, [user]);

  const handleAddInterest = async () => {
    if (newInterest.trim() && !interests.includes(newInterest.trim())) {
      const updatedInterests = [...interests, newInterest.trim()];
      setInterests(updatedInterests);

      try {
        await axios.post(
          "/api/user/interests",
          { interests: newInterest },
          { headers: getAuthHeaders() }
        );
      } catch (err) {
        console.error("Error updating interests:", err);
      }
      setNewInterest("");
    }
  };

  const handleRemoveInterest = async (interest) => {
    if (!interests.includes(interest)) {
      console.error("Interest not found.");
      return; // Exit if the interest is not found in the list
    }

    const updatedInterests = interests.filter((i) => i === interest);
    setInterests(interests.filter((i) => i !== interest));

    try {
      await axios.post(
        "/api/user/interests/delete",
        { interests: updatedInterests },
        { headers: getAuthHeaders() }
      );
    } catch (err) {
      console.error("Error updating interests:", err.response.data.message);
      // Optionally, revert changes if the API request fails
      setInterests(interests); // Restore the original interests if the delete fails
    }
  };

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

  useEffect(() => {
    const fetchCommunes = async () => {
      try {
        setLoading(true);
        if (interests.length > 0) {
          const response = await axios.get("/api/commune/user-interested", {
            headers: getAuthHeaders(),
            params: { userId: user.id }, // Pass user ID for the query
          });
          setCommunes(response.data.communes);
        } else {
          // Fetch all communes if no interests
          const response = await axios.get("/api/commune/all", {
            headers: getAuthHeaders(),
          });
          setCommunes(response.data.communes);
        }
      } catch (err) {
        setError("Failed to load communes.");
        console.error("Error fetching communes:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCommunes();
  }, [interests, user]);

  const handleDescriptionToggle = (id) => {
    setExpandedDescription((prev) => (prev === id ? null : id));
  };

  const handleCommuneToggle = (id) => {
    setCommunes((prevCommunes) =>
      prevCommunes.filter((commune) => commune.commune_id !== id)
    );
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
  }; // Toggle the expansion of the notes
  const toggleCommuneExpansion = (noteId) => {
    setExpandedCommuneId((prevId) => (prevId === noteId ? null : noteId));
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center">
          <p className="text-lg text-gray-600">Loading communes...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex justify-center items-center">
          <p className="text-lg text-red-600">{error}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className=" w-full mx-auto relative">
        {user && (
          <div className="w-52 flex-shrink-0 bg-white p-4 rounded-lg shadow-md fixed mt-8 ml-16 z-50">
            <h2 className="text-lg font-bold mb-4">Interests</h2>
            <div className="mb-4 relative">
              <input
                type="text"
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                placeholder="Add a unique interest"
                className="w-full x-2 py-1 border rounded-md"
              />
              <button
                onClick={handleAddInterest}
                className="absolute right-0 bottom-0 text-blue-500 rounded-full h-8 w-8 flex items-center justify-center"
              >
                <i className="fas fa-plus"></i>
              </button>
            </div>
            <div className="space-y-2">
              {interests.map((interest, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-gray-100 p-2 rounded-md"
                >
                  <span className="text-gray-800 text-sm">{interest}</span>
                  <button
                    className="text-red-500 hover:text-red-700 text-sm"
                    onClick={() => handleRemoveInterest(interest)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="">
          {communes.length > 0 ? (
            communes.map((commune) => (
              <div
                key={commune.commune_id}
                className={`rounded-lg  p-4 overflow-hidden  relative ${
                  commune.events
                    ? "flex justify-end mr-8"
                    : "max-w-3xl w-full mx-auto"
                }  `}
              >
                <div
                  className={`flex hover:shadow-lg transition-shadow relative shadow-md rounded-lg max-w-6xl p-4 ${
                    commune.events.length === 0 ? "mr-52" : ""
                  }  gap-2`}
                >
                  <div className="flex flex-col max-w-3xl border">
                    <button
                      type="button"
                      className="hover:text-white text-red-600 hover:bg-red-600 bg-white absolute top-2 -right-1 h-5 w-5 flex items-center justify-center rounded-full"
                      onClick={() => handleCommuneToggle(commune.commune_id)}
                    >
                      <i className="fas fa-times"></i>
                    </button>

                    <Link to={`/commune/${commune.commune_id}`}>
                      <div className="flex justify-between items-center hover:bg-gray-100 rounded p-2 border-spacing-2 border-b-2">
                        <div className="flex justify-between items-center">
                          <img
                            src={
                              commune.commune_image || "/uploads/default.jpg"
                            }
                            alt={commune.name}
                            className="w-12 h-12 object-cover rounded-full mr-4 border-2 border-gray-500"
                          />
                          <div className="">
                            <h2 className="text-xl font-bold text-gray-800 truncate">
                              {commune.name}
                            </h2>
                            <p className="text-gray-600 text-sm truncate">
                              {timeAgo(commune.created_at)} ago
                            </p>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500 flex justify-between items-center gap-4">
                          <div className="flex items-center gap-1">
                            {commune.privacy === "public" ? (
                              <i className="fas fa-globe text-green-500"></i>
                            ) : (
                              <i className="fas fa-lock text-red-500"></i>
                            )}
                            <p className="hidden sm:block">{commune.privacy}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            {commune.commune_type === "community" ? (
                              <i className="fas fa-users text-blue-500"></i>
                            ) : (
                              <i className="fas fa-store text-green-500"></i>
                            )}
                            <p className="hidden sm:block">
                              {commune.commune_type}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <i className="fas fa-map-marker-alt text-red-500"></i>
                            <p className="hidden sm:block">
                              {commune.location}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Link>
                    <div className="p-4">
                      <p className="text-gray-600 text-sm mb-4">
                        <span className="font-bold">Description : </span>
                        {expandedDescription === commune.commune_id
                          ? commune.description
                          : commune.description.slice(0, 250) + "..."}
                        <span
                          onClick={() =>
                            handleDescriptionToggle(commune.commune_id)
                          }
                          className="text-blue-500 hover:underline cursor-pointer ml-2"
                        >
                          {expandedDescription === commune.commune_id
                            ? "Show Less"
                            : "Read More"}
                        </span>
                      </p>
                      <hr className="mb-4 w-40 border-2" />
                      <div
                        className={`commune-description text-sm text-gray-800 transition-all duration-300 whitespace-pre-wrap break-words ${
                          expandedCommuneId === commune.commune_id
                            ? "line-clamp-none"
                            : "max-h-96 overflow-hidden"
                        }`}
                        dangerouslySetInnerHTML={{
                          __html: commune.content,
                        }}
                      ></div>
                      <span
                        onClick={() =>
                          toggleCommuneExpansion(commune.commune_id)
                        }
                        className="text-blue-500 pt-4 cursor-pointer text-sm font-normal"
                      >
                        {expandedCommuneId === commune.commune_id
                          ? "Show Less"
                          : "...Read More"}
                      </span>

                      <div className="mt-2 flex items-center justify-between text-yellow-400">
                        <div className="">
                          {renderStars(commune.avg_rating || 0)}
                        </div>
                        <span
                          className="text-gray-600 text-sm ml-2 cursor-pointer underline hover:text-red-500"
                          onClick={() => handleReviewClick(commune)}
                        >
                          ({commune.review_count || 0} reviews)
                        </span>
                      </div>
                    </div>
                  </div>

                  {commune.events && commune.events.length > 0 && (
                    <div className="mt-6">
                      <div className="h-8 flex flex-col gap-6">
                        {commune.events.slice(0, 2).map((event, index) => (
                          <div
                            key={index}
                            className="p-4 rounded-lg border border-gray-200 shadow-md hover:shadow-lg transition-shadow bg-white"
                          >
                            {/* Event Image */}
                            {event.event_image && (
                              <img
                                src={event.event_image}
                                alt={event.event_name}
                                className="w-full h-16 object-cover rounded-lg mb-4"
                              />
                            )}

                            {/* Event Name */}
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">
                              {event.event_name}
                            </h4>

                            <p className="text-sm text-gray-600 mb-2">
                              <span className="font-medium text-gray-800">
                                Event Date:
                              </span>{" "}
                              {new Date(event.event_date).toLocaleString()}
                            </p>

                            {/* Event Description */}
                            <p className="text-sm text-gray-700 mb-4 line-clamp-2">
                              {event.event_description}
                            </p>

                            {/* Read More Button */}
                            <Link
                              to={`/commune/${commune.commune_id}/event/${event.event_id}`}
                              className="block mt-auto text-blue-500 hover:text-blue-600 font-medium text-sm"
                            >
                              Read More →
                            </Link>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-600">No communes available.</p>
          )}
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
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Home;
