import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCommuneMembership } from "../context/CommuneMembershipContext";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import CommuneNavbar from "../components/CommuneNavbar";
import axios from "axios";

const ViewCommune = () => {
  const { communeid } = useParams();
  const { user } = useAuth(); // Accessing user from AuthContext
  const { fetchMembershipStatus, isMember, getRole } = useCommuneMembership();
  const navigate = useNavigate();

  const [commune, setCommune] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hover, setHover] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [membership, setMembership] = useState(null); // Store membership data

  useEffect(() => {
    const fetchCommuneData = async () => {
      try {
        const response = await axios.get(`/api/commune/communes/${communeid}`);
        console.log(response.data.communes);
        setCommune(response.data.communes);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load commune data");
      } finally {
        setLoading(false);
      }
    };

    const fetchUserMembership = async () => {
      if (user && user.id && !hasFetched) {
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
        }
        // Ensure that we set 'hasFetched' to true only once
        setHasFetched(true);
      }
    };

    fetchCommuneData();
    fetchUserMembership();
  }, [communeid, user, hasFetched, fetchMembershipStatus]); // Adding 'fetchMembershipStatus' to the dependency list

  if (loading) {
    return (
      <Layout>
        <div className="w-full flex justify-center items-center h-96">
          <p>Loading...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="w-full flex justify-center items-center h-96">
          <p className="text-red-500">{error}</p>
        </div>
      </Layout>
    );
  }

  const handleActionClick = (action) => {
    if (!isMember(communeid)) {
      alert("You need to be a member to perform this action.");
      return;
    }

    if (action === "post") {
      navigate(`/commune/${communeid}/posts/create`);
    } else if (action === "list") {
      navigate(`/commune/${communeid}/lists/create`);
    } else if (action === "event") {
      navigate(`/commune/${communeid}/events/create`);
    }
  };

  // Check if the user is admin or moderator
  const userRole = getRole(communeid);
  const canCreateEvent = userRole === "admin" || userRole === "moderator";

  return (
    <Layout>
      <CommuneNavbar name={commune.name} />
      <div className="w-full flex justify-center py-10">
        <div className="max-w-6xl w-full bg-white shadow-xl rounded-lg overflow-hidden grid grid-cols-3 gap-6">
          {/* Left Column: Commune Content */}
          <div className="col-span-2 p-6 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg shadow-md">
            {commune.commune_image && (
              <img
                src={commune.commune_image}
                alt={`${commune.name} Image`}
                className="w-full h-64 object-cover rounded-lg shadow-md"
              />
            )}
            <div className="mt-6">
              <h2 className="text-4xl font-semibold text-gray-800 mb-4">
                {commune.name}
              </h2>
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-gray-700">
                  Description
                </h3>
                <p className="text-gray-600 mt-2">{commune.description}</p>
                <div
                  className="mt-4"
                  dangerouslySetInnerHTML={{
                    __html: commune.content,
                  }}
                ></div>
              </div>
            </div>
          </div>

          {/* Right Column: Commune Details */}
          <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Location</h3>
              <p className="text-gray-600 mt-2">{commune.location}</p>
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-800">
                Commune Type
              </h3>
              <p className="text-gray-600 capitalize mt-2">
                {commune.commune_type}
              </p>
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Privacy</h3>
              <p className="text-gray-600 capitalize mt-2">{commune.privacy}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Action Bar */}
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
    </Layout>
  );
};

export default ViewCommune;
