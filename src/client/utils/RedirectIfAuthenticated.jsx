import { useEffect, useContext } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const RedirectIfAuthenticated = ({ children }) => {
  const { user, loading } = useAuth(); // Using AuthContext to get current user status
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      if (loading) return null;
      if (user) {
        navigate("/");
      } else {
        localStorage.removeItem("user"); // Clean up if the token is invalid
      }
    };

    checkAuth();
  }, [user, navigate]); // Re-run effect when user context changes

  return <>{children}</>; // Render children if the user is not authenticated
};

export default RedirectIfAuthenticated;
