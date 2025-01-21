import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import Layout from "../components/Layout";
import CommuneNavbar from "../components/CommuneNavbar";
import CommuneFixedNav from "../components/CommuneFixedNav";
import { getAuthHeaders, timeAgo } from "../utils/Helper";
import { useCommuneMembership } from "../context/CommuneMembershipContext";

const CommuneJoinMember = () => {
  const { communeid } = useParams();
  const [joinRequests, setJoinRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const { fetchCommuneData, communeData } = useCommuneMembership();

  useEffect(() => {
    const loadCommuneData = async () => {
      if (!communeData) {
        try {
          await fetchCommuneData(communeid);
        } catch (err) {
          setErrorMessage(
            err.response?.data?.message || "Failed to load commune data."
          );
        }
      }
    };
    loadCommuneData();
  }, [communeid, fetchCommuneData, communeData]);

  const fetchJoinRequests = async () => {
    try {
      const response = await axios.get(
        `/api/commune/join-requests/${communeid}`
      );
      setJoinRequests(response.data.members);
    } catch (error) {
      setErrorMessage("Failed to load join requests. Please try again.");
      console.error("Error fetching join requests:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJoinRequests();
  }, [communeid]);

  const handleJoinStatus = async (membershipId, status) => {
    try {
      console.log(membershipId, status);

      await axios.patch(
        `/api/commune/join-status/${membershipId}`,
        {
          status,
        },
        {
          headers: getAuthHeaders(),
        }
      );
      setJoinRequests((prevRequests) =>
        prevRequests.filter((request) => request.membership_id !== membershipId)
      );
    } catch (error) {
      setErrorMessage("Failed to update join status. Please try again.");
      console.error("Error updating join status:", error);
    }
  };

  if (loading) {
    return <div className="text-center py-10">Loading join requests...</div>;
  }

  return (
    <Layout>
      <CommuneFixedNav />
      <CommuneNavbar name={`${communeData?.name}`} />
      <div className="w-3/4 mx-auto p-6 mt-6 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-4">Join Requests</h1>
        {errorMessage && (
          <div className="text-red-500 bg-red-100 p-2 rounded mb-4">
            {errorMessage}
          </div>
        )}
        {joinRequests.length > 0 ? (
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-gray-300 px-4 py-2">
                  Profile Image
                </th>
                <th className="border border-gray-300 px-4 py-2">Username</th>
                <th className="border border-gray-300 px-4 py-2">Joined At</th>
                <th className="border border-gray-300 px-4 py-2">
                  Join Status
                </th>
                <th className="border border-gray-300 px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {joinRequests.map((request) => (
                <tr key={request.membership_id} className="text-center">
                  <td className="border border-gray-300 px-4 py-2">
                    <img
                      src={request.profile_image}
                      alt={request.username}
                      className="w-12 h-12 rounded-full mx-auto"
                    />
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    <Link to={`/profile/${request.username}`}>
                      <h2 className="text-blue-500">{request.username}</h2>
                    </Link>
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {timeAgo(request.joined_at)}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {request.join_status.charAt(0).toUpperCase() +
                      request.join_status.slice(1)}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 space-x-2">
                    <button
                      className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                      onClick={() =>
                        handleJoinStatus(request.membership_id, "approved")
                      }
                    >
                      Approve
                    </button>
                    <button
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                      onClick={() =>
                        handleJoinStatus(request.membership_id, "rejected")
                      }
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-500">No join requests found.</p>
        )}
      </div>
    </Layout>
  );
};

export default CommuneJoinMember;
