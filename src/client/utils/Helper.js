// Helper function to get Authorization headers
export const getAuthHeaders = () => {
  try {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    const token = storedUser?.token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch (error) {
    console.error("Error retrieving authorization headers:", error);
    return {};
  }
};

export const validatePassword = (password) => {
  // Check password length (minimum 8 characters)
  const lengthCheck = password.length >= 8;

  // Check for at least one lowercase letter
  const lowercaseCheck = /[a-z]/.test(password);

  // Check for at least one uppercase letter
  const uppercaseCheck = /[A-Z]/.test(password);

  // Check for at least one number
  const numberCheck = /[0-9]/.test(password);

  // Check for at least one special character
  const specialCharCheck = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (!lengthCheck) return "Password must be at least 8 characters long.";
  if (!lowercaseCheck)
    return "Password must contain at least one lowercase letter.";
  if (!uppercaseCheck)
    return "Password must contain at least one uppercase letter.";
  if (!numberCheck) return "Password must contain at least one number.";
  if (!specialCharCheck)
    return "Password must contain at least one special character.";

  return null; // Password is strong
};

export const timeAgo = (timestamp) => {
  const now = new Date();
  const timeDiff = now - new Date(timestamp);

  const seconds = Math.floor(timeDiff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const years = Math.floor(days / 365);

  if (years > 0) return `${years}y`;
  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
};
// utils/Helper.js
export const validateUsername = (username) => {
  if (!username) return "Username cannot be empty.";
  if (username.length < 3)
    return "Username must be at least 3 characters long.";
  if (!/^[a-zA-Z0-9_]+$/.test(username))
    return "Username can only contain letters, numbers, and underscores.";
  return null;
};
