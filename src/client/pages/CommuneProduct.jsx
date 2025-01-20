import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import Layout from "../components/Layout";
import CommuneNavbar from "../components/CommuneNavbar";
import CommuneFixedNav from "../components/CommuneFixedNav";
import { useCommuneMembership } from "../context/CommuneMembershipContext";
import { timeAgo } from "../utils/Helper";

const CommuneProduct = () => {
  const { communeid } = useParams();
  const [products, setProducts] = useState([]);
  const [commune, setCommune] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const { getRole, fetchCommuneData, communeData } = useCommuneMembership();

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

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await axios.get(`/api/commune/${communeid}/products`);
        setProducts(data.products);
        setCommune(data.commune);
      } catch (error) {
        setErrorMessage(
          error.response?.data?.message || "Failed to load products."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [communeid]);

  if (loading) {
    return (
      <Layout>
        <CommuneFixedNav />
        <CommuneNavbar name="Loading..." />
        <div className="w-1/2 mx-auto p-6 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-semibold mb-2">Loading...</h1>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <CommuneFixedNav />
      <CommuneNavbar name={commune?.name || "Commune"} />
      <div className="w-3/4 mx-auto p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Products</h1>
        {errorMessage && (
          <div className="text-red-500 mb-4">{errorMessage}</div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div
              key={product.product_id}
              className="bg-gray-100 p-4 rounded-lg shadow-md"
            >
              <div className="flex items-center mb-4">
                <img
                  src={product.profile_image}
                  alt={product.username}
                  className="object-cover rounded-full w-12 h-12"
                />
                <div className="ml-4">
                  <Link to={`/profile/${product.username}`}>
                    <h3 className="text-lg font-semibold text-blue-500">
                      {product.username}
                    </h3>
                  </Link>
                  <p className="text-gray-600 text-sm">
                    {timeAgo(product.created_at)}
                  </p>
                </div>
              </div>

              {product.product_image && (
                <img
                  src={product.product_image}
                  alt={product.product_name}
                  className="w-full h-48 object-cover rounded-md mb-4"
                />
              )}
              <h2 className="text-lg font-semibold">{product.product_name}</h2>
              <p className="text-gray-600">{product.description}</p>
              <div className="border-t border-gray-300 mt-4 flex justify-between items-center">
                <p className="text-green-600 font-bold mt-2">
                  ${Number(product.price).toFixed(2)}
                </p>
                <Link>
                  <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md mt-2">
                    Message to Buy
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default CommuneProduct;
