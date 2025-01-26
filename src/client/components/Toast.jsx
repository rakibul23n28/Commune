import React, { useEffect } from "react";

const Toast = ({ toast, duration = 3000 }) => {
  const [visible, setVisible] = React.useState(false);

  useEffect(() => {
    if (toast.message) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [toast, duration]);

  if (!visible) return null;

  const toastStyles = {
    base: "fixed top-4 right-4 z-50 p-4 rounded-md shadow-lg transition-transform transform",
    success: "bg-green-100 text-green-800",
    error: "bg-red-100 text-red-800",
  };

  return (
    <div
      className={`${toastStyles.base} ${
        toast.type === "success" ? toastStyles.success : toastStyles.error
      }`}
    >
      {toast.message}
    </div>
  );
};

export default Toast;
