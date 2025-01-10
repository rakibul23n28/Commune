import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { validateUsername } from "../utils/Helper.js";

const EditProfile = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [editData, setEditData] = useState({
    username: user?.username || "",
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    profile_image: user?.profile_image || "",
  });
  const [preview, setPreview] = useState(user?.profile_image);
  const [usernameError, setUsernameError] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Validate and check if the username is available
  useEffect(() => {
    const validateAndCheckUsername = async () => {
      if (!editData.username) {
        setUsernameError(null);
        return;
      }

      // Validate username locally
      const validationError = validateUsername(editData.username);
      if (validationError) {
        setUsernameError(validationError);
        return;
      }
      if (editData.username === user?.username) {
        setUsernameError(null);
        return;
      }

      try {
        const response = await axios.get(
          `/api/auth/exists/${editData.username}`
        );
        if (response.data.exists) {
          setUsernameError("Username is already taken");
        } else {
          setUsernameError(null);
        }
      } catch (err) {
        console.error("Failed to check username:", err);
      }
    };

    const debounceTimeout = setTimeout(() => {
      validateAndCheckUsername();
    }, 500); // Delay the request to avoid too many API calls

    return () => clearTimeout(debounceTimeout); // Cleanup the timeout on unmount or when username changes
  }, [editData.username]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditData({ ...editData, [name]: value });

    if (name === "username") {
      setUsernameError(validateUsername(value));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
        setEditData({ ...editData, profile_image: reader.result });
      };
      reader.readAsDataURL(file);
    } else {
      alert("Please select a valid image file.");
    }
  };

  const handleProfileUpdate = async () => {
    if (usernameError) {
      alert("Please resolve username issues before saving.");
      return;
    }

    if (!user?.token) {
      alert("Authentication error. Please log in again.");
      return;
    }

    try {
      let formData = new FormData();
      formData.append("username", editData.username);
      formData.append("first_name", editData.first_name);
      formData.append("last_name", editData.last_name);

      if (editData.profile_image.startsWith("data:image")) {
        const response = await fetch(editData.profile_image);
        const blob = await response.blob();
        const file = new File([blob], "profile-pic.jpg", { type: blob.type });
        formData.append("profile_image", file);
      }

      const response = await axios.put("/api/user/update", formData, {
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      const userWithToken = {
        ...response.data.user,
        token: response.data.token,
      };

      setUser(userWithToken);

      // Ensure localStorage updates properly
      setTimeout(() => {
        localStorage.removeItem("user");
        localStorage.setItem("user", JSON.stringify(userWithToken));
        console.log("Updated user saved to localStorage.");
      }, 0);

      alert("Profile updated successfully!");
      navigate(`/profile/${userWithToken.username}`);
    } catch (err) {
      console.error("Failed to update profile:", err);
      alert("Profile update failed. Please try again.");
      if (err.response.data.msg) {
        setErrorMessage(err.response.data.msg);
      }
    }
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Edit Profile</h2>
        {errorMessage && <p className="text-red-500">{errorMessage}</p>}
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <img
              src={preview || user.profile_image}
              alt="Preview"
              className="w-24 h-24 rounded-full object-cover border"
            />
            <input
              type="file"
              name="profile_image"
              accept="image/*"
              onChange={handleImageChange}
              className="text-sm"
            />
          </div>

          <div>
            <label className="block font-semibold">Username:</label>
            <input
              type="text"
              name="username"
              value={editData.username}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-lg"
            />
            {usernameError && <p className="text-red-500">{usernameError}</p>}
          </div>

          <div>
            <label className="block font-semibold">First Name:</label>
            <input
              type="text"
              name="first_name"
              value={editData.first_name}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block font-semibold">Last Name:</label>
            <input
              type="text"
              name="last_name"
              value={editData.last_name}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-lg"
            />
          </div>

          <div className="flex space-x-4 mt-6">
            <button
              onClick={handleProfileUpdate}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg"
            >
              Save
            </button>
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-gray-300 text-black rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
