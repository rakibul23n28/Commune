import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import { getAuthHeaders, timeAgo } from "../utils/Helper";
import { Link } from "react-router-dom";
import { io } from "socket.io-client";

const ChatPage = () => {
  const { user } = useAuth();
  const [communes, setCommunes] = useState([]);
  const [individualChats, setIndividualChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isAddParticipantModalOpen, setIsAddParticipantModalOpen] =
    useState(false);
  const [communeMembers, setCommuneMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);

  const messageContainerRef = useRef(null);
  const [socket, setSocket] = useState(null);

  // Initialize socket connection
  useEffect(() => {
    if (!user) return;

    const socketInstance = io("http://localhost:5000", {
      auth: { token: user?.token },
    });

    setSocket(socketInstance);

    // Listen for incoming messages
    socketInstance.on("newMessage", (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);

      console.log(message);
    });

    return () => {
      if (socketInstance) socketInstance.disconnect();
    };
  }, [user, selectedChat]);

  // Fetch user's chats
  useEffect(() => {
    axios
      .get("/api/chat/my-chats", { headers: getAuthHeaders() })
      .then((response) => {
        setCommunes(response.data.communes || []);
        setIndividualChats(response.data.individualChats || []);
      })
      .catch((error) => {
        console.error("Error fetching chats:", error);
      });
  }, []);

  // Fetch messages for the selected chat
  useEffect(() => {
    if (selectedChat && socket) {
      axios
        .get(
          `/api/chat/messages/${selectedChat.type}/${
            selectedChat.type === "commune"
              ? selectedChat.chat_id
              : selectedChat.id
          }`,
          { headers: getAuthHeaders() }
        )
        .then((response) => setMessages(response.data.messages || []))
        .catch((error) => console.error("Error fetching messages:", error));

      socket.emit("joinPrivateRoom", {
        senderId: user.id,
        receiverId:
          selectedChat.type === "commune"
            ? selectedChat.chat_id
            : selectedChat.id,
        chatType: selectedChat.type,
      });
      console.log(selectedChat, "selectedChat");
    }
  }, [selectedChat, socket]);

  // Fetch commune members when the modal opens
  useEffect(() => {
    if (isAddParticipantModalOpen && selectedChat?.type === "commune") {
      axios
        .get(`/api/commune/commune-members/${selectedChat.id}`, {
          headers: getAuthHeaders(),
        })
        .then((response) => setCommuneMembers(response.data.members || []))
        .catch((error) => console.error("Error fetching members:", error));
    }
  }, [isAddParticipantModalOpen, selectedChat]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop =
        messageContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle message sending
  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedChat) return;

    const messageData = {
      chatType: selectedChat.type,
      receiverId:
        selectedChat.type === "commune"
          ? selectedChat.chat_id
          : selectedChat.id,
      message_text: newMessage,
      senderId: user.id,
      created_at: new Date().toISOString(),
      profile_image: user.profile_image,
      username: user.username,
    };

    socket.emit("sendMessage", messageData);

    // console.log(messageData, "messageData");

    // setMessages((prevMessages) => [
    //   ...prevMessages,
    //   { ...messageData, sender_id: user.id },
    // ]);

    setNewMessage("");
  };

  // Handle user search
  const handleSearch = () => {
    if (!searchQuery.trim()) return;

    axios
      .get(`/api/chat/search?username=${searchQuery}`, {
        headers: getAuthHeaders(),
      })
      .then((response) => setSearchResults(response.data.users || []))
      .catch((error) => console.error("Error searching users:", error));
  };

  // Add participant modal toggling
  const toggleAddParticipantModal = () => {
    setIsAddParticipantModalOpen(!isAddParticipantModalOpen);
  };

  // Toggle member selection
  const toggleSelectMember = (userId) => {
    setSelectedMembers((prevSelected) =>
      prevSelected.includes(userId)
        ? prevSelected.filter((id) => id !== userId)
        : [...prevSelected, userId]
    );
  };

  // Save added participants
  const saveChanges = () => {
    if (selectedMembers.length === 0) {
      alert("Please select at least one participant to add.");
      return;
    }

    axios
      .post(
        `/api/commune/add-chat-participants/${selectedChat.chat_id}`,
        { userIds: selectedMembers },
        { headers: getAuthHeaders() }
      )
      .then(() => {
        alert("Participants added successfully!");
        setIsAddParticipantModalOpen(false);
        setSelectedMembers([]);
      })
      .catch((error) => {
        console.error("Error adding participants:", error);
        alert("Failed to add participants. Please try again.");
      });
  };

  return (
    <Layout>
      <div className="flex h-screen bg-gray-100">
        {/* Sidebar */}
        <div className="w-72 bg-white border-r shadow-lg overflow-y-auto">
          {/* Search Bar */}
          <div className="p-4 border-b">
            <h3 className="text-lg font-bold mb-2 text-gray-700">
              Search Users
            </h3>
            <input
              type="text"
              placeholder="Search by username"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-2 border rounded mb-2"
            />
            <button
              onClick={handleSearch}
              className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
            >
              Search
            </button>
            <ul className="mt-4">
              {searchResults.map((user) => (
                <li
                  key={user.user_id}
                  className="cursor-pointer p-2 border-b hover:bg-gray-100"
                  onClick={() =>
                    setSelectedChat({ type: "individual", id: user.user_id })
                  }
                >
                  <div className="flex items-center">
                    <img
                      src={user.profile_image}
                      alt={user.username}
                      className="w-8 h-8 rounded-full mr-2"
                    />
                    <span>{user.username}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Communes */}
          <div className="p-4 border-b">
            <h3 className="text-lg font-bold mb-2 text-gray-700">Communes</h3>
            <ul>
              {communes.map((commune) => (
                <li
                  key={commune.commune_id}
                  className={`cursor-pointer p-2 border-b hover:bg-gray-100 ${
                    selectedChat?.type === "commune" &&
                    selectedChat.id === commune.commune_id
                      ? "bg-blue-100"
                      : ""
                  }`}
                  onClick={
                    () =>
                      selectedChat?.type === "commune" &&
                      selectedChat.id === commune.commune_id
                        ? setSelectedChat(null) // Close chat if it's already selected
                        : setSelectedChat({
                            type: "commune",
                            id: commune.commune_id,
                            chat_id: commune.chat_id,
                            role: commune.role,
                          }) // Open new chat
                  }
                >
                  <div className="flex items-center">
                    <img
                      src={commune.commune_image}
                      alt={commune.name}
                      className="w-8 h-8 rounded-full mr-2"
                    />
                    <span>{commune.name}</span> ({" "}
                    <span className="text-gray-500 text-sm">
                      {commune.role}
                    </span>{" "}
                    )
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Individual Chats */}
          <div className="p-4">
            <h3 className="text-lg font-bold mb-2 text-gray-700">
              Individual Chats
            </h3>
            <ul>
              {individualChats.map((chat) => (
                <li
                  key={chat.chat_id}
                  className={`cursor-pointer p-2 border-b hover:bg-gray-100 ${
                    selectedChat?.type === "individual" &&
                    selectedChat.id === chat.user_id
                      ? "bg-blue-100"
                      : ""
                  }`}
                  onClick={
                    () =>
                      selectedChat?.type === "individual" &&
                      selectedChat.id === chat.user_id
                        ? setSelectedChat(null) // Close chat if it's already selected
                        : setSelectedChat({
                            type: "individual",
                            id: chat.user_id,
                          }) // Open new chat
                  }
                >
                  <div className="flex items-center">
                    <img
                      src={chat.profile_image}
                      alt={chat.user_name}
                      className="w-8 h-8 rounded-full mr-2"
                    />
                    {chat.chat_name || `Chat with ${chat.user_name}`}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 bg-gray-50 p-2">
          {selectedChat ? (
            <>
              <div
                className="mb-4 max-h-[80%] overflow-y-auto"
                ref={messageContainerRef}
              >
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`mb-2 ${
                      msg.senderId === user.id ? "text-right" : "text-left"
                    }`}
                  >
                    <div
                      className={`flex items-center  ${
                        msg.senderId === user.id
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div className="flex items-center shadow-md rounded border p-2 mx-16">
                        <img
                          src={msg.profile_image}
                          alt={msg.username}
                          className="w-8 h-8 mr-1 border-2 rounded-full"
                        />
                        <div className="flex flex-col justify-center">
                          <Link to={`/profile/${msg.username}`}>
                            <h1 className="font-bold text-sm mr-4">
                              {msg.username}
                            </h1>
                          </Link>
                          <h1 className=" text-gray-500 text-[10px] mr-4">
                            {timeAgo(msg.created_at)}
                          </h1>
                        </div>
                        <h1
                          className={`inline-block px-4 max-w-96 py-2 rounded-lg ${
                            msg.senderId === user.id
                              ? "bg-blue-500 text-white"
                              : "bg-gray-200 text-black"
                          }`}
                        >
                          {msg.message_text}
                        </h1>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Participant Button (Only for Commune chat) */}
              {selectedChat.type === "commune" &&
                (selectedChat.role == "admin" ||
                  selectedChat.role == "moderator") && (
                  <div className="text-right mt-4">
                    <button
                      onClick={toggleAddParticipantModal}
                      className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
                    >
                      Add Participant
                    </button>
                  </div>
                )}

              {/* Add Participant Modal (Optional) */}
              {isAddParticipantModalOpen &&
                (selectedChat.role === "admin" ||
                  selectedChat.role === "moderator") && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg ">
                      <h3 className="text-lg font-bold mb-2">
                        Add a Participant
                      </h3>
                      <div className="mb-4">
                        {/* Select All Button */}
                        <button
                          onClick={() =>
                            setSelectedMembers(
                              communeMembers.map((member) => member.user_id)
                            )
                          }
                          className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 mr-4"
                        >
                          Select All
                        </button>
                        {/* Deselect All Button */}
                        <button
                          onClick={() => setSelectedMembers([])}
                          className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
                        >
                          Deselect All
                        </button>
                      </div>
                      {/* Display existing members */}
                      <ul className="max-h-72 overflow-y-auto">
                        {communeMembers.map((member) => (
                          <li
                            key={member.user_id}
                            className="p-2 cursor-pointer border-b hover:bg-gray-100"
                            onClick={() => toggleSelectMember(member.user_id)}
                          >
                            <div className="flex items-center">
                              <img
                                src={member.profile_image}
                                alt={member.username}
                                className="w-8 h-8 rounded-full mr-2"
                              />
                              <span>{member.username}</span> (
                              <span className="text-sm text-gray-500">
                                {member.role}
                              </span>
                              )
                              <button
                                onClick={() =>
                                  toggleSelectMember(member.user_id)
                                }
                                className={`ml-2 py-1 px-2 rounded ${
                                  selectedMembers.includes(member.user_id)
                                    ? "bg-blue-500 text-white"
                                    : "bg-gray-200"
                                }`}
                              >
                                {selectedMembers.includes(member.user_id)
                                  ? "Selected"
                                  : "Select"}
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>

                      {/* Save Changes Button */}
                      <div className="mt-4 text-right flex justify-between">
                        <button
                          onClick={saveChanges}
                          className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={toggleAddParticipantModal}
                          className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 "
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 p-2 border rounded"
                />
                <button
                  onClick={handleSendMessage}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Send
                </button>
              </div>
            </>
          ) : (
            <p className="text-gray-600">Select a chat to view messages.</p>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ChatPage;
