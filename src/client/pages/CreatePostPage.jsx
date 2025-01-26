import React, { useState, useEffect } from "react";
import { useCommuneMembership } from "../context/CommuneMembershipContext";
import { useAuth } from "../context/AuthContext";
import { useParams } from "react-router-dom";
import axios from "axios";
import Layout from "../components/Layout";
import CommuneNavbar from "../components/CommuneNavbar";
import CommuneFixedNav from "../components/CommuneFixedNav";
import QuillEditor from "../components/QuillEditor";

const CreatePostPage = () => {
  const { user } = useAuth();
  const { communeid } = useParams();
  const { getRole, fetchCommuneData, communeData } = useCommuneMembership();
  const [commune, setCommune] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [links, setLinks] = useState("");
  const [tags, setTags] = useState("");

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

  const handleCreatePost = async (e) => {
    e.preventDefault();

    if (!title || !content) {
      setErrorMessage("Title and content are required");
      return;
    }

    try {
      const role = getRole(communeid);
      if (role) {
        await axios.post(
          `/api/commune/create/${communeid}/post`,
          {
            title,
            content,
            tags: tags,
          },
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        );

        location.href = `/commune/${communeid}/posts`;
      } else {
        setErrorMessage(
          "You must be a member of this commune to create a post."
        );
      }
    } catch (error) {
      setErrorMessage("Error creating post. Please try again.");
      console.error("Error creating post:", error);
    }
  };

  if (loading) {
    return (
      <Layout>
        <CommuneFixedNav />
        <CommuneNavbar name={commune?.name} />
        <div className="w-1/2 mx-auto p-6 bg-white rounded-lg shadow-md">
          <div className="max-w-sm mx-auto mb-6 p-4 border rounded-lg shadow-md bg-white">
            <h1 className="text-2xl font-semibold mb-2">Loading...</h1>
          </div>
        </div>
      </Layout>
    );
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
        <h2 className="text-2xl font-bold mb-4">Create a Post</h2>
        {errorMessage && (
          <div className="text-red-500 mb-4">{errorMessage}</div>
        )}
        <div className="bg-white p-6 border rounded-lg shadow-md">
          <form onSubmit={handleCreatePost}>
            <div className="mb-4">
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700"
              >
                Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Post Title"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                Content
              </label>
              <div className="h-96 bg-gray-50 rounded-lg overflow-hidden shadow-inner">
                <QuillEditor value={content} onChange={setContent} />
              </div>
            </div>

            <div className="mb-4">
              <label
                htmlFor="tags"
                className="block text-sm font-medium text-gray-700"
              >
                Tags (separated by commas)
              </label>
              <input
                id="tags"
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Add tags"
              />
              {tags && (
                <div className="mt-2">
                  <h3 className="text-sm font-medium text-gray-700">Tags:</h3>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {tags.split(",").map((tag, index) => (
                      <span
                        key={index}
                        className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold py-1 px-2 rounded-full"
                      >
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="mb-4">
              <button
                type="submit"
                className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Create Post
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default CreatePostPage;
