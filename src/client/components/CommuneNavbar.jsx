import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCommuneMembership } from "../context/CommuneMembershipContext";
import { useAuth } from "../context/AuthContext";
import { getAuthHeaders } from "../utils/Helper";
import axios from "axios";

const CommuneNavbar = ({ name = "" }) => {
  const navigate = useNavigate();
  const { communeid } = useParams();
  const [searchQuery, setSearchQuery] = useState("");
  const { fetchMembershipStatus, fetchCommuneData, communeData } =
    useCommuneMembership();
  const [membershipStatus, setMembershipStatus] = useState(null);
  const { user } = useAuth();
  const [error, setError] = useState(null);

  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showCollaborationDropdown, setShowCollaborationDropdown] =
    useState(false);
  const [showSettingsPopup, setShowSettingsPopup] = useState(false);

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

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/search?query=${searchQuery}`);
  };
  // Function to handle commune deletion
  const handleDelete = async (commune_id, commune_name) => {
    const communeName = prompt(
      "Please enter the name of the commune to confirm deletion:"
    );
    if (communeName !== commune_name) {
      alert("Commune name does not match. Deletion canceled.");
      return;
    }

    console.log("Deleting commune with ID:", commune_id, commune_name);

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
                          handleNavigation(`/commune/${communeid}/join-members`)
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
                    onClick={() =>
                      handleNavigation(`/commune/${communeid}/manage`)
                    }
                    className="flex items-center px-4 py-2 hover:bg-gray-200 w-full text-left"
                  >
                    <i className="fas fa-sliders-h mr-2 text-teal-600"></i>
                    Manage
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
