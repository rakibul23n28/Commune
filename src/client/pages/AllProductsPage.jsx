import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";

const AllProductsPage = () => {
  const { user } = useAuth();
  const {
    socket,
    showChat,
    setShowChat,
    chatProduct,
    setChatProduct,
    messages,
    setMessages,
    handleSendMessage,
    handleCloseChat,
  } = useChat();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    const fetchAllProducts = async () => {
      try {
        const { data } = await axios.get(`/api/products`);
        setProducts(data.products);
      } catch (error) {
        setErrorMessage(
          error.response?.data?.message || "Failed to load products."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAllProducts();
  }, []);

  const handleChatOpen = async (product) => {
    if (!user) {
      navigate("/login");
      return;
    }

    try {
      const response = await axios.get(
        `/api/chat/messages/individual/${product.user_id}`,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      setMessages(response.data.messages || []);
      setChatProduct(product);
      setShowChat(true);

      const roomId = [user.id, product.user_id].sort().join("-");
      console.log(roomId);

      socket.emit("joinPrivateRoom", {
        senderId: user.id,
        receiverId: product.user_id,
      });
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }
  };

  const handleSendMessageWithClear = (messageText) => {
    // Send the message
    handleSendMessage(messageText);
    // Clear the message input field
    setNewMessage("");
  };

  if (loading) {
    return (
      <Layout>
        <div className="w-1/2 mx-auto p-6 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-semibold mb-2">Loading...</h1>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="w-3/4 mx-auto p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">All Products</h1>
        {errorMessage && (
          <div className="text-red-500 mb-4">{errorMessage}</div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div
              key={product.product_id}
              className="bg-gray-100 p-4 rounded-lg shadow-md"
            >
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
                <button
                  onClick={() => handleChatOpen(product)}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md mt-2"
                >
                  Message to Buy
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showChat && (
        <div className="fixed bottom-4 right-4 w-96 h-2/3 bg-white shadow-lg border rounded-lg flex flex-col">
          <div className="p-4 bg-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-bold">Chat with Seller</h2>
            <button
              onClick={handleCloseChat}
              className="text-red-500 font-bold text-lg"
            >
              &times;
            </button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto">
            <p className="text-gray-700">
              Interested in: <strong>{chatProduct?.product_name}</strong>
            </p>
            <p className="text-gray-500 text-sm">
              From Commune: {chatProduct?.name}
            </p>
            <div className="mt-4">
              {messages.map((msg, index) => (
                <div key={index} className="mb-2">
                  <p className="text-gray-800">
                    <strong>{msg?.username}</strong>: {msg.message_text}
                  </p>
                  <p className="text-gray-500 text-sm">
                    {new Date(msg?.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="p-4 border-t">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="w-full p-2 border rounded-md"
            />
            <button
              onClick={() => handleSendMessageWithClear(newMessage)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md mt-2"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default AllProductsPage;
