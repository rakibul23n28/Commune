import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import QuillEditor from "../components/QuillEditor";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

const Create = () => {
  const [formData, setFormData] = useState({
    name: "",
    commune_image: null,
    description: "",
    content: "",
    location: "",
    commune_type: "normal",
    privacy: "public", // Default value
  });

  const { user } = useAuth();

  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({ ...prevState, [name]: value })); // Safely update state
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData((prevState) => ({ ...prevState, commune_image: file }));

    if (file) {
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImagePreview(null);
    }
  };

  const handleQuillChange = (value) => {
    setFormData((prevState) => ({ ...prevState, content: value })); // Update content only
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      for (const key in formData) {
        formDataToSend.append(key, formData[key]);
      }

      // alart if no commune image is selected
      if (!formDataToSend.get("commune_image")) {
        alert("Please select a commune image.");
        return;
      }

      const response = await axios.post("/api/commune/create", formDataToSend, {
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      if (response.status === 201) {
        navigate(`/profile/${user.username}`);
      }
    } catch (error) {
      setError(error.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <Layout>
      <div className="max-w-[50rem] w-full mx-auto p-4  bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Create a Commune
        </h2>
        {error && (
          <p className="text-red-500 text-sm mb-4 border border-red-400 rounded-lg p-2">
            {error}
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 font-medium mb-2">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full p-2 border border-gray-300 rounded-md focus:ring focus:ring-blue-300 focus:outline-none"
              placeholder="Enter the commune name"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Commune Image
            </label>
            <input
              type="file"
              name="commune_image"
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
            />
            {imagePreview && (
              <div className="mt-4">
                <p className="text-gray-700 text-sm mb-2">Image Preview:</p>
                <img
                  src={imagePreview}
                  alt="Commune Preview"
                  className="w-40 h-40 object-cover rounded-md shadow"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring focus:ring-blue-300 focus:outline-none"
              placeholder="Provide a brief description"
              rows="3"
            ></textarea>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Content
            </label>
            <div className="h-96 w-full max-w-3xl bg-gray-50 rounded-lg overflow-hidden shadow-inner">
              <QuillEditor
                value={formData.content}
                onChange={handleQuillChange}
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring focus:ring-blue-300 focus:outline-none"
              placeholder="Enter the commune's location"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Commune Type
            </label>
            <select
              name="commune_type"
              value={formData.commune_type}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring focus:ring-blue-300 focus:outline-none"
            >
              <option value="normal">Default</option>
              <option value="ecommerce">E-commerce</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Privacy
            </label>
            <select
              name="privacy"
              value={formData.privacy}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring focus:ring-blue-300 focus:outline-none"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            Create Commune
          </button>
        </form>
      </div>
    </Layout>
  );
};

export default Create;
