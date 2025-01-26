import { useAuth } from "../context/AuthContext";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import { getAuthHeaders, timeAgo } from "../utils/Helper";

function LinkBar({ title, to, icon, isActive }) {
  return (
    <Link to={to}>
      <button
        title={title}
        className={`flex flex-col items-center border-2 p-2 text-2xl ${
          isActive
            ? "text-red-500 border-red-500"
            : "text-gray-700 border-gray-300"
        }`}
      >
        <i className={`${icon} text-2xl`}></i>
      </button>
    </Link>
  );
}

function Navbar() {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false); // State for profile menu
  const navigate = useNavigate();
  const location = useLocation();

  const [expandedDescription, setExpandedDescription] = useState(null);
  const [selectedCommune, setSelectedCommune] = useState(null);
  const [reviews, setReviews] = useState([]); // State to hold reviews
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewError, setReviewError] = useState(null);

  const [isSearchResultsVisible, setIsSearchResultsVisible] = useState(false);

  // Handle search query input
  // Handle search query input
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Search for communes based on the query
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearchResultsVisible(false);
      return;
    }
    try {
      const response = await axios.get(`/api/search`, {
        params: { query: searchQuery },
      });
      setSearchResults(response.data.communes); // Expecting commune data from the response
      setIsSearchResultsVisible(true);
    } catch (error) {
      console.error("Error searching communes:", error);
    }
  };

  const handleDescriptionToggle = (id) => {
    setExpandedDescription((prev) => (prev === id ? null : id));
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
  };

  // Redirect to commune details using commune_id
  // Redirect to commune details using commune_id
  const handleResultClick = (communeId) => {
    navigate(`/commune/${communeId}`);
  };

  const isActive = (path) => location.pathname === path;

  // Close search results section
  const handleCloseSearchResults = () => {
    setIsSearchResultsVisible(false);
  };

  // Toggle profile menu visibility
  const toggleProfileMenu = () => setIsProfileMenuOpen(!isProfileMenuOpen);

  return (
    <nav
      className={`bg-white border-b border-gray-200 z-50 ${
        location.pathname.startsWith("/commune") ? "" : "sticky top-0"
      }`}
    >
      <div className="py-1 px-2 flex justify-between items-center">
        <Link to="/">
          <h1 className="text-xl font-bold text-red-500">COM</h1>
        </Link>

        <div className="hidden md:flex items-center space-x-4">
          <LinkBar
            title="Home"
            to="/"
            icon="fas fa-home"
            isActive={isActive("/")}
          />
          <LinkBar
            title="Commune"
            to="/commune"
            icon="fas fa-layer-group"
            isActive={isActive("/commune")}
          />
          <div className="flex border border-b-2 rounded-md overflow-hidden">
            <input
              type="text"
              className="border-0 outline-none px-3"
              placeholder="Search"
              value={searchQuery}
              onChange={handleSearchChange}
            />
            <button className="bg-gray-200 px-3 py-1" onClick={handleSearch}>
              <i className="fas fa-search text-2xl"></i>
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {user && (
            <>
              <LinkBar
                title="Joined Communes"
                to="/usercommunes"
                icon="fas fa-arrows-to-dot"
                isActive={isActive("/usercommunes")}
              />
              <LinkBar
                title="Chat"
                to="/chat"
                icon="fas fa-comments"
                isActive={isActive("/chat")}
              />
            </>
          )}
          {user ? (
            <div
              onClick={toggleProfileMenu}
              className={`relative rounded-full border-2 flex items-center justify-center text-red-500 ${
                isActive(`/profile/${user.username}`)
                  ? "text-red-500 border-red-500"
                  : "text-gray-700 border-gray-300"
              }`}
            >
              <img
                src={user.profile_image}
                alt={user.username}
                className="h-12 w-12 rounded-full object-cover"
              />
              <div className="absolute bottom-0 right-0 bg-white rounded-full h-4 w-4 flex items-center justify-center border-2 border-green-600">
                <i className="fas fa-chevron-down text-[10px] text-black font-bold"></i>
              </div>
            </div>
          ) : (
            <LinkBar
              title="Login"
              to="/login"
              icon="fas fa-right-to-bracket"
              isActive={isActive("/login")}
            />
          )}
        </div>

        {/* Profile Menu Popup */}
        {isProfileMenuOpen && user && (
          <div className="absolute top-16 right-0 bg-white shadow-lg rounded-lg w-48 p-4 space-y-4 border z-50">
            {/* Profile Link */}
            <Link to={`/profile/${user.username}`}>
              <button className="w-full flex items-center space-x-2 text-left text-gray-700 hover:text-red-500 transition-colors duration-200">
                <i className="fas fa-user-circle text-xl"></i>
                <span className="font-medium">Profile</span>
              </button>
            </Link>

            {/* Logout Button */}
            <button
              onClick={() => {
                if (confirm("Are you sure you want to logout?")) {
                  logout();
                }
              }}
              className="w-full flex items-center space-x-2 text-red-500 hover:text-red-700 transition-colors duration-200"
            >
              <i className="fas fa-sign-out-alt text-xl"></i>
              <span className="font-medium">Logout</span>
            </button>
          </div>
        )}
      </div>
      {/* // Display search results */}
      {isSearchResultsVisible && searchResults.length > 0 && (
        <div className="absolute top-16 left-0 w-full backdrop-blur-sm shadow-lg p-4 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">Search Results</h3>
            <button onClick={handleCloseSearchResults} className="text-red-500">
              <i className="fas fa-times"></i>
            </button>
          </div>
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
              {searchResults.length > 0 ? (
                searchResults.map((commune, index) => (
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
                    <td className="px-4 py-2 border">{commune.commune_type}</td>
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
                    colSpan="10"
                    className="text-center text-gray-600 py-4 border"
                  >
                    No communes available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

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

      {!location.pathname.startsWith("/commune/") &&
        !location.pathname.startsWith("/chat") &&
        !location.pathname.startsWith("/market") && (
          <Link to={user ? "/createcommune" : "/login"}>
            <div className="fixed bottom-6 right-6 bg-indigo-600 text-white rounded-full p-2 space-x-1  shadow-lg flex items-center justify-center cursor-pointer hover:bg-indigo-700 transition-all z-50">
              <i className="fas fa-plus text-2xl"></i>

              <p>Commune</p>
            </div>
          </Link>
        )}
    </nav>
  );
}

export default Navbar;
