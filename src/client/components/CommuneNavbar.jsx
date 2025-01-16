import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const CommuneNavbar = ({ name = "" }) => {
  // Default name to an empty string
  const navigate = useNavigate();
  const { communeid } = useParams(); // Get the commune ID from the URL
  const [searchQuery, setSearchQuery] = useState(""); // To manage the search input

  const handleNavigation = (option) => {
    if (option === "profile") {
      navigate(`/commune/${communeid}`);
    } else if (option === "otherCommunes") {
      navigate(`/communes`);
    } else if (option === "settings") {
      navigate(`/commune/${communeid}/settings`);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Navigate to a search results page or filter the current data (you can customize this logic)
    navigate(`/search?query=${searchQuery}`);
  };

  return (
    <div className="w-full bg-gray-800 text-white shadow-md sticky top-0 z-10">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex space-x-4">
          <button
            onClick={() => handleNavigation("profile")}
            className="flex items-center px-4 py-2 rounded-md hover:bg-gray-700 transition"
          >
            <i className="fas fa-user mr-2"></i>
            {name.length > 30 ? `${name.slice(0, 30)}...` : name}
          </button>

          <button
            onClick={() => handleNavigation("otherCommunes")}
            className="flex items-center px-4 py-2 rounded-md hover:bg-gray-700 transition"
          >
            <i className="fas fa-users mr-2"></i>
            Collaboration
          </button>
          <button
            onClick={() => handleNavigation("settings")}
            className="flex items-center px-4 py-2 rounded-md hover:bg-gray-700 transition"
          >
            <i className="fas fa-cog mr-2"></i>
            Settings
          </button>
        </div>
        <form onSubmit={handleSearch} className="flex items-center space-x-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="px-3 py-1 text-black rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-md hover:bg-gray-700 transition"
          >
            <i className="fas fa-search"></i>
          </button>
        </form>
      </div>
    </div>
  );
};

export default CommuneNavbar;
