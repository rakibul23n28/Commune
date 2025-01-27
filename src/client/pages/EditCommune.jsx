import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import QuillEditor from "../components/QuillEditor";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

const EditCommune = () => {
  const { communeid } = useParams(); // Get commune ID from the URL
  const [formData, setFormData] = useState({
    name: "",
    commune_image: null,
    description: "",
    content: "",
    location: "",
    commune_type: "normal",
    privacy: "public",
  });

  const { user } = useAuth();
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCommune = async () => {
      try {
        const response = await axios.get(`/api/commune/communes/${communeid}`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });
        const data = response.data.commune;

        setFormData({
          name: data.name,
          commune_image: null, // Set to null since we are using `imagePreview` for display
          description: data.description,
          content: data.content,
          location: data.location,
          commune_type: data.commune_type || "normal",
          privacy: data.privacy || "public",
        });
        setImagePreview(data.commune_image); // Assuming the API provides the image URL
      } catch (error) {
        setError(
          error.response?.data?.message || "Failed to load commune data"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCommune();
  }, [communeid, user.token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({ ...prevState, [name]: value }));
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
    setFormData((prevState) => ({ ...prevState, content: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      for (const key in formData) {
        if (formData[key] !== null) {
          formDataToSend.append(key, formData[key]);
        }
      }

      const response = await axios.put(
        `/api/commune/${communeid}`,
        formDataToSend,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.status === 200) {
        navigate(`/commune/${communeid}`);
      }
    } catch (error) {
      setError(error.response?.data?.message || "Something went wrong");
    }
  };

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await axios.post("/api/upload-image", formData, {
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 200) {
        return response.data.imageUrl; // Return the image URL
      } else {
        throw new Error("Image upload failed");
      }
    } catch (error) {
      setError("Image upload failed. Please try again.");
      throw error;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="w-full flex justify-center items-center h-96">
          <p>Loading...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="w-1/2 mx-auto p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Edit Commune</h2>
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
                <p className="text-gray-700 text-sm mb-2">Current Image:</p>
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
            <div className="h-96 bg-gray-50 rounded-lg overflow-hidden shadow-inner">
              <QuillEditor
                value={formData.content}
                onChange={handleQuillChange}
                uploadImage={uploadImage}
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
            Update Commune
          </button>
        </form>
      </div>
    </Layout>
  );
};

export default EditCommune;
