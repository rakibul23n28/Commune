import React, { useState, useEffect } from "react";
import { useCommuneMembership } from "../context/CommuneMembershipContext";
import { useAuth } from "../context/AuthContext";
import { useParams } from "react-router-dom";
import axios from "axios";
import Layout from "../components/Layout";
import CommuneNavbar from "../components/CommuneNavbar";
import CommuneFixedNav from "../components/CommuneFixedNav";

const CreateEventPage = () => {
  const { user } = useAuth();
  const { communeid } = useParams();
  const { getRole, fetchCommuneData, communeData } = useCommuneMembership();
  const [commune, setCommune] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [eventName, setEventName] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventImage, setEventImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    const loadCommuneData = async () => {
      if (!communeData) {
        try {
          await fetchCommuneData(communeid);
        } catch (err) {
          setErrorMessage(
            err.response?.data?.message || "Failed to load commune data"
          );
        } finally {
          setLoading(false);
        }
      }
    };

    loadCommuneData();
  }, [communeid, fetchCommuneData, communeData]);

  useEffect(() => {
    if (communeData) {
      setCommune(communeData);
    }
  }, [communeData]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    setEventImage(file);

    if (file) {
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImagePreview(null);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();

    if (!eventName || !eventDescription || !eventDate) {
      setErrorMessage("All fields are required");
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

        const response = await axios.post(
          `/api/commune/create/${communeid}/event`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );

        location.href = `/commune/${commune?.commune_id}/events`;
      } else {
        setErrorMessage(
          "You must be a member of this commune to create an event."
        );
      }
    } catch (error) {
      setErrorMessage("Error creating event. Please try again.");
      console.error("Error creating event:", error);
    }
  };

  if (loading) {
    return <div>Loading commune data...</div>;
  }

  return (
    <Layout>
      <CommuneFixedNav />
      <CommuneNavbar name={commune?.name} />
      <div className="w-1/2 mx-auto p-6 bg-white rounded-lg shadow-md">
        {commune && (
          <div className="max-w-sm mx-auto mb-6 p-4 border rounded-lg shadow-md bg-white">
            <h1 className="text-2xl font-semibold mb-2">{commune.name}</h1>
            <p className="text-sm text-gray-600">{commune.description}</p>
            <div className="mt-4">
              <p>
                <strong>Location:</strong> {commune.location || "Not provided"}
              </p>
              <p>
                <strong>Privacy:</strong> {commune.privacy}
              </p>
              <p>
                <strong>Commune Type:</strong> {commune.commune_type}
              </p>
            </div>
          </div>
        )}
        <h2 className="text-2xl font-bold mb-4">Create an Event</h2>
        {errorMessage && (
          <div className="text-red-500 mb-4">{errorMessage}</div>
        )}
        <div className="bg-white p-6 border rounded-lg shadow-md">
          <form onSubmit={handleCreateEvent}>
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
                placeholder="Event Name"
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
                placeholder="Event Description"
                rows="4"
              ></textarea>
            </div>

            <div className="mb-4">
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
                name="eventImage"
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
                Create Event
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default CreateEventPage;
