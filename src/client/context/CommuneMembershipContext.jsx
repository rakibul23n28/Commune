import React, { createContext, useState, useContext } from "react";
import { getAuthHeaders } from "../utils/Helper.js";
import axios from "axios";

// Create the CommuneMembershipContext
const CommuneMembershipContext = createContext();

export const CommuneMembershipProvider = ({ children }) => {
  // State to store membership status for each commune
  const [membershipStatus, setMembershipStatus] = useState({});

  // Fetch membership status for a user in a specific commune
  const fetchMembershipStatus = async (communeId, userId) => {
    try {
      const response = await axios.get(`/api/commune/${communeId}/${userId}`, {
        headers: getAuthHeaders(),
      });

      // Extract the role from the response and update the membership status
      const { role } = response.data.data;
      updateMembership(communeId, role);
    } catch (error) {
      console.error("Error fetching membership status:", error);
      // Optionally handle error status (e.g., set error state or retry logic)
    }
  };

  // Update the membership status in the state for a specific commune
  const updateMembership = (communeId, role) => {
    setMembershipStatus((prevStatus) => ({
      ...prevStatus,
      [communeId]: role || null, // Ensure role is either a valid role or null
    }));
  };

  // Check if the user is a member of the commune
  const isMember = (communeId) => {
    return membershipStatus[communeId] ? true : false; // Returns true if member, else false
  };

  // Check if the user has a specific role in a commune (admin, member, etc.)
  const getRole = (communeId) => {
    return membershipStatus[communeId] || null; // Returns the role or null if not a member
  };

  return (
    <CommuneMembershipContext.Provider
      value={{
        membershipStatus,
        fetchMembershipStatus,
        updateMembership,
        isMember,
        getRole, // Exposing getRole method for role-specific checks
      }}
    >
      {children}
    </CommuneMembershipContext.Provider>
  );
};

// Custom hook to access CommuneMembershipContext values
export const useCommuneMembership = () => useContext(CommuneMembershipContext);
