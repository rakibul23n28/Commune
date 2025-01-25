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

  // Character count state
  const maxDescriptionLength = 180;
  const [descriptionLength, setDescriptionLength] = useState(0);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const response = await axios.get(`/api/commune/event/${eventid}`);
        const eventData = response.data.event;
        setEvent(eventData);
        setEventName(eventData.event_name);
        setEventDescription(eventData.event_description);

        // Ensure the event date is formatted correctly for the datetime-local input
        const formattedDate = new Date(eventData.event_date)
          .toISOString()
          .slice(0, 16); // 'YYYY-MM-DDTHH:MM'
        setEventDate(formattedDate);

        setImagePreview(eventData.event_image);
        setDescriptionLength(eventData.event_description.length);
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

  const handleDescriptionChange = (e) => {
    const newDescription = e.target.value;
    if (newDescription.length <= maxDescriptionLength) {
      setEventDescription(newDescription);
      setDescriptionLength(newDescription.length);
    }
  };

  const getDescriptionCounterColor = () => {
    if (descriptionLength === maxDescriptionLength) {
      return "text-black"; // Change to black when max length is reached
    } else if (descriptionLength > maxDescriptionLength * 0.75) {
      return "text-black"; // Change to black when description is approaching max
    } else {
      return "text-black"; // Use black text for normal description length
    }
  };

  if (loading) {
    return <div className="text-black">Loading event details...</div>;
  }

  return (
    <Layout>
      <CommuneFixedNav />
      <CommuneNavbar name={communeData?.name} />
      <div className="w-full md:w-1/2 mx-auto p-8 bg-white rounded-lg shadow-xl">
        <h2 className="text-3xl font-extrabold text-black mb-4">Edit Event</h2>
        {errorMessage && (
          <div className="text-red-500 mb-4 font-semibold">{errorMessage}</div>
        )}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <form onSubmit={handleEditEvent}>
            <div className="mb-6">
              <label
                htmlFor="eventName"
                className="block text-lg font-medium text-black"
              >
                Event Name
              </label>
              <input
                id="eventName"
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                className="mt-2 block w-full p-3 border-2 border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-400 text-black bg-white"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-lg font-medium text-black mb-2">
                Event Description
              </label>
              <textarea
                value={eventDescription}
                onChange={handleDescriptionChange}
                className="w-full p-3 border-2 border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-400 text-black bg-white"
                rows="4"
                required
              ></textarea>
              <div className="mt-2 text-right">
                <span className={getDescriptionCounterColor()}>
                  {descriptionLength}/{maxDescriptionLength}
                </span>
              </div>
            </div>

            <div className="mb-6">
              <h1 className="text-lg font-medium text-black mb-2">
                Previous Event Date:{" "}
                {new Date(event.event_date).toLocaleString()}
              </h1>
              <label
                htmlFor="eventDate"
                className="block text-lg font-medium text-black"
              >
                Event Date
              </label>
              <input
                id="eventDate"
                type="datetime-local"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="mt-2 block w-full p-3 border-2 border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-400 text-black bg-white"
                required
              />
            </div>

            <div className="mb-6">
              <label
                htmlFor="eventImage"
                className="block text-lg font-medium text-black"
              >
                Event Image
              </label>
              <input
                id="eventImage"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="mt-2 block w-full p-3 border-2 border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-400 text-black bg-white"
              />
              {imagePreview && (
                <div className="mt-4">
                  <p className="text-black text-sm mb-2">Image Preview:</p>
                  <img
                    src={imagePreview}
                    alt="Event Preview"
                    className="w-32 h-32 object-cover rounded-md shadow-md"
                  />
                </div>
              )}
            </div>

            <div className="mb-4">
              <button
                type="submit"
                className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
