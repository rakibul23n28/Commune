import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import Layout from "../components/Layout";
import CommuneNavbar from "../components/CommuneNavbar";
import CommuneFixedNav from "../components/CommuneFixedNav";
import { useCommuneMembership } from "../context/CommuneMembershipContext";
import { timeAgo } from "../utils/Helper";
import { useAuth } from "../context/AuthContext";

const CommuneProduct = () => {
  const { communeid } = useParams();
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [commune, setCommune] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false); // State for cart visibility
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

  const fetchCart = async () => {
    try {
      const { data } = await axios.get(`/api/cart/${user.id}`);
      setCart(data.cart);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Failed to load cart items."
      );
    }
  };

  useEffect(() => {
    fetchCart();
  }, [user.id]);

  const handleCartClick = async (product) => {
    try {
      const { data } = await axios.post("/api/cart/add", {
        userId: user.id,
        productId: product.product_id,
        quantity: 1,
      });
      setSuccessMessage(data.message);
      fetchCart(); // Refresh cart
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Failed to add product to cart."
      );
    }
  };

  const handleRemoveFromCart = async (productId) => {
    try {
      const { data } = await axios.delete(
        `/api/cart/remove/${user.id}/${productId}`
      );
      setSuccessMessage(data.message);
      fetchCart(); // Refresh cart
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Failed to remove product from cart."
      );
    }
  };

  const handleUpdateQuantity = async (productId, quantity) => {
    try {
      const { data } = await axios.put(`/api/cart/update`, {
        userId: user.id,
        productId,
        quantity,
      });
      setSuccessMessage(data.message);
      fetchCart(); // Refresh cart
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Failed to update cart quantity."
      );
    }
  };

  const handlePlaceOrder = async () => {
    try {
      const { data } = await axios.post(`/api/orders/create`, {
        userId: user.id,
        cart,
      });
      setSuccessMessage(data.message);
      setCart([]); // Clear cart after successful order
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Failed to place order."
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

  return (
    <Layout>
      <CommuneFixedNav />
      <CommuneNavbar name={communeData?.name || "Commune"} />
      <div className="relative">
        {/* Button to toggle cart */}
        <button
          className="fixed top-32 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg z-50 flex items-center"
          onClick={() => setIsCartOpen(!isCartOpen)}
        >
          <i
            className={`mr-2 ${
              isCartOpen ? "fas fa-times" : "fas fa-shopping-cart"
            }`}
          ></i>
          {isCartOpen ? "Close Cart" : "View Cart"}
        </button>

        {/* Cart Card */}
        {isCartOpen && (
          <div className="fixed top-48 right-4 w-80 bg-white p-4 rounded-lg shadow-lg z-50">
            <h2 className="text-xl font-bold mb-4">Your Cart</h2>
            {cart?.length === 0 ? (
              <p>Your cart is empty.</p>
            ) : (
              <>
                {cart.map((item) => (
                  <div
                    key={item.product_id}
                    className="flex justify-between items-center mb-4"
                  >
                    <h3>{item.product_name}</h3>
                    <div className="flex items-center space-x-4">
                      <button
                        className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded-md flex items-center"
                        onClick={() => handleRemoveFromCart(item.product_id)}
                      >
                        <i className="fas fa-trash mr-1"></i> Remove
                      </button>
                      <button
                        className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded-md flex items-center"
                        onClick={() =>
                          handleUpdateQuantity(
                            item.product_id,
                            item.quantity - 1
                          )
                        }
                        disabled={item.quantity <= 1}
                      >
                        <i className="fas fa-minus mr-1"></i>
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded-md flex items-center"
                        onClick={() =>
                          handleUpdateQuantity(
                            item.product_id,
                            item.quantity + 1
                          )
                        }
                      >
                        <i className="fas fa-plus mr-1"></i>
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md w-full flex items-center justify-center"
                  onClick={handlePlaceOrder}
                >
                  <i className="fas fa-check mr-2"></i> Place Order
                </button>
              </>
            )}
          </div>
        )}

        {/* Products */}
        <div className="w-3/4 mx-auto p-6 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-4">Products</h1>
          {errorMessage && (
            <div className="text-red-500 mb-4">{errorMessage}</div>
          )}
          {successMessage && (
            <div className="text-green-500 mb-4">{successMessage}</div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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
                <h2 className="text-lg font-semibold">
                  {product.product_name}
                </h2>
                <p className="text-gray-600 break-words">
                  {product.description}
                </p>
                <div className="border-t border-gray-300 mt-4 flex justify-between items-center">
                  <p className="text-green-600 font-bold mt-2">
                    ${Number(product.price).toFixed(2)}
                  </p>
                  <button
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md mt-2 flex items-center"
                    onClick={() => handleCartClick(product)}
                  >
                    <i className="fas fa-cart-plus mr-2"></i> Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CommuneProduct;
