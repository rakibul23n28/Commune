import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import Layout from "../components/Layout";
import CommuneNavbar from "../components/CommuneNavbar";
import CommuneFixedNav from "../components/CommuneFixedNav";
import { timeAgo } from "../utils/Helper";
import { useCommuneMembership } from "../context/CommuneMembershipContext";
import { useAuth } from "../context/AuthContext";

const CommuneSendRequest = () => {
  const { communeid } = useParams();
  const { user } = useAuth();
  const { fetchCommuneData, communeData } = useCommuneMembership();
  const [pendingPosts, setPendingPosts] = useState([]);
  const [pendingEvents, setPendingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadCommuneData = async () => {
      if (!communeData) {
        try {
          await fetchCommuneData(communeid);
        } catch (err) {
          setErrorMessage(
            err.response?.data?.message || "Failed to load commune data"
          );
        }
      } else {
        setLoading(false);
      }
    };
    loadCommuneData();
  }, [communeid, fetchCommuneData, communeData]);

  // Define fetchPendingCollaborations function here
  const fetchPendingCollaborations = async () => {
    if (communeid) {
      try {
        const response = await axios.get(
          `/api/collaboration/${communeid}/pending-collaborations`
        );
        const { pendingPosts, pendingEvents } = response.data;
        setPendingPosts(pendingPosts);
        setPendingEvents(pendingEvents);
      } catch (error) {
        setErrorMessage(
          "Error fetching pending collaborations. Please try again."
        );
        console.error("Error fetching collaborations:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  // Fetch pending collaborations when the component mounts
  useEffect(() => {
    fetchPendingCollaborations();
  }, [communeid]);

  // Handle collaboration actions (accept/reject)
  const handleCollaborationAction = async (collaborationId, type, status) => {
    try {
      const endpoint =
        type === "post"
          ? `/api/collaboration/${collaborationId}/post`
          : `/api/collaboration/${collaborationId}/event`;

      await axios.patch(
        endpoint,
        { status },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      console.log(
        `Updating collaboration ${collaborationId} to status: ${status}`
      );

      // Fetch the updated pending collaborations after the action
      fetchPendingCollaborations(); // Refresh the pending list
    } catch (error) {
      setErrorMessage(
        "Failed to update collaboration status. Please try again."
      );
      console.error("Error updating collaboration status:", error);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-10">Loading pending collaborations...</div>
    );
  }

  return (
    <Layout>
      <CommuneFixedNav />
      <CommuneNavbar name={communeData?.name} />
      <div className="w-1/2 mx-auto p-6 mt-6 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-4">
          Pending Collaborations for {communeData?.name}
        </h1>
        {errorMessage && (
          <div className="text-red-500 bg-red-100 p-2 rounded mb-4">
            {errorMessage}
          </div>
        )}

        {/* Pending Post Collaborations */}
        <h2 className="text-xl font-semibold mt-6">
          Pending Post Collaborations
        </h2>
        {pendingPosts.length > 0 ? (
          <ul className="space-y-4">
            {pendingPosts.map((post) => (
              <li
                key={post.collaboration_id}
                className="p-4 shadow rounded bg-gray-50"
              >
                <div className="flex items-center space-x-4">
                  <img
                    src={post.collaborating_commune_image}
                    alt={post.collaborating_commune_name}
                    className="w-12 h-12 rounded-full"
                  />
                  <h3 className="font-bold">{post.title}</h3>
                </div>
                {post.post_type === "blog" ? (
                  <div
                    className="text-gray-700 overflow-hidden max-h-96 overflow-ellipsis"
                    dangerouslySetInnerHTML={{ __html: post.description }}
                  ></div>
                ) : (
                  <p className="text-gray-700 text-wrap">{post.description}</p>
                )}
                <p className="text-sm text-gray-500">
                  Requested {timeAgo(post.created_at)} by{" "}
                  <Link to={`/commune/${post.collaborating_commune_id}`}>
                    <span className="font-semibold text-blue-500">
                      {post.collaborating_commune_name}
                    </span>
                  </Link>
                </p>
                <div className="mt-2 space-x-2">
                  <button
                    className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                    onClick={() =>
                      handleCollaborationAction(
                        post.collaboration_id,
                        "post",
                        "accepted"
                      )
                    }
                  >
                    Accept
                  </button>
                  <button
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    onClick={() =>
                      handleCollaborationAction(
                        post.collaboration_id,
                        "post",
                        "rejected"
                      )
                    }
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No pending post collaborations.</p>
        )}

        {/* Pending Event Collaborations */}
        <h2 className="text-xl font-semibold mt-6">
          Pending Event Collaborations
        </h2>
        {pendingEvents.length > 0 ? (
          <ul className="space-y-4">
            {pendingEvents.map((event) => (
              <li
                key={event.collaboration_id}
                className="p-4 shadow rounded bg-gray-50"
              >
                <div className="flex items-center space-x-4">
                  <img
                    src={event.collaborating_commune_image}
                    alt={event.collaborating_commune_name}
                    className="w-12 h-12 rounded-full"
                  />
                  <h3 className="font-bold">{event.event_name}</h3>
                </div>
                <p>{event.event_description}</p>
                <p className="text-sm text-gray-500">
                  Requested {timeAgo(event.created_at)} by{" "}
                  <Link to={`/commune/${event.collaborating_commune_id}`}>
                    <span className="font-semibold text-blue-500">
                      {event.collaborating_commune_name}
                    </span>
                  </Link>
                </p>
                <div className="mt-2 space-x-2">
                  <button
                    className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                    onClick={() =>
                      handleCollaborationAction(
                        event.collaboration_id,
                        "event",
                        "accepted"
                      )
                    }
                  >
                    Accept
                  </button>
                  <button
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    onClick={() =>
                      handleCollaborationAction(
                        event.collaboration_id,
                        "event",
                        "rejected"
                      )
                    }
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No pending event collaborations.</p>
        )}
      </div>
    </Layout>
  );
};

export default CommuneSendRequest;
