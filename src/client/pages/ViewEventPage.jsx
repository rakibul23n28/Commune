import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import Layout from "../components/Layout";
import CommuneNavbar from "../components/CommuneNavbar";
import CommuneFixedNav from "../components/CommuneFixedNav";
import { useAuth } from "../context/AuthContext";
import { useCommuneMembership } from "../context/CommuneMembershipContext";

const ViewEventPage = () => {
  const { communeid, eventid } = useParams();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const { getRole, communeData } = useCommuneMembership();

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const response = await axios.get(
          `/api/commune/${communeid}/event/${eventid}`
        );
        setEvent(response.data.event);
      } catch (error) {
        setErrorMessage("Error fetching event details.");
        console.error("Error fetching event details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [communeid, eventid]);

  const handleEditEvent = () => {
    location.href = `/commune/edit/${communeid}/${eventid}/event`;
  };

  const handleDeleteEvent = async () => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        await axios.delete(`/api/commune/event/${eventid}`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });
        alert("Event deleted successfully.");
        location.href = `/commune/${communeid}/events`; // Redirect to events page
      } catch (error) {
        setErrorMessage("Error deleting event. Please try again.");
        console.error("Error deleting event:", error);
      }
    }
  };

  if (loading) {
    return <div className="text-black text-xl">Loading event details...</div>;
  }

  return (
    <Layout>
      <CommuneFixedNav />
      <CommuneNavbar name={`${communeData?.name}`} />
      {errorMessage && <div className="text-red-500 mb-4">{errorMessage}</div>}

      <div className="mx-auto my-12 bg-white rounded-lg shadow-xl p-8 max-w-4xl transform transition duration-500 hover:scale-105">
        <h2 className="text-4xl font-extrabold text-gray-900 mb-6">
          {event?.event_name}
        </h2>

        {event?.event_image && (
          <img
            src={event?.event_image}
            alt={event?.event_name}
            className="w-full h-80 object-cover rounded-lg mb-6 shadow-lg transition transform hover:scale-105"
          />
        )}

        <p className="text-lg text-gray-700 mb-4">
          <strong className="font-semibold">Organized by:</strong>{" "}
          {event?.created_by_username}
        </p>
        <p className="text-lg text-gray-700 mb-4">
          <strong className="font-semibold">Event Date:</strong>{" "}
          {new Date(event?.event_date).toLocaleString()}
        </p>

        <div className="mt-6 mb-8">
          <h3 className="text-2xl font-semibold text-gray-800">
            Event Description
          </h3>
          <p className="text-lg text-gray-600">{event?.event_description}</p>
        </div>

        {(user.id === event?.created_by || user.role === "admin") && (
          <div className="mt-8 flex space-x-6">
            <button
              onClick={handleEditEvent}
              className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition duration-300 transform hover:scale-105"
            >
              Edit Event
            </button>
            <button
              onClick={handleDeleteEvent}
              className="bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 transition duration-300 transform hover:scale-105"
            >
              Delete Event
            </button>
          </div>
        )}

        <div className="mt-8">
          <Link
            to={`/commune/${communeid}/events`}
            className="text-blue-600 hover:text-blue-700 text-lg font-semibold"
          >
            Back to Events
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default ViewEventPage;
