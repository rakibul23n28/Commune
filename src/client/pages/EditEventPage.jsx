import React, { useState, useEffect } from "react";
import { useCommuneMembership } from "../context/CommuneMembershipContext";
import { useAuth } from "../context/AuthContext";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Layout from "../components/Layout";
import CommuneNavbar from "../components/CommuneNavbar";
import CommuneFixedNav from "../components/CommuneFixedNav";

const EditEventPage = () => {
  const { user } = useAuth();
  const { communeid, eventid } = useParams();
  const navigate = useNavigate();
  const { getRole, communeData } = useCommuneMembership();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [eventName, setEventName] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventImage, setEventImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const response = await axios.get(`/api/commune/event/${eventid}`);
        const eventData = response.data.event;
        setEvent(eventData);
        setEventName(eventData.event_name);
        setEventDescription(eventData.event_description);
        setEventDate(eventData.event_date);
        setImagePreview(eventData.event_image);
      } catch (err) {
        setErrorMessage("Failed to load event details.");
        console.error("Error fetching event details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [communeid, eventid]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    setEventImage(file);

    if (file) {
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImagePreview(null);
    }
  };

  const handleEditEvent = async (e) => {
    e.preventDefault();

    if (!eventName || !eventDescription || !eventDate) {
      setErrorMessage("All fields are required.");
      return;
    }

    try {
      const role = getRole(communeid);
      if (role) {
        const formData = new FormData();
        formData.append("eventName", eventName);
        formData.append("eventDescription", eventDescription);
        formData.append("eventDate", eventDate);
        if (eventImage) {
          formData.append("eventImage", eventImage);
        }

        await axios.put(`/api/commune/event/${eventid}`, formData, {
          headers: {
            Authorization: `Bearer ${user.token}`,
            "Content-Type": "multipart/form-data",
          },
        });

        navigate(`/commune/${communeid}`);
      } else {
        setErrorMessage(
          "You must be a member of this commune to edit an event."
        );
      }
    } catch (error) {
      setErrorMessage("Error updating event. Please try again.");
      console.error("Error updating event:", error);
    }
  };

  if (loading) {
    return <div>Loading event details...</div>;
  }

  return (
    <Layout>
      <CommuneFixedNav />
      <CommuneNavbar name={communeData?.name} />
      <div className="w-1/2 mx-auto p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">Edit Event</h2>
        {errorMessage && (
          <div className="text-red-500 mb-4">{errorMessage}</div>
        )}
        <div className="bg-white p-6 border rounded-lg shadow-md">
          <form onSubmit={handleEditEvent}>
            <div className="mb-4">
              <label
                htmlFor="eventName"
                className="block text-sm font-medium text-gray-700"
              >
                Event Name
              </label>
              <input
                id="eventName"
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                Event Description
              </label>
              <textarea
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring focus:ring-blue-300 focus:outline-none"
                rows="4"
                required
              ></textarea>
            </div>

            <div className="mb-4">
              <h1>
                Previous Event Date:{" "}
                {new Date(event.event_date).toLocaleString()}
              </h1>
              <label
                htmlFor="eventDate"
                className="block text-sm font-medium text-gray-700"
              >
                Event Date
              </label>
              <input
                id="eventDate"
                type="datetime-local"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="eventImage"
                className="block text-sm font-medium text-gray-700"
              >
                Event Image
              </label>
              <input
                id="eventImage"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
              {imagePreview && (
                <div className="mt-4">
                  <p className="text-gray-700 text-sm mb-2">Image Preview:</p>
                  <img
                    src={imagePreview}
                    alt="Event Preview"
                    className="w-32 h-32 object-cover rounded-md"
                  />
                </div>
              )}
            </div>

            <div className="mb-4">
              <button
                type="submit"
                className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default EditEventPage;
