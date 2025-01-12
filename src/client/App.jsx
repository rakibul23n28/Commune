import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CommuneMembershipProvider } from "./context/CommuneMembershipContext";
import ProtectedRoute from "./utils/ProtectedRoute";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Create from "./pages/Create";
import EditProfile from "./pages/EditProfile";
import EditCommune from "./pages/EditCommune";
import ViewCommune from "./pages/ViewCommune";
import AllCommunes from "./pages/AllCommunes";
import UserCommunes from "./pages/UserCommunes";
//utils
import RedirectIfAuthenticated from "./utils/RedirectIfAuthenticated";

const App = () => (
  <AuthProvider>
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/profile/:username" element={<Profile />} />

        {/* Commune Routes with Membership Context */}
        <Route
          path="/commune/:communeid"
          element={
            <CommuneMembershipProvider>
              <ViewCommune />
            </CommuneMembershipProvider>
          }
        />
        <Route
          path="/communes"
          element={
            <CommuneMembershipProvider>
              <AllCommunes />
            </CommuneMembershipProvider>
          }
        />

        {/* Auth Routes */}
        <Route
          path="/login"
          element={
            <RedirectIfAuthenticated>
              <Login />
            </RedirectIfAuthenticated>
          }
        />
        <Route
          path="/register"
          element={
            <RedirectIfAuthenticated>
              <Register />
            </RedirectIfAuthenticated>
          }
        />

        {/* User Routes */}
        <Route
          path="/usercommunes"
          element={
            <ProtectedRoute>
              <UserCommunes />
            </ProtectedRoute>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/editprofile"
          element={
            <ProtectedRoute>
              <EditProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/createcommune"
          element={
            <ProtectedRoute>
              <Create />
            </ProtectedRoute>
          }
        />
        <Route
          path="/editcommune/:communeid"
          element={
            <ProtectedRoute>
              <EditCommune />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  </AuthProvider>
);

export default App;
