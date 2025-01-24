import React, { useEffect, useState } from "react";
import { useSearchParams, Navigate } from "react-router-dom";
import Layout from "../components/Layout";
import axios from "axios";

const VerifyAccount = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token"); // Extract the token from the URL
  const [status, setStatus] = useState("Verifying..."); // Status of verification
  const [error, setError] = useState(null); // To capture errors

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
