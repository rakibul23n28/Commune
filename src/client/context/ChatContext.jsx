import React, { createContext, useState, useEffect, useContext } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import { useAuth } from "./AuthContext";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [chatProduct, setChatProduct] = useState(null);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!user) return;

    const socketInstance = io("http://localhost:5000", {
      auth: {
        token: user?.token,
      },
    });

    setSocket(socketInstance);

    // Listen for new messages
    socketInstance.on("newMessage", (message) => {
      if (user.id === message.receiverId) {
        setChatProduct({
          user_id: message.senderId,
          product_name: message.product_name,
          name: message.name,
        });
        setShowChat(true);
        fetchMessages(message.senderId);
      }
    });

    // Cleanup socket instance
    return () => {
      socketInstance.disconnect();
    };
  }, [user]);

  const fetchMessages = async (senderId) => {
    try {
      const response = await axios.get(
        `/api/chat/messages/individual/${senderId}`,
        {
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        }
      );
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error("Error fetching messages", error);
    }
  };

  const handleSendMessage = (newMessage) => {
    const messageData = {
      senderId: user.id,
      receiverId: chatProduct.user_id,
      roomId: [user.id, chatProduct.user_id].sort().join("-"),
      message_text: newMessage,
      created_at: new Date().toISOString(),
      chatType: "individual",
      profile_image: user.profile_image,
      username: user.username,
    };

    socket.emit("sendMessage", messageData);
    setMessages((prevMessages) => [...prevMessages, messageData]);
  };

  const handleCloseChat = () => {
    setShowChat(false);
    setChatProduct(null);
    setMessages([]);
  };

  return (
    <ChatContext.Provider
      value={{
        socket,
        showChat,
        setShowChat, // Expose setShowChat
        chatProduct,
        setChatProduct, // Expose setChatProduct
        messages,
        setMessages, // Expose setMessages
        handleSendMessage,
        handleCloseChat,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
