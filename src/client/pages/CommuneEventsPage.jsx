import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
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

  useEffect(() => {
    fetchCommuneEvents();
  }, [communeid]);

  const handleOptionsClick = (eventId) => {
    setShowOptions((prev) => (prev === eventId ? null : eventId));
  };

  const handleEditEvent = (eventId) => {
    location.href = `/commune/edit/${communeid}/${eventId}/event`;
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

  if (loading) {
    return <div>Loading events...</div>;
  }

  return (
    <Layout>
      <CommuneFixedNav />
      <CommuneNavbar name={`${commune?.name}`} />
      <div className="w-1/2 mx-auto p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">Upcoming Events</h2>
        {errorMessage && (
          <div className="text-red-500 mb-4">{errorMessage}</div>
        )}
        <div className="space-y-6">
          {events.map((event) => (
            <div
              key={event.event_id}
              className="bg-white p-6 border rounded-lg shadow-md relative"
            >
              <h3 className="text-xl font-semibold">{event.event_name}</h3>
              <p className="text-gray-600">
                Organized by {event.created_by_username} on{" "}
                {new Date(event.event_date).toLocaleString()}
              </p>
              {event.event_image && (
                <img
                  src={event.event_image}
                  alt={event.event_name}
                  className="mt-4 w-full rounded"
                />
              )}
              <div className="mt-4">{event.event_description}</div>

              {(getRole(communeid) === "admin" ||
                user.id === event.created_by) && (
                <div className="absolute top-2 right-2">
                  <button
                    onClick={() => handleOptionsClick(event.event_id)}
                    className="text-gray-600 hover:text-gray-800 p-2"
                  >
                    <i className="fas fa-ellipsis-v"></i>
                  </button>
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
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default CommuneEventsPage;
