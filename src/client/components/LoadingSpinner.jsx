import React from "react";

const LoadingSpinner = () => {
  return (
    <div className="flex justify-center items-center h-screen">
      <div
        className="spinner-border animate-spin inline-block w-16 h-16 border-4 border-t-4 border-blue-600 rounded-full"
        role="status"
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
};

export default LoadingSpinner;
