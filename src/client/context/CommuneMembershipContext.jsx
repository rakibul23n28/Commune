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

  // Fetch membership status for a user in a specific commune
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
      updateMembership(communeId, role);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        // Handle 404 error gracefully
        console.warn(`User is not a member of commune ${communeId}`);
        updateMembership(communeId, null); // Set membership status to null
      } else {
        console.error("Error fetching membership status:", error);
      }
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

      const { role } = response.data.data; // Assume response contains the role
      updateMembership(communeId, role);

      return role; // Return role for further use if needed
    } catch (error) {
      console.error("Error joining commune:", error);
      throw error; // Rethrow to handle in the calling component
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
