import React, { useEffect, useState, useRef } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useCommuneMembership } from "../context/CommuneMembershipContext";
import { useAuth } from "../context/AuthContext";

const OnlyAdmin = ({ children }) => {
  const { communeid } = useParams();
  const { getRole, fetchMembershipStatus, membershipStatus } =
    useCommuneMembership();
  const { user } = useAuth();

  const [localLoading, setLocalLoading] = useState(true);
  const role = getRole(communeid);

  const hasLogged = useRef(false);

  useEffect(() => {
    if (role === null && user && communeid) {
      setLocalLoading(true);
      fetchMembershipStatus(communeid, user.id).finally(() =>
        setLocalLoading(false)
      );
    } else {
      setLocalLoading(false);
    }
  }, [role, communeid, user, fetchMembershipStatus]);

  // Log only once
  useEffect(() => {
    if (!hasLogged.current) {
      hasLogged.current = true;
    }
  }, [membershipStatus, communeid, role]);

  if (!user || !communeid) {
    return <Navigate to="/login" replace />;
  }

  if (localLoading) {
    return <div>Loading...</div>;
  }

  if (role === "admin") {
    return children;
  }

  return <Navigate to={`/commune/${communeid}`} replace />;
};

export default OnlyAdmin;
