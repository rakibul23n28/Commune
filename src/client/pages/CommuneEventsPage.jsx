import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import Layout from "../components/Layout";
import CommuneNavbar from "../components/CommuneNavbar";
import CommuneFixedNav from "../components/CommuneFixedNav";
import { useCommuneMembership } from "../context/CommuneMembershipContext";
import { useAuth } from "../context/AuthContext";

const CommuneEventsPage = () => {
  const { communeid } = useParams();
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const { fetchCommuneData, communeData, getRole } = useCommuneMembership();
  const [commune, setCommune] = useState(null);
  const [showOptions, setShowOptions] = useState(null);
  const [showCollaboration, setShowCollaboration] = useState(false);
  const [userCommunes, setUserCommunes] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [collaborativeEvents, setCollaborativeEvents] = useState([]);

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
        setCommune(communeData);
      }
    };
    loadCommuneData();
  }, [communeid, fetchCommuneData, communeData]);

  const fetchCommuneEvents = async () => {
    try {
      const response = await axios.get(`/api/commune/${communeid}/events`);
      setEvents(response.data.events);
    } catch (error) {
      setErrorMessage("Error fetching events. Please try again.");
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCollaborativeEvents = async () => {
    try {
      const response = await axios.get(
        `/api/collaboration/${communeid}/events`
      );

      setCollaborativeEvents(response.data.collaborativeEvents);
    } catch (error) {
      console.error("Error fetching collaborative events:", error);
    }
  };

  useEffect(() => {
    fetchCommuneEvents();
    fetchCollaborativeEvents();
  }, [communeid]);

  const handleOptionsClick = (eventId) => {
    setShowOptions((prev) => (prev === eventId ? null : eventId));
  };

  const handleEditEvent = (eventId) => {
    location.href = `/commune/edit/${communeid}/${eventId}/event`;
  };

  const makeCollaboration = async (commune_id_2, event_id) => {
    try {
      const response = await axios.post(
        `/api/collaboration/event`,
        {
          commune_id_1: communeid, // Current commune ID
          commune_id_2, // Selected commune ID
          event_id,
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      alert(response.data.message);
      setShowCollaboration(false);
    } catch (error) {
      console.error("Error creating collaboration:", error);
      alert(
        error.response?.data?.message ||
          "Failed to create collaboration. Please try again."
      );
    }
  };
  const fetchUserCommunes = async () => {
    try {
      const response = await axios.get(
        `/api/user/communes/info/${user.id}?commune_id=${communeid}`
      );
      setUserCommunes(response.data.communes);
    } catch (error) {
      console.error("Error fetching user communes:", error);
    }
  };
  const handleCollaborationClick = (event_id) => {
    setSelectedEventId(event_id); // Set the selected post ID
    fetchUserCommunes();
    setShowCollaboration(true);
  };
  const closeCollaborationPopup = () => {
    setShowCollaboration(false);
  };

  const handleDeleteEvent = async (eventId) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        await axios.delete(`/api/commune/event/${eventId}`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });
        setEvents(events.filter((event) => event.event_id !== eventId));
      } catch (error) {
        setErrorMessage("Error deleting event. Please try again.");
        console.error("Error deleting event:", error);
      }
    }
  };
  const handleDeleteCollaboration = async (eventId) => {
    if (window.confirm("Are you sure you want to delete this collaboration?")) {
      try {
        const response = await axios.delete(
          `/api/collaboration/${eventId}/event`,
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        );
        setCollaborativeEvents(
          collaborativeEvents.filter((event) => event.event_id !== eventId)
        );
      } catch (error) {
        console.error("Error deleting collaboration:", error);
        alert(
          error.response?.data?.message ||
            "Failed to delete collaboration. Please try again."
        );
      }
    }
  };

  if (loading) {
    return <div>Loading events...</div>;
  }

  return (
    <Layout>
      <CommuneFixedNav />
      <CommuneNavbar name={`${commune?.name}`} />
      {errorMessage && <div className="text-red-500 mb-4">{errorMessage}</div>}
      <div className="mx-40 flex bg-white rounded-lg shadow-md -z-9">
        <div className="flex w-full space-x-6">
          {/* Upcoming Events (2 Columns) */}
          <div className="w-2/3 bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">Upcoming Events</h2>
            <div className="grid grid-cols-2 gap-6">
              {events.map((event) => (
                <div
                  key={event.event_id}
                  className="bg-white p-6 border rounded-lg shadow-md relative h-fit"
                >
                  <Link to={`/commune/${communeid}/event/${event.event_id}`}>
                    <h3 className="text-xl font-semibold mt-4">
                      {event.event_name}
                    </h3>
                  </Link>
                  <p className="text-gray-600">
                    Organized by {event.created_by_username} on{" "}
                    <span className="font-semibold">
                      {new Date(event.event_date).toLocaleDateString()}
                    </span>
                    <span className="text-gray-600 text-sm">
                      {new Date(event.event_date).toLocaleTimeString()}
                    </span>
                  </p>
                  {event.event_image && (
                    <img
                      src={event.event_image}
                      alt={event.event_name}
                      className="mt-4 w-full max-h-48 object-cover rounded"
                    />
                  )}
                  <div className="mt-4 text-sm">
                    {event.event_description.length > 100 ? (
                      <>
                        {event.event_description.slice(0, 100)}...
                        <Link
                          to={`/commune/${communeid}/event/${event.event_id}`}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          Read more
                        </Link>
                      </>
                    ) : (
                      event.event_description
                    )}
                  </div>

                  <div className="absolute top-2 right-2">
                    <button
                      onClick={() => handleCollaborationClick(event.event_id)}
                      className="text-green-500 hover:text-green-700 p-2"
                    >
                      Collaboration
                    </button>
                    <button
                      onClick={() => handleOptionsClick(event.event_id)}
                      className="text-gray-600 hover:text-gray-800 p-2"
                    >
                      <i className="fas fa-ellipsis-v"></i>
                    </button>
                    {(getRole(communeid) === "admin" ||
                      user.id === event.created_by) && (
                      <>
                        {showOptions === event.event_id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-10">
                            <button
                              onClick={() => handleEditEvent(event.event_id)}
                              className="block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteEvent(event.event_id)}
                              className="block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Collaborative Events (1 Column) */}
          <div className="w-1/3 bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">Collaborative Events</h2>
            {collaborativeEvents.length > 0 ? (
              <div className="space-y-6">
                {collaborativeEvents.map((event) => (
                  <div
                    key={event.event_id}
                    className="bg-white p-6 border rounded-lg shadow-md relative"
                  >
                    {(getRole(communeid) === "admin" ||
                      getRole(communeid) === "moderator") && (
                      <button
                        onClick={() =>
                          handleDeleteCollaboration(event.event_id)
                        }
                        className="block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100"
                      >
                        <i className="fas fa-trash mr-2"></i> Collaboration
                      </button>
                    )}
                    <Link
                      to={`/commune/${event.collaborating_commune_id}/event/${event.event_id}`}
                    >
                      <h3 className="text-xl font-semibold">
                        {event.event_name}
                      </h3>
                    </Link>
                    <p className="text-gray-600">
                      Collaborating with{" "}
                      <Link to={`/commune/${event.collaborating_commune_id}`}>
                        <strong className="text-blue-500">
                          {event.collaborating_commune_name}
                        </strong>
                      </Link>
                    </p>
                    <img
                      src={
                        event.collaborating_commune_image ||
                        "/default-commune.png"
                      }
                      alt={event.collaborating_commune_name}
                      className="mt-4 w-10 h-10 rounded-full"
                    />
                    <p className="mt-2">
                      Organized on {new Date(event.event_date).toLocaleString()}
                    </p>
                    <div className="mt-4 text-sm">
                      {event.event_description.length > 100 ? (
                        <>
                          {event.event_description.slice(0, 100)}...
                          <Link
                            to={`/commune/${event.collaborating_commune_id}/event/${event.event_id}`}
                            className="text-blue-500 hover:text-blue-700"
                          >
                            Read more
                          </Link>
                        </>
                      ) : (
                        event.event_description
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No collaborative events found.</p>
            )}
          </div>
        </div>
      </div>

      {/* Collaboration Popup */}
      {showCollaboration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-3/4 max-h-96 overflow-y-auto relative">
            <button
              onClick={closeCollaborationPopup}
              className="absolute top-3 right-3 bg-red-500 text-white px-4 py-2 rounded-full text-sm hover:bg-red-600 transition duration-200"
            >
              Close
            </button>
            <h2 className="text-xl font-bold mb-4">
              Collaborate this post with your communes
            </h2>
            {userCommunes.length > 0 ? (
              <ul className="space-y-4">
                {userCommunes.map((commune) => (
                  <li
                    key={commune.commune_id}
                    className="flex justify-between space-x-4 shadow p-2 rounded"
                  >
                    <div className="space-y-2">
                      <div className="flex space-x-4">
                        <img
                          src={commune.commune_image || "/default-commune.png"}
                          alt={commune.commune_name}
                          className="w-10 h-10 rounded-full"
                        />
                        <p className="text-lg font-medium">
                          {commune.commune_name} ({commune.role})
                        </p>
                      </div>
                      <h2>{commune.description}</h2>
                    </div>
                    <div className="flex space-x-4">
                      <button
                        onClick={() =>
                          makeCollaboration(commune.commune_id, selectedEventId)
                        }
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                      >
                        Collaborate
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No communes found.</p>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
};

export default CommuneEventsPage;
