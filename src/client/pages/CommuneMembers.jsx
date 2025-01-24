import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import Layout from "../components/Layout";
import CommuneNavbar from "../components/CommuneNavbar";
import CommuneFixedNav from "../components/CommuneFixedNav";
import { timeAgo } from "../utils/Helper";
import { useCommuneMembership } from "../context/CommuneMembershipContext";
import { getAuthHeaders } from "../utils/Helper";

const CommuneMembers = () => {
  const { communeid } = useParams();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const { getRole, communeData, fetchCommuneData } = useCommuneMembership();
  const [commune, setCommune] = useState(null);
  const [error, setError] = useState(null);

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

  // Fetch members data
  const fetchMembers = async () => {
    try {
      const response = await axios.get(
        `/api/commune/commune-members/${communeid}`,
        {
          headers: getAuthHeaders(),
        }
      );
      setMembers(response.data.members);
    } catch (error) {
      setErrorMessage("Failed to load members. Please try again.");
      console.error("Error fetching members:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [communeid]);

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-10">Loading members...</div>;
  }

  return (
    <Layout>
      <CommuneFixedNav />
      <CommuneNavbar name={`${commune?.name}`} />
      <div className="w-3/4 mx-auto p-6 mt-6 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-4">Commune Members</h1>
        {errorMessage && (
          <div className="text-red-500 bg-red-100 p-2 rounded mb-4">
            {errorMessage}
          </div>
        )}
        {members.length > 0 ? (
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-gray-300 px-4 py-2">
                  Profile Image
                </th>
                <th className="border border-gray-300 px-4 py-2">Username</th>
                <th className="border border-gray-300 px-4 py-2">Joined At</th>
                <th className="border border-gray-300 px-4 py-2">Role</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id} className="text-center">
                  <td className="border border-gray-300 px-4 py-2">
                    <img
                      src={member.profile_image}
                      alt={member.username}
                      className="w-12 h-12 rounded-full mx-auto"
                    />
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    <Link
                      to={`/profile/${member.username}`}
                      className="text-blue-500 hover:underline"
                    >
                      {member.username}
                    </Link>
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {timeAgo(member.joined_at)}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-500">No members found.</p>
        )}
      </div>
    </Layout>
  );
};

export default CommuneMembers;
