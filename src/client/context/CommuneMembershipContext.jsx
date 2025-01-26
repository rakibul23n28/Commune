import React, { createContext, useState, useContext } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

// Create the CommuneMembershipContext
const CommuneMembershipContext = createContext();

export const CommuneMembershipProvider = ({ children }) => {
  const [membershipStatus, setMembershipStatus] = useState({});
  const [communeData, setCommuneData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Fetch the commune data from the server
  const fetchCommuneData = async (communeId) => {
    try {
      const response = await axios.get(
        `/api/commune/communes/info/${communeId}`
      );
      setCommuneData(response.data.commune); // Update commune data state
    } catch (error) {
      console.error("Error fetching commune data:", error);
    } finally {
      setLoading(false); // Set loading to false once the request is complete
    }
  };

  const fetchMembershipStatus = async (communeId, userId) => {
    try {
      const response = await axios.get(
        `/api/commune/membership/${communeId}/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      const { role } = response.data.data;
      // Only update state if role is different
      if (membershipStatus[communeId] !== role) {
        updateMembership(communeId, role);
      }

      return role; // Return role for direct use in the component if needed
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.warn(`User is not a member of commune ${communeId}`);
        updateMembership(communeId, null);
      } else {
        console.error("Error fetching membership status:", error);
      }
      throw error; // Rethrow for handling in the calling component
    }
  };

  // Update the membership status in the state for a specific commune
  const updateMembership = (communeId, role) => {
    setMembershipStatus((prevStatus) => ({
      ...prevStatus,
      [communeId]: role || null,
    }));
  };

  // Join a commune and update the state
  const joinCommune = async (communeId, userId) => {
    try {
      const response = await axios.post(
        `/api/commune/membership/${communeId}/join`,
        {}, // Empty data object since you only need headers
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      if (response.data.data.status === "private") {
        alert("Private Commune: Wait until approved.");
      }

      const { role } = response.data.data; // Assume response contains the role
      updateMembership(communeId, role);

      return role; // Return role for further use if needed
    } catch (error) {
      if (error.response && error.response.data?.message) {
        alert(error.response.data.message);
      }
      console.error("Error joining commune:", error);
      throw error; // Rethrow to handle in the calling component
    }
  };

  // Leave a commune and update the state
  const leaveCommune = async (communeId) => {
    try {
      await axios.delete(`/api/commune/membership/${communeId}/delete`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      updateMembership(communeId, null); // Remove membership status for this commune
      alert(`Successfully left the commune ${communeId}`);
    } catch (error) {
      if (error.response && error.response.data?.message) {
        alert(error.response.data.message);
      }
      console.error("Error leaving commune:", error);
      throw error; // Rethrow for handling in the calling component
    }
  };

  // Check if the user is a member of the commune
  const isMember = (communeId) => {
    return Boolean(membershipStatus[communeId]);
  };

  // Get the role of the user in a specific commune
  const getRole = (communeId) => {
    return membershipStatus[communeId] || null;
  };

  return (
    <CommuneMembershipContext.Provider
      value={{
        membershipStatus,
        fetchCommuneData, // Expose fetchCommuneData function
        communeData,
        loading, // Expose loading state
        fetchMembershipStatus,
        updateMembership,
        joinCommune, // Added joinCommune method
        leaveCommune, // Added leaveCommune method
        isMember,
        getRole,
      }}
    >
      {children}
    </CommuneMembershipContext.Provider>
  );
};

// Custom hook to access CommuneMembershipContext values
export const useCommuneMembership = () => useContext(CommuneMembershipContext);
