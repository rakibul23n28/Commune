import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import Layout from "../components/Layout";
import CommuneNavbar from "../components/CommuneNavbar";
import CommuneFixedNav from "../components/CommuneFixedNav";
import { getAuthHeaders } from "../utils/Helper";
import { useCommuneMembership } from "../context/CommuneMembershipContext";

const CommuneMemberManagement = () => {
  const { communeid } = useParams();
  const [members, setMembers] = useState([]);
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

  const fetchMembers = async () => {
    try {
      const response = await axios.get(
        `/api/commune/commune-members-manage/${communeid}`,
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

  const handleRoleChange = async (membershipId, role) => {
    console.log(membershipId);

    try {
      await axios.patch(
        `/api/commune/member-role/${membershipId}`,
        { role },
        {
          headers: getAuthHeaders(),
        }
      );
      setMembers((prevMembers) =>
        prevMembers.map((member) =>
          member.membership_id === membershipId ? { ...member, role } : member
        )
      );
    } catch (error) {
      setErrorMessage("Failed to update member role. Please try again.");
      console.error("Error updating member role:", error);
    }
  };

  const handleRemoveMember = async (membershipId) => {
    if (!window.confirm("Are you sure you want to remove this member?")) {
      return;
    }
    try {
      await axios.delete(`/api/commune/member/${membershipId}`, {
        headers: getAuthHeaders(),
      });
      setMembers((prevMembers) =>
        prevMembers.filter((member) => member.membership_id !== membershipId)
      );
    } catch (error) {
      setErrorMessage("Failed to remove member. Please try again.");
      console.error("Error removing member:", error);
    }
  };

  if (loading) {
    return <div className="text-center py-10">Loading members...</div>;
  }

  return (
    <Layout>
      <CommuneFixedNav />
      <CommuneNavbar name={`${communeData?.name}`} />
      <div className="w-3/4 mx-auto p-6 mt-6 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-4">Manage Members</h1>
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
                <th className="border border-gray-300 px-4 py-2">Role</th>
                <th className="border border-gray-300 px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.membership_id} className="text-center">
                  <td className="border border-gray-300 px-4 py-2">
                    <img
                      src={member.profile_image}
                      alt={member.username}
                      className="w-12 h-12 rounded-full mx-auto"
                    />
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    <Link to={`/profile/${member.username}`}>
                      <h2 className="text-blue-500">{member.username}</h2>
                    </Link>
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 space-x-2">
                    <button
                      className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                      onClick={() =>
                        handleRoleChange(member.membership_id, "moderator")
                      }
                    >
                      Promote to Moderator
                    </button>
                    <button
                      className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
                      onClick={() =>
                        handleRoleChange(member.membership_id, "member")
                      }
                    >
                      Demote to Member
                    </button>
                    <button
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                      onClick={() => handleRemoveMember(member.membership_id)}
                    >
                      Remove
                    </button>
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

export default CommuneMemberManagement;
