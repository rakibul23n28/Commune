import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import Layout from "../components/Layout";
import CommuneNavbar from "../components/CommuneNavbar";
import CommuneFixedNav from "../components/CommuneFixedNav";
import { timeAgo } from "../utils/Helper";
import { useCommuneMembership } from "../context/CommuneMembershipContext";
import { useAuth } from "../context/AuthContext";
const SingleProduct = () => {
  const { user } = useAuth();
  const { productid } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const { communeData } = useCommuneMembership();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await axios.get(`/api/commune/product/${productid}`);
        setProduct(response.data.product);
        console.log(response.data.product);
      } catch (error) {
        setErrorMessage(
          error.response?.data?.message || "Failed to load product details."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productid]);

  const handleAddToCart = async () => {
    try {
      const { data } = await axios.post(
        `/api/cart/add`,
        {
          productId: product.product_id,
          quantity: 1,
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      setSuccessMessage(data.message);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Failed to add product to cart."
      );
    }
  };

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

  if (!product) {
    return (
      <Layout>
        <CommuneFixedNav />
        <CommuneNavbar name={communeData?.name} />
        <div className="w-1/2 mx-auto p-6 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-semibold mb-2">Product Not Found</h1>
          <p className="text-gray-600">
            The product you are looking for does not exist.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <CommuneFixedNav />
      <CommuneNavbar name="Product Details" />
      <div className="w-3/4 mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product Image */}
          <div>
            <img
              src={product.product_image}
              alt={product.product_name}
              className="w-full h-96 object-cover rounded-lg"
            />
          </div>

          {/* Product Info */}
          <div>
            <h1 className="text-3xl font-bold mb-4">{product.product_name}</h1>
            <p className="text-gray-700 text-lg mb-4 break-words">
              {product.description}
            </p>
            <p className="text-green-600 text-2xl font-bold mb-4">
              {Number(product.price).toFixed(2)}
            </p>

            {/* Seller Info */}
            <div className="flex items-center mb-6">
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
                  Listed {timeAgo(product.created_at)}
                </p>
              </div>
            </div>

            {/* Add to Cart Button */}
            <button
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg shadow-md w-full text-lg"
              onClick={handleAddToCart}
            >
              <i className="fas fa-cart-plus mr-2"></i> Add to Cart
            </button>

            {/* Success or Error Message */}
            {successMessage && (
              <p className="text-green-500 mt-4">{successMessage}</p>
            )}
            {errorMessage && (
              <p className="text-red-500 mt-4">{errorMessage}</p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SingleProduct;
