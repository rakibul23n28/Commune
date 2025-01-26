import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import Toast from "../components/Toast";
import { useCommuneMembership } from "../context/CommuneMembershipContext";
import CommuneNavbar from "../components/CommuneNavbar";
import CommuneFixedNav from "../components/CommuneFixedNav";

const CartPage = () => {
  const { user } = useAuth();
  const { communeid } = useParams(); // Support for dynamic commune carts
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const { communeData } = useCommuneMembership();

  const fetchCart = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/cart/${communeid}/${user.id}`);
      setCart(response.data.cart);
    } catch (error) {
      setToast({
        message: error.response?.data?.message || "Failed to load cart items.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (actionType, payload) => {
    try {
      let response;
      switch (actionType) {
        case "REMOVE":
          response = await axios.delete(
            `/api/cart/remove/${user.id}/${payload.productId}`
          );
          break;
        case "UPDATE_QUANTITY":
          response = await axios.put(`/api/cart/update`, {
            userId: user.id,
            productId: payload.productId,
            quantity: payload.quantity,
          });
          break;
        case "PLACE_ORDER":
          response = await axios.post(`/api/cart/orders/create`, {
            userId: user.id,
            cart,
          });
          setCart([]); // Clear cart after placing order
          break;
        default:
          throw new Error("Unknown action type");
      }
      setToast({ message: response.data.message, type: "success" });
      fetchCart(); // Refresh cart
    } catch (error) {
      setToast({
        message:
          error.response?.data?.message || "Failed to perform the action.",
        type: "error",
      });
    }
  };

  useEffect(() => {
    if (user?.id && communeid) {
      fetchCart();
    }
  }, [communeid, user?.id]);

  if (loading) {
    return (
      <Layout>
        <div className="w-1/2 mx-auto p-6 text-center">Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <CommuneFixedNav />
      <CommuneNavbar name={communeData?.name || "Commune"} />
      <div className="w-3/4 mx-auto p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Group Cart</h1>
        {toast && <Toast toast={toast} />}
        {cart.length === 0 ? (
          <p className="text-gray-600">No items in the group cart yet.</p>
        ) : (
          <>
            <div className="space-y-4">
              {cart.map((item) => (
                <div
                  key={item.product_id}
                  className="flex justify-between items-center p-4 bg-gray-100 rounded-lg shadow-sm hover:shadow-lg"
                >
                  <div className="flex items-center">
                    <img
                      src={item.product_image}
                      alt={item.product_name}
                      className="h-12 w-12 object-cover rounded-lg mr-4"
                    />
                    <div>
                      <Link
                        to={`/commune/${communeid}/product/${item.product_id}`}
                        className="text-lg font-semibold text-blue-500 hover:underline"
                      >
                        {item.product_name}
                      </Link>
                      <p className="text-sm text-gray-600">
                        Price: ৳.{parseFloat(item.price).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      className="bg-red-500 text-white px-4 py-2 rounded-md"
                      onClick={() =>
                        handleAction("REMOVE", { productId: item.product_id })
                      }
                    >
                      Remove
                    </button>
                    <div className="flex items-center space-x-2">
                      <button
                        className={`bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg ${
                          item.quantity <= 1
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                        onClick={() =>
                          handleAction("UPDATE_QUANTITY", {
                            productId: item.product_id,
                            quantity: item.quantity - 1,
                          })
                        }
                        disabled={item.quantity <= 1}
                      >
                        -
                      </button>
                      <span className="font-medium text-gray-700">
                        {item.quantity}
                      </span>
                      <button
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg"
                        onClick={() =>
                          handleAction("UPDATE_QUANTITY", {
                            productId: item.product_id,
                            quantity: item.quantity + 1,
                          })
                        }
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 text-right">
              <p className="text-lg font-semibold text-gray-700">
                Total: ৳.
                {cart
                  .reduce(
                    (total, item) => total + item.price * item.quantity,
                    0
                  )
                  .toFixed(2)}
              </p>
              <button
                className="bg-green-500 text-white px-6 py-3 rounded-md mt-4"
                onClick={() => handleAction("PLACE_ORDER")}
              >
                Place Order
              </button>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default CartPage;
