import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useCommuneMembership } from "../context/CommuneMembershipContext";
import { useAuth } from "../context/AuthContext";
import { getAuthHeaders } from "../utils/Helper";
import axios from "axios";

const CommuneNavbar = ({ name = "" }) => {
  const navigate = useNavigate();
  const { communeid } = useParams();

  const { fetchMembershipStatus, fetchCommuneData, communeData } =
    useCommuneMembership();
  const [membershipStatus, setMembershipStatus] = useState(null);
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);

  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showCollaborationDropdown, setShowCollaborationDropdown] =
    useState(false);
  const [showSettingsPopup, setShowSettingsPopup] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("posts"); // State for selected category

  useEffect(() => {
    const fetchUserMembership = async () => {
      try {
        const membership = await fetchMembershipStatus(communeid, user?.id);
        setMembershipStatus(membership);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to fetch membership status"
        );
      }
    };

    if (communeid && user?.id) {
      fetchUserMembership();
    }
  }, [communeid, user?.id]);

  const [commune, setCommune] = useState(null);

  useEffect(() => {
    const loadCommuneData = async () => {
      try {
        if (!communeData) {
          await fetchCommuneData(communeid);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load commune data");
      }
    };
    loadCommuneData();
  }, [communeid, communeData]);

  useEffect(() => {
    if (communeData) {
      setCommune(communeData);
    }
  }, [communeData]);

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleDelete = async (commune_id, commune_name) => {
    const communeName = prompt(
      "Please enter the name of the commune to confirm deletion:"
    );
    if (communeName !== commune_name) {
      alert("Commune name does not match. Deletion canceled.");
      return;
    }

    try {
      const response = await axios.delete(`/api/commune/delete/${commune_id}`, {
        headers: getAuthHeaders(),
      });
      if (response.data.success) {
        alert("Commune deleted successfully!");
        navigate("/commune");
      }
    } catch (err) {
      console.error("Failed to delete commune:", err);
      alert("Failed to delete commune.");
    }
  };
  const handleSearch = async (e) => {
    e.preventDefault();
    setIsSearching(true);
    try {
      const response = await axios.get(
        `/api/commune/${communeid}/search?category=${selectedCategory}&query=${searchQuery}`,
        {
          headers: getAuthHeaders(),
        }
      );
      setSearchResults(response.data.data || []);
      console.log(response.data.results);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch search results");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    setSearchResults([]);
  }, [selectedCategory]);

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  return (
    <div className="w-full bg-gray-800 text-white shadow-md sticky top-0 z-40">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex space-x-4 items-center">
          <button
            onClick={() => handleNavigation(`/commune/${communeid}`)}
            className="flex items-center px-4 py-2 rounded-md hover:bg-gray-700 transition"
          >
            <img
              src={commune?.commune_image}
              alt={commune?.name}
              className="h-8 w-8 border-2 rounded-lg object-cover mr-2"
            />
            {name.length > 30 ? `${name.slice(0, 30)}...` : name}
          </button>
          {membershipStatus && (
            <>
              <div className="relative">
                <button
                  onClick={() => setShowUserDropdown((prevState) => !prevState)}
                  className="flex items-center px-4 py-2 rounded-md hover:bg-gray-700 transition"
                >
                  <i className="fas fa-users mr-2"></i>
                  User
                </button>
                {showUserDropdown && (
                  <div className="absolute bg-white text-black shadow-md rounded-md mt-2 w-48">
                    <button
                      onClick={() =>
                        handleNavigation(`/commune/${communeid}/members`)
                      }
                      className="flex items-center px-4 py-2 hover:bg-gray-200 w-full text-left"
                    >
                      <i className="fas fa-users mr-2 text-green-600"></i>
                      Members
                    </button>
                    {(membershipStatus === "admin" ||
                      membershipStatus === "moderator") && (
                      <>
                        <button
                          onClick={() =>
                            handleNavigation(
                              `/commune/${communeid}/join-members`
                            )
                          }
                          className="flex items-center px-4 py-2 hover:bg-gray-200 w-full text-left"
                        >
                          <i className="fas fa-user-plus mr-2 text-blue-600"></i>
                          Join User
                        </button>
                        {membershipStatus === "admin" && (
                          <button
                            onClick={() =>
                              handleNavigation(
                                `/commune/${communeid}/manage-members`
                              )
                            }
                            className="flex items-center px-4 py-2 hover:bg-gray-200 w-full text-left"
                          >
                            <i className="fas fa-users-cog mr-2 text-red-600"></i>
                            Manage Members
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
              <Link
                to={`/commune/${communeid}/carts`}
                className="flex items-center px-4 py-2 rounded-md hover:bg-gray-700 transition"
              >
                <i className="fas fa-shopping-cart mr-2"></i>
                Cart
              </Link>
              <Link
                to={`/commune/${communeid}/orders`}
                className="flex items-center px-4 py-2 rounded-md hover:bg-gray-700 transition"
              >
                <i className="fas fa-list mr-2"></i>
                Order
              </Link>
            </>
          )}
          {(membershipStatus === "admin" ||
            membershipStatus === "moderator") && (
            <div className="relative">
              <button
                onClick={() =>
                  setShowCollaborationDropdown((prevState) => !prevState)
                }
                className="flex items-center px-4 py-2 rounded-md hover:bg-gray-700 transition"
              >
                <i className="fas fa-handshake mr-2"></i>
                Collaboration
              </button>
              {showCollaborationDropdown && (
                <div className="absolute bg-white text-black shadow-md rounded-md mt-2 w-48">
                  <button
                    onClick={() =>
                      handleNavigation(
                        `/commune/${communeid}/collaboration-requests`
                      )
                    }
                    className="flex items-center px-4 py-2 hover:bg-gray-200 w-full text-left"
                  >
                    <i className="fas fa-paper-plane mr-2 text-purple-600"></i>
                    Collaboration Requests
                  </button>
                  <button
                    onClick={() =>
                      handleNavigation(`/commune/${communeid}/pending`)
                    }
                    className="flex items-center px-4 py-2 hover:bg-gray-200 w-full text-left"
                  >
                    <i className="fas fa-spinner fa-spin mr-2 text-red-600"></i>
                    Pending Requests
                  </button>
                </div>
              )}
            </div>
          )}
          {membershipStatus === "admin" && (
            <div className="relative">
              <button
                onClick={() => setShowSettingsPopup((prevState) => !prevState)}
                className="flex items-center px-4 py-2 rounded-md hover:bg-gray-700 transition"
              >
                <i className="fas fa-cog mr-2"></i>
                Settings
              </button>
              {showSettingsPopup && (
                <div className="absolute bg-white text-black shadow-md rounded-md mt-2 w-48">
                  <button
                    onClick={() =>
                      handleNavigation(`/editcommune/${communeid}`)
                    }
                    className="flex items-center px-4 py-2 hover:bg-gray-200 w-full text-left"
                  >
                    <i className="fas fa-edit mr-2 text-orange-600"></i>
                    Edit
                  </button>

                  <button
                    onClick={() => handleDelete(communeid, commune.name)}
                    className="flex items-center px-4 py-2 hover:bg-gray-200 w-full text-left"
                  >
                    <i className="fas fa-trash mr-2 text-red-600"></i>
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        <form onSubmit={handleSearch} className="flex items-center space-x-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="px-3 py-1 text-black rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
          />
          <select
            value={selectedCategory}
            onChange={handleCategoryChange}
            className="px-3 py-1 text-black rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            <option value="posts">Posts / Lists </option>
            <option value="products">Products</option>
            <option value="events">Events</option>
            <option value="users">users</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2 rounded-md hover:bg-gray-700 transition"
          >
            <i className="fas fa-search"></i>
          </button>
        </form>
      </div>
      {/* Search Results Section */}
      {isSearching && <p className="text-center text-black">Searching...</p>}

      {searchResults.length > 0 && (
        <div className="backdrop-blur-sm p-4 w-96 overflow-x-hidden max-h-[500px] overflow-y-auto z-1 rounded-md absolute right-0 top-16">
          <h2 className="text-xl font-semibold mb-4 text-black">
            Search Results
          </h2>
          <ul className="space-y-2">
            {selectedCategory === "users" &&
              searchResults.map((user) => (
                <li
                  key={user.user_id}
                  className="bg-gray-800 p-3 rounded-md bg-gray-800= hover:bg-gray-600  cursor-pointer"
                  onClick={() => handleNavigation(`/profile/${user.username}`)}
                >
                  <div className="flex items-center space-x-4">
                    <img
                      src={user.profile_image || "/default-avatar.png"}
                      alt={user.username}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <h3 className="font-bold">
                        {user.first_name} {user.last_name}
                      </h3>
                      <p className="text-sm text-gray-400">@{user.username}</p>
                    </div>
                  </div>
                </li>
              ))}

            {selectedCategory === "posts" &&
              searchResults.map((post) => (
                <li
                  key={post.post_id}
                  className="bg-gray-800 p-3 rounded-md bg-gray-800= hover:bg-gray-600  cursor-pointer"
                  onClick={() =>
                    handleNavigation(
                      `/commune/${communeid}/${
                        post.post_type === "blog" ? "post" : "list"
                      }/${post.post_id}`
                    )
                  }
                >
                  <h3 className="font-bold ">{post.title}</h3>
                  {post.post_type === "blog" ? (
                    <div
                      className="text-gray-400 overflow-hidden max-h-96 overflow-ellipsis break-words"
                      dangerouslySetInnerHTML={{ __html: post.content }}
                    ></div>
                  ) : (
                    <p className="text-gray-400 break-words">{post.content}</p>
                  )}
                </li>
              ))}

            {selectedCategory === "products" &&
              searchResults.map((product) => (
                <li
                  key={product.product_id}
                  className="bg-gray-800 p-3 rounded-md hover:bg-gray-600 cursor-pointer"
                  onClick={() =>
                    handleNavigation(
                      `/commune/${communeid}/product/${product.product_id}`
                    )
                  }
                >
                  <div className="flex items-center space-x-4">
                    <img
                      src={product.product_image || "/default-product.png"}
                      alt={product.product_name}
                      className="w-10 h-10 rounded-md"
                    />
                    <div>
                      <h3 className="font-bold break-words">
                        {product.product_name}
                      </h3>
                      <p className="text-sm text-gray-400  overflow-ellipsis break-words">
                        {product.description}
                      </p>
                      <p className="text-sm text-green-400">${product.price}</p>
                    </div>
                  </div>
                </li>
              ))}

            {selectedCategory === "events" &&
              searchResults.map((event) => (
                <li
                  key={event.event_id}
                  className="bg-gray-800 p-3 rounded-md hover:bg-gray-600 cursor-pointer"
                  onClick={() =>
                    handleNavigation(
                      `/commune/${communeid}/event/${event.event_id}`
                    )
                  }
                >
                  <div className="flex items-center space-x-4">
                    <img
                      src={event.event_image || "/default-event.png"}
                      alt={event.event_name}
                      className="w-10 h-10 rounded-md"
                    />
                    <div>
                      <h3 className="font-bold break-words">
                        {event.event_name}
                      </h3>
                      <p className="text-sm text-gray-400 break-words">
                        {event.event_description.slice(0, 50)}...
                      </p>
                      <p className="text-xs text-gray-500">
                        Date: {new Date(event.event_date).toDateString()}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CommuneNavbar;
