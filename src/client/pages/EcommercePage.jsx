import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import axios from "axios";
import { Link } from "react-router-dom";
import { getAuthHeaders, timeAgo } from "../utils/Helper.js";

const AllCommunes = () => {
  const [communes, setCommunes] = useState([]);
  const [expandedCommuneId, setExpandedCommuneId] = useState(null); // To toggle commune content expansion
  const [isLoading, setIsLoading] = useState(true); // Loading state for API call

  useEffect(() => {
    const fetchAllCommunes = async () => {
      try {
        const response = await axios.get("/api/communes", {
          headers: getAuthHeaders(),
        });
        setCommunes(response.data.communes);
      } catch (err) {
        console.error("Failed to fetch communes:", err);
        alert("Unable to fetch communes.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllCommunes();
  }, []);

  const toggleCommuneExpansion = (communeId) => {
    setExpandedCommuneId((prevId) => (prevId === communeId ? null : communeId));
  };

  return (
    <Layout>
      <div className="flex justify-center mt-8">
        <div className="w-full p-6">
          <h1 className="text-2xl font-bold text-center mb-6">All Communes</h1>
          {isLoading ? (
            <p className="text-center text-gray-600">Loading communes...</p>
          ) : communes.length > 0 ? (
            <div className="flex flex-col items-center">
              {communes.map((commune) => (
                <div
                  key={commune.commune_id}
                  className={`border p-4 rounded-lg shadow-md transition-all duration-300 w-full max-w-3xl my-4 ${
                    expandedCommuneId === commune.commune_id ? "h-auto" : "h-52"
                  }`}
                  onDoubleClick={() =>
                    toggleCommuneExpansion(commune.commune_id)
                  }
                  style={{ cursor: "pointer" }}
                >
                  <div className="flex flex-col mb-6">
                    <div className="flex items-center justify-between">
                      <Link to={`/commune/${commune.commune_id}`}>
                        <div className="flex gap-2 items-center">
                          <img
                            src={`${commune.commune_image}`}
                            alt={commune.name}
                            className="w-12 h-12 object-cover rounded-full"
                          />
                          <div className="w-full pr-4">
                            <h3 className="font-semibold text-lg truncate">
                              {commune.name}
                            </h3>
                            <p className="text-gray-500 text-xs">
                              {timeAgo(commune.created_at)}
                            </p>
                          </div>
                        </div>
                      </Link>
                      <span
                        className={`status-label ${
                          commune.privacy === "public"
                            ? "text-green-500"
                            : "text-yellow-500"
                        }`}
                      >
                        {commune.privacy.charAt(0).toUpperCase() +
                          commune.privacy.slice(1)}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">
                    {commune.description ?? "No description provided."}
                  </p>
                  <div className="bg-gray-100 rounded-lg p-4">
                    <div
                      className={`commune-description text-sm text-gray-800 transition-all duration-300 whitespace-pre-wrap break-words ${
                        expandedCommuneId === commune.commune_id
                          ? "line-clamp-none"
                          : "max-h-40 overflow-hidden"
                      }`}
                      dangerouslySetInnerHTML={{
                        __html: commune.content,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600 mt-4">
              No communes available.
            </p>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AllCommunes;
