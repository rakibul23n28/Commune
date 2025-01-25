import React, { useEffect, useState } from "react";
import { useSearchParams, Navigate, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import axios from "axios";
import { useAuth } from "../context/AuthContext.jsx";

const VerifyAccount = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token"); // Extract the token from the URL
  const [status, setStatus] = useState("Verifying..."); // Status of verification
  const [error, setError] = useState(null); // To capture errors
  const navigate = useNavigate();
  const { setUser } = useAuth();

  useEffect(() => {
    console.log(token);

    const verifyToken = async () => {
      if (!token) {
        setStatus("Invalid verification link.");
        return;
      }

      try {
        // Send the token to the backend for verification
        const response = await axios.post("/api/auth/verify", {
          token,
        });
        if (response.data.success) {
          console.log(response.data);

          // Update user and token after profile update
          const updatedUserWithToken = {
            ...response.data.user,
            token: response.data.token,
          };
          setUser(updatedUserWithToken);
          console.log(updatedUserWithToken);

          localStorage.setItem("user", JSON.stringify(updatedUserWithToken));
          navigate("/");
          setStatus("Account verified successfully");
          // Handle successful login or registration (e.g., redirect, store token, etc.)
        } else {
          console.error(
            "Error logging in or registering:",
            response.data.message
          );
        }
        setStatus(response.data.msg); // Success message from the backend
      } catch (error) {
        // Handle errors and set error messages
        if (error.response) {
          setStatus("Verification failed.");
          setError(error.response.data.msg);
        } else {
          setStatus("An error occurred.");
          setError("Could not connect to the server.");
        }
      }
    };

    verifyToken();
  }, [token]);

  return (
    <Layout>
      <div
        style={{
          fontFamily: "Arial, sans-serif",
          textAlign: "center",
          padding: "50px",
        }}
      >
        <h2>Email Verification</h2>
        <p>{status}</p>
        {error && <p style={{ color: "red" }}>{error}</p>}
        {status === "Account verified successfully" && <Navigate to="/login" />}
      </div>
    </Layout>
  );
};

export default VerifyAccount;
