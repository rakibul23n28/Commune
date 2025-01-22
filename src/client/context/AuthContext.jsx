import React, { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";
import { getAuthHeaders } from "../utils/Helper.js";

// Create the AuthContext
export const AuthContext = createContext();

// Create the AuthProvider component to wrap the application
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to handle login
  const login = async (email, password) => {
    try {
      const { data } = await axios.post("/api/auth/login", { email, password });

      // Store user and token in localStorage
      const userWithToken = { ...data.user, token: data.token };
      setUser(userWithToken);
      localStorage.setItem("user", JSON.stringify(userWithToken));

      return { success: true };
    } catch (error) {
      console.error("Login error:", error); // Log full error
      return {
        success: false,
        message: error.response?.data?.msg || "Login failed. Please try again.",
      };
    }
  };

  // Function to handle logout
  const logout = async () => {
    try {
      await axios.post("/api/auth/logout", {});
      setUser(null);
      localStorage.removeItem("user");
      location.href = "/login";
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  // Function to retrieve user data and validate the token on initial load
  useEffect(() => {
    const initializeUser = async () => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);

        try {
          // Validate token with backend
          const { data } = await axios.get("/api/auth/validate", {
            headers: getAuthHeaders(), // Pass token in header
            withCredentials: true,
          });

          if (data.isValid) {
            setUser(parsedUser); // Set user if token is valid
          } else {
            localStorage.removeItem("user"); // Remove user if token is invalid
          }
        } catch (error) {
          console.error("Error validating token:", error);
          localStorage.removeItem("user"); // Clear user if validation fails
        }
      }
      setLoading(false); // Finish loading after check
    };

    initializeUser();
  }, []);

  // Function to handle profile update
  const updateProfile = async (editData) => {
    if (
      !editData.username ||
      !editData.first_name ||
      !editData.last_name ||
      !editData.profile_image
    ) {
      alert("Please fill out all fields.");
      return;
    }

    try {
      let formData = new FormData();

      // Append username and bio to the form data
      formData.append("username", editData.username);
      formData.append("first_name", editData.first_name);
      formData.append("last_name", editData.last_name);

      if (editData.profile_image.startsWith("data:image")) {
        const response = await fetch(editData.profile_image);
        const blob = await response.blob();
        const file = new File([blob], "profile-pic.jpg", { type: blob.type });
        formData.append("profile_image", file);
      }

      const response = await axios.put("/api/user/update", formData, {
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      // Update user and token after profile update
      const updatedUserWithToken = {
        ...response.data.user,
        token: response.data.token,
      };
      setUser(updatedUserWithToken);
      localStorage.setItem("user", JSON.stringify(updatedUserWithToken));

      return { success: true };
    } catch (error) {
      console.error("Failed to update profile:", error);
      return {
        success: false,
        message:
          error.response?.data?.msg ||
          "Profile update failed. Please try again.",
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        loading,
        setUser,
        updateProfile,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Custom hook to use authentication context
export const useAuth = () => useContext(AuthContext);
