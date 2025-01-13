import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

const Navbar = () => {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(true);
  const location = useLocation();

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <div
      className={`pt-3 pb-0 ${
        menuOpen ? "h-screen " : ""
      }  bg-pink-50 flex flex-col items-center justify-between border-b px-3  z-50`}
    >
      {/* Toggle Menu Button */}
      <button
        className={`text-gray-700 hover:text-red-400 px-12`}
        onClick={() => setMenuOpen(!menuOpen)}
      >
        <i className="fas fa-bars text-2xl"></i>
      </button>

      {/* Navbar Buttons */}
      {menuOpen && (
        <div className="flex flex-col space-y-6 w-full items-center">
          {user && (
            <>
              <Link to={`/profile/${user.username}`}>
                <button
                  title="Profile"
                  className={`flex flex-row items-center border-b p-2 text-2xl ${
                    isActive("/profile")
                      ? "text-red-500 border-red-500"
                      : "text-gray-700 border-gray-300"
                  }`}
                >
                  <i className="fas fa-user text-2xl"></i>
                  <h1 className="ml-2 text-sm">Profile</h1>
                </button>
              </Link>

              <Link to="/create">
                <button
                  title="Create"
                  className={`flex flex-row items-center border-b p-2 text-2xl ${
                    isActive("/create")
                      ? "text-red-500 border-red-500"
                      : "text-gray-700 border-gray-300"
                  }`}
                >
                  <i className="fas fa-add text-2xl"></i>
                  <h1 className="ml-2 text-sm">Create</h1>
                </button>
              </Link>

              <button
                title="Joined"
                className={`flex flex-row items-center border-b p-2 text-2xl ${
                  isActive("/joined")
                    ? "text-red-500 border-red-500"
                    : "text-gray-700 border-gray-300"
                }`}
              >
                <i className="fas fa-th-large text-2xl"></i>
                <h1 className="ml-2 text-sm">Joined</h1>
              </button>

              <button
                title="Discussion"
                className={`flex flex-row items-center border-b  p-2 text-2xl ${
                  isActive("/discussion")
                    ? "text-red-500 border-red-500"
                    : "text-gray-700 border-gray-300"
                }`}
              >
                <i className="fas fa-comment text-2xl text-blue-400"></i>
                <h1 className="ml-2 text-sm">Discussion</h1>
              </button>
            </>
          )}
        </div>
      )}

      {/* Login/Logout Section */}
      <div className="pb-[14px]">
        {menuOpen &&
          (!user ? (
            <div className="flex flex-col items-center space-y-4">
              <Link to="/login">
                <button className="flex flex-row items-center text-green-500 hover:text-green-700 border-b p-2">
                  <i className="fas fa-sign-in-alt text-2xl mb-1"></i>
                  <h1 className="ml-2 text-sm">Login</h1>
                </button>
              </Link>
              <Link to="/register">
                <button className="flex flex-row items-center text-blue-500 hover:text-blue-700 border-b p-2">
                  <i className="fas fa-user-plus text-2xl mb-1"></i>
                  <span className="text-sm ml-2">Register</span>
                </button>
              </Link>
            </div>
          ) : (
            ""
          ))}
      </div>
    </div>
  );
};

export default Navbar;
