import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom"; // Import useNavigate
import Layout from "../components/Layout";
import { timeAgo } from "../utils/Helper";
import { useAuth } from "../context/AuthContext";

const Home = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate(); // Initialize navigate

  // Fetch notes from the backend
  // useEffect(() => {
  //   const fetchNotes = async () => {
  //     try {
  //       const response = await axios.get("/api/notes/data", {
  //         headers: {
  //           Authorization: `Bearer ${localStorage.getItem("token")}`, // Assuming JWT is stored in localStorage
  //         },
  //       });
  //       setNotes(response.data.notes);
  //     } catch (err) {
  //       console.error("Error fetching notes:", err);
  //       setError("Failed to load notes.");
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchNotes();
  // }, []);

  // Navigate to note page

  // Navigate to profile page
  const handleUsernameClick = (userId) => {
    navigate(`/profile/${userId}`);
  };

  return (
    <Layout>
      <div className="flex justify-center mt-8"></div>
    </Layout>
  );
};

export default Home;
