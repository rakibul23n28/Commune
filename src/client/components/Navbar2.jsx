import { useAuth } from "../context/AuthContext";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import { getAuthHeaders, timeAgo } from "../utils/Helper";

function Navbar() {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false); // State for profile menu
  const navigate = useNavigate();
  const location = useLocation();

  // Handle search query input
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Search for notes based on the query
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await axios.get(`/api/notes/search`, {
        params: { query: searchQuery },
        headers: getAuthHeaders(),
      });
      setSearchResults(response.data.notes);
    } catch (error) {
      console.error("Error searching notes:", error);
    }
  };

  // Redirect to note details using shareId
  const handleResultClick = (shareId) => {
    navigate(`/note/${shareId}`);
  };

  const isActive = (path) => location.pathname === path;

  // Toggle profile menu visibility
  const toggleProfileMenu = () => setIsProfileMenuOpen(!isProfileMenuOpen);

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="py-1 px-2 flex justify-between items-center">
        <a href="#" className="text-xl font-bold text-red-500">
          COM
        </a>

        <div className="hidden md:flex items-center space-x-4">
          <Link to="/">
            <button
              title="Home"
              className={`flex flex-col items-center border rounded-full p-2 text-2xl ${
                isActive("/")
                  ? "text-red-500 border-red-500"
                  : "text-gray-700 border-gray-300"
              }`}
            >
              <i className="fas fa-home text-2xl"></i>
            </button>
          </Link>
          <Link to="/communes">
            <button
              title="Commune"
              className={`flex flex-col items-center border rounded-full p-2 text-2xl ${
                isActive("/communes")
                  ? "text-red-500 border-red-500"
                  : "text-gray-700 border-gray-300"
              }`}
            >
              <i className="fas fa-users text-2xl"></i>
            </button>
          </Link>
          <Link to="/market">
            <button
              title="Market"
              className={`flex flex-col items-center border rounded-full p-2 text-2xl ${
                isActive("/market")
                  ? "text-red-500 border-red-500"
                  : "text-gray-700 border-gray-300"
              }`}
            >
              <i className="fas fa-shopping-cart text-2xl"></i>
            </button>
          </Link>
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

        {/* Profile Icon */}
        <div
          onClick={toggleProfileMenu} // Toggle profile menu on click
          className="relative h-12 w-12 bg-red-100 rounded-full flex items-center justify-center text-red-500"
        >
          {user ? (
            <>
              <img
                src={user.profile_image || "/uploads/defuser.png"} // Use default image if profilePicUrl does not exist
                alt={user.username}
                className="h-12 w-12 rounded-full border border-black  object-cover"
              />
              <div className="absolute bottom-0 right-0 bg-gray-200 rounded-full h-4 w-4 flex items-center justify-center border-2 border-gray-600">
                <i className="fas fa-chevron-down text-[10px] text-gray-600 font-bold"></i>
              </div>
            </>
          ) : (
            ""
          )}
        </div>

        {/* Profile Menu Popup */}
        {isProfileMenuOpen && user && (
          <div className="absolute top-16 right-0 bg-white shadow-lg rounded-lg w-48 p-4 space-y-2 border z-50">
            <Link to={`/profile/${user.username}`}>
              <button className="w-full text-left text-gray-700 hover:text-red-500">
                Manage Profile
              </button>
            </Link>
            <button
              onClick={() => {
                if (confirm("Are you sure you want to logout?")) {
                  logout();
                }
              }}
              className="flex flex-row items-center text-red-500 hover:text-red-700"
            >
              <i className="fas fa-sign-out-alt text-2xl mb-1"></i>
              <h1 className="ml-2 text-sm">Logout</h1>
            </button>
          </div>
        )}
      </div>

      {/* Display search results */}
      {searchResults.length > 0 && (
        <div className="absolute top-16 left-0 w-full bg-white shadow-lg p-4 rounded-lg">
          <h3 className="font-semibold">Search Results</h3>
          <ul className="space-y-2 mt-2">
            {searchResults.map((note) => (
              <div
                key={note.shareId}
                onClick={() => handleResultClick(note.shareId)}
                className="cursor-pointer hover:shadow-md transition-shadow duration-300 bg-white border rounded-lg p-4 mb-2 flex flex-col items-start space-y-2"
              >
                {/* Header Section */}
                <div className="flex items-center space-x-4">
                  <div className="flex flex-col">
                    <h3 className="font-semibold text-gray-800">
                      {note.username}
                    </h3>
                    <h6 className="text-gray-600 text-sm">
                      {timeAgo(note.createdAt)}
                    </h6>
                  </div>
                </div>

                {/* Note Title */}
                <div className="w-full">
                  <h4 className="font-medium text-gray-700 hover:text-red-500">
                    {note.title}
                  </h4>
                </div>
              </div>
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
