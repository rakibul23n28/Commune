import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Layout from "../components/Layout";
import CommuneNavbar from "../components/CommuneNavbar";
import CommuneFixedNav from "../components/CommuneFixedNav";
import { timeAgo } from "../utils/Helper";

const CommunePostsPage = () => {
  const { communeid } = useParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchCommunePosts = async () => {
    try {
      const response = await axios.get(`/api/commune/${communeid}/posts`);

      setPosts(response.data.posts);
    } catch (error) {
      setErrorMessage("Error fetching posts. Please try again.");
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunePosts();
  }, [communeid]);
  console.log(posts);

  if (loading) {
    return <div>Loading posts...</div>;
  }

  return (
    <Layout>
      <CommuneFixedNav />
      <CommuneNavbar name={`Commune ${communeid}`} />
      <div className="w-1/2 mx-auto p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">All Posts</h2>
        {errorMessage && (
          <div className="text-red-500 mb-4">{errorMessage}</div>
        )}
        <div className="space-y-6">
          {posts[0].map((post) => (
            <div
              key={post.post_id}
              className="bg-white p-6 border rounded-lg shadow-md"
            >
              <h3 className="text-xl font-semibold">{post.title}</h3>
              <p className="text-gray-600">
                By {post.username} | {timeAgo(post.created_at)} ago
              </p>
              <div
                className="mt-4"
                dangerouslySetInnerHTML={{
                  __html: post?.content,
                }}
              ></div>
              <a
                href={`/commune/${communeid}/posts/${post.post_id}`}
                className="text-blue-500 hover:underline mt-2 inline-block"
              >
                Read more
              </a>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default CommunePostsPage;
