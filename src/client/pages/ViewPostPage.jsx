import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import Layout from "../components/Layout";
import CommuneNavbar from "../components/CommuneNavbar";
import CommuneFixedNav from "../components/CommuneFixedNav";
import { timeAgo } from "../utils/Helper";
import { useCommuneMembership } from "../context/CommuneMembershipContext";
import { useAuth } from "../context/AuthContext";

const ViewPostPage = () => {
  const { communeid, postid } = useParams();
  const { user } = useAuth();
  const { getRole, communeData } = useCommuneMembership();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await axios.get(`/api/commune/post/${postid}`);
        setPost(response.data.post);
      } catch (error) {
        setErrorMessage("Failed to fetch the post. Please try again later.");
        console.error("Error fetching post:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [communeid, postid]);

  if (loading) {
    return <div className="text-center py-10">Loading post...</div>;
  }

  if (errorMessage) {
    return (
      <Layout>
        <CommuneFixedNav />
        <CommuneNavbar name={communeData?.name || "Commune"} />
        <div className="text-center py-10 text-red-600">{errorMessage}</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <CommuneFixedNav />
      <CommuneNavbar name={communeData?.name || "Commune"} />
      <div className="w-1/2 mx-auto p-6 mt-6 bg-white rounded-lg shadow-lg">
        <h1 className="text-3xl font-extrabold mb-4 text-gray-800">
          {post.title}
        </h1>
        <div className="flex items-center mb-4">
          <img
            src={post.profile_image || "/default-avatar.png"}
            alt="User avatar"
            className="w-12 h-12 rounded-full border mr-4"
          />
          <div>
            <p className="text-lg font-medium text-gray-800">{post.username}</p>
            <p className="text-sm text-gray-500">
              {timeAgo(post.created_at)} ago
            </p>
          </div>
        </div>
        <div
          className="prose max-w-none mb-6"
          dangerouslySetInnerHTML={{ __html: post.content }}
        ></div>
        {post.links && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Links:</h3>
            <div className="flex flex-wrap gap-2">
              {post.links.split(" ").map((link, index) => (
                <a
                  key={index}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-100 text-green-800 text-sm py-1 px-2 rounded-full hover:bg-green-200"
                >
                  {link}
                </a>
              ))}
            </div>
          </div>
        )}
        {post.tags && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Tags:</h3>
            <div className="flex flex-wrap gap-2">
              {post.tags.split(",").map((tag, index) => (
                <span
                  key={index}
                  className="bg-blue-100 text-blue-800 text-sm py-1 px-2 rounded-full"
                >
                  {tag.trim()}
                </span>
              ))}
            </div>
          </div>
        )}
        {getRole(communeid) === "admin" || user.id === post.user_id ? (
          <div className="mt-4">
            <Link
              to={`/commune/edit/${communeid}/${postid}/post`}
              className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 mr-2"
            >
              Edit Post
            </Link>
            <button
              onClick={() => {
                if (
                  window.confirm("Are you sure you want to delete this post?")
                ) {
                  axios
                    .delete(`/api/commune/post/${postid}`)
                    .then(() => {
                      alert("Post deleted successfully.");
                      location.href = `/commune/${communeid}/posts`;
                    })
                    .catch((error) => {
                      console.error("Error deleting post:", error);
                    });
                }
              }}
              className="bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600"
            >
              Delete Post
            </button>
          </div>
        ) : null}
      </div>
    </Layout>
  );
};

export default ViewPostPage;
