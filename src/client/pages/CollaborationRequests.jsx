import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const CollaborationRequests = () => {
  const { communeid } = useParams();
  const { user } = useAuth();
  const [collaborations, setCollaborations] = useState({
    posts: [],
    events: [],
  });

  const fetchCollaborations = async () => {
    try {
      const { data } = await axios.get(
        `/api/collaboration/${communeid}/my-requests`
      );
      setCollaborations(data);
    } catch (error) {
      console.error("Error fetching collaboration requests:", error);
    }
  };

  const handleDeleteCollaborationPost = async (postId) => {
    if (window.confirm("Are you sure you want to delete this collaboration?")) {
      try {
        const response = await axios.delete(
          `/api/collaboration/${postId}/post`,
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        );
        // alert(response.data.message);
        // Update the collaborations state after successful deletion
        setCollaborations((prevCollaborations) => ({
          ...prevCollaborations,
          posts: prevCollaborations.posts.filter(
            (post) => post.post_id !== postId
          ),
        }));
      } catch (error) {
        console.error("Error deleting collaboration:", error);
        alert(
          error.response?.data?.message ||
            "Failed to delete collaboration. Please try again."
        );
      }
    }
  };

  const handleDeleteCollaborationEvent = async (event_id) => {
    if (window.confirm("Are you sure you want to delete this collaboration?")) {
      try {
        const response = await axios.delete(
          `/api/collaboration/${event_id}/event`,
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        );
        // alert(response.data.message);
        // Update the collaborations state after successful deletion
        setCollaborations((prevCollaborations) => ({
          ...prevCollaborations,
          events: prevCollaborations.events.filter(
            (event) => event.event_id !== event_id
          ),
        }));
      } catch (error) {
        console.error("Error deleting collaboration:", error);
        alert(
          error.response?.data?.message ||
            "Failed to delete collaboration. Please try again."
        );
      }
    }
  };

  useEffect(() => {
    fetchCollaborations();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Collaboration Requests</h1>

      {/* Posts Section */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Posts</h2>
        {collaborations.posts.length > 0 ? (
          collaborations.posts.map((post) => (
            <div
              key={post.collaboration_id}
              className="border p-4 mb-4 rounded-lg flex justify-between items-center"
            >
              <div>
                <h3 className="font-semibold">{post.title}</h3>
                <p>{post.description}</p>
                <div className="text-sm text-gray-600">
                  <strong>Status:</strong> {post.collaboration_status}
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Collaborating Commune:</strong>{" "}
                  {post.collaborating_commune_name}
                </div>
              </div>
              <button
                className="bg-red-500 text-white px-4 py-2 rounded"
                onClick={() => handleDeleteCollaborationPost(post.post_id)}
              >
                Delete
              </button>
            </div>
          ))
        ) : (
          <p>No pending or rejected post collaborations.</p>
        )}
      </section>

      {/* Events Section */}
      <section className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Events</h2>
        {collaborations.events.length > 0 ? (
          collaborations.events.map((event) => (
            <div
              key={event.collaboration_id}
              className="border p-4 mb-4 rounded-lg flex justify-between items-center"
            >
              <div>
                <h3 className="font-semibold">{event.event_name}</h3>
                <p>{event.description}</p>
                <div className="text-sm text-gray-600">
                  <strong>Status:</strong> {event.collaboration_status}
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Collaborating Commune:</strong>{" "}
                  {event.collaborating_commune_name}
                </div>
              </div>
              <button
                className="bg-red-500 text-white px-4 py-2 rounded"
                onClick={() => handleDeleteCollaborationEvent(event.event_id)}
              >
                Delete
              </button>
            </div>
          ))
        ) : (
          <p>No pending or rejected event collaborations.</p>
        )}
      </section>
    </div>
  );
};

export default CollaborationRequests;
