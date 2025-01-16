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
        className={`flex flex-col items-center border-2 rounded-full p-2 text-2xl ${
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
            isActive={isActive("/communes")}
          />
          <LinkBar
            title="Market"
            to="/market"
            icon="fas fa-shopping-cart"
            isActive={isActive("/market")}
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
              <LinkBar
                title="Notifications"
                to="/notifications"
                icon="fas fa-bell"
                isActive={isActive("/notifications")}
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
      {!location.pathname.startsWith("/commune/") &&
        !location.pathname.startsWith("/market/") && (
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
