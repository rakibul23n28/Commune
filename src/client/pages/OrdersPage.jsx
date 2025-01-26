import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import Layout from "../components/Layout";
import Toast from "../components/Toast";
import { useCommuneMembership } from "../context/CommuneMembershipContext";
import CommuneNavbar from "../components/CommuneNavbar";
import CommuneFixedNav from "../components/CommuneFixedNav";
import { useParams } from "react-router-dom";

const OrdersPage = () => {
  const { communeid } = useParams();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const { communeData } = useCommuneMembership();

  const fetchOrders = async () => {
    if (!communeid || !user?.id) return;

    setLoading(true);
    try {
      const response = await axios.get(
        `/api/cart/orders/${user.id}?commune_id=${communeid}`
      );
      console.log("Filtered Orders Response:", response.data); // Debugging
      setOrders(response.data.orders || []); // Ensure orders fallback to empty array
    } catch (error) {
      setToast({
        message: error.response?.data?.message || "Failed to load orders.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
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
        <h1 className="text-2xl font-bold mb-4">
          Orders in {communeData?.name || "this Commune"}
        </h1>
        {toast && <Toast toast={toast} />}
        {orders.length === 0 ? (
          <p className="text-gray-600">
            No orders placed for this commune yet.
          </p>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order.order_id}
                className="p-4 bg-gray-100 rounded-lg shadow-sm"
              >
                <h2 className="text-lg font-semibold mb-2">
                  Order #{order.order_id}
                </h2>
                <p className="text-sm text-gray-600">
                  Total Amount: ৳
                  {order.total_amount
                    ? parseFloat(order.total_amount).toFixed(2)
                    : "0.00"}
                </p>
                <p className="text-sm text-gray-600">
                  Placed On: {new Date(order.created_at).toLocaleString()}
                </p>
                <h3 className="mt-4 text-md font-medium">Order Items:</h3>
                <ul className="list-disc list-inside">
                  {order.items?.map((item) => (
                    <li key={item.order_item_id} className="text-gray-700">
                      {item.product_name} - {item.quantity} x ৳
                      {parseFloat(item.price).toFixed(2)}
                    </li>
                  )) || (
                    <li className="text-gray-600">
                      No items found for this order.
                    </li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default OrdersPage;
