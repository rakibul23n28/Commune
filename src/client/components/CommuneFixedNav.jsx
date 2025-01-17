import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useCommuneMembership } from "../context/CommuneMembershipContext";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

const FixedButtons = () => {
  const { communeid } = useParams();
  const { user } = useAuth(); // Accessing user from AuthContext
  const { fetchMembershipStatus, isMember, getRole, joinCommune } =
    useCommuneMembership();

  const [hover, setHover] = useState(false);
  const [showCollaborationOptions, setShowCollaborationOptions] =
    useState(false); // State to toggle collaboration options
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserMembership = async () => {
      try {
        await fetchMembershipStatus(communeid, user?.id);
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

  const handleActionClick = (action) => {
    location.href = `/commune/create/${communeid}/${action}`;
    setHover(!hover);
  };

  const handleJoinCommune = async () => {
    if (!user) {
      location.href = "/login";
      return;
    }

    try {
      await joinCommune(communeid, user?.id);
      alert("You have successfully joined the commune!");
      window.location.reload(); // Refresh to update membership status
    } catch (err) {
      setError(err.response?.data?.message || "Failed to join commune.");
    }
  };

  const toggleCollaborationOptions = () => {
    setShowCollaborationOptions(!showCollaborationOptions);
  };

  const canCreateEvent =
    getRole(communeid) === "admin" || getRole(communeid) === "moderator";

  return (
    <div className="fixed left-4 top-1/4 flex flex-col space-y-4">
      {/* Collaboration Button */}
      <div
        onClick={toggleCollaborationOptions}
        className="bg-emerald-500 text-white rounded-full px-4 py-2 hover:bg-red-600 shadow-lg relative"
      >
        Collaboration
        {/* Collaboration Options */}
        {showCollaborationOptions && (
          <div className="absolute top-0 flex gap-1 left-36">
            <Link to={`/commune/${communeid}/collaboration/posts`}>
              <button className="bg-blue-500 text-white rounded-full px-4 py-2 hover:bg-blue-600 shadow-lg">
                Posts
              </button>
            </Link>
            <Link to={`/commune/${communeid}/collaboration/lists`}>
              <button className="bg-green-500 text-white rounded-full px-4 py-2 hover:bg-green-600 shadow-lg">
                Lists
              </button>
            </Link>
            <Link to={`/commune/${communeid}/collaboration/events`}>
              <button className="bg-red-500 text-white rounded-full px-4 py-2 hover:bg-red-600 shadow-lg">
                Events
              </button>
            </Link>
          </div>
        )}
      </div>

      {/* General Options */}
      <Link to={`/commune/${communeid}/posts`}>
        <button className="bg-blue-500 text-white rounded-full px-4 py-2 hover:bg-blue-600 shadow-lg">
          Posts
        </button>
      </Link>
      <Link to={`/commune/${communeid}/lists`}>
        <button className="bg-green-500 text-white rounded-full px-4 py-2 hover:bg-green-600 shadow-lg">
          Lists
        </button>
      </Link>
      <Link to={`/commune/${communeid}/events`}>
        <button className="bg-red-500 text-white rounded-full px-4 py-2 hover:bg-red-600 shadow-lg">
          Events
        </button>
      </Link>

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
    </div>
  );
};

export default FixedButtons;
