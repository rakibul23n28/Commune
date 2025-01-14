import React from "react";
import { Link } from "react-router-dom";
import { useCommuneMembership } from "../context/CommuneMembershipContext";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const FixedButtons = () => {
  const { communeid } = useParams();
  const { user } = useAuth(); // Accessing user from AuthContext
  const { fetchMembershipStatus, isMember, getRole, joinCommune } =
    useCommuneMembership();

  const [hover, setHover] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [membership, setMembership] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    const fetchUserMembership = async () => {
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
      } finally {
        setHasFetched(true);
      }
    };

    fetchUserMembership();
  }, [membership]);

  const handleActionClick = (action) => {
    location.href = `/commune/create/${communeid}/${action}`;
    setHover(!hover);
  };

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
  const canCreateEvent =
    getRole(communeid) === "admin" || getRole(communeid) === "moderator";
  return (
    <div className="fixed left-4 top-1/4 flex flex-col space-y-4">
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
