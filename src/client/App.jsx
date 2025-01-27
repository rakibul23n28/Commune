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

// Posts
import CreatePostPage from "./pages/CreatePostPage";
import CommunePostsPage from "./pages/CommunePostsPage";
import EditPostsPage from "./pages/EditPostsPage";
import ViewPostPage from "./pages/ViewPostPage";

// Lists
import DynamicListingForm from "./pages/DynamicListingForm";
import CommuneListsPage from "./pages/CommuneListsPage";
import ViewListPage from "./pages/ViewListPage";
import EditListingForm from "./pages/EditListingForm";

// Events
import CreateEvent from "./pages/CreateEvent";
import CommuneEventsPage from "./pages/CommuneEventsPage";
import EditEventPage from "./pages/EditEventPage";
import ViewEventPage from "./pages/ViewEventPage";

//products
import CreateProduct from "./pages/CreateProduct";
import CommuneProduct from "./pages/CommuneProduct";
import SingleProduct from "./pages/SingleProduct";

//collaboration
import CollaborationPostPage from "./pages/CollaborationPostPage";
import CollaborationListPage from "./pages/CollaborationListPage";
import CollaborationRequests from "./pages/CollaborationRequests";

//nav
import CommuneMembers from "./pages/CommuneMembers";
import CommuneJoinMember from "./pages/CommuneJoinMember";
// Utils
import RedirectIfAuthenticated from "./utils/RedirectIfAuthenticated";
import AdminModeratorProtected from "./utils/AdminModeratorProtected";
import OnlyAdmin from "./utils/OnlyAdmin";

//admin
import CommuneSendRequest from "./pages/CommuneSendRequest";
import CommuneMemberManagement from "./pages/CommuneMemberManagement";

//cart
import CartPage from "./pages/CartPage";
import OrdersPage from "./pages/OrdersPage";
//chat
import { ChatProvider } from "./context/ChatContext";
import ChatPage from "./pages/ChatPage";
//varify
import VerifyAccount from "./pages/VerifyAccount";

const App = () => (
  <AuthProvider>
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/profile/:username" element={<Profile />} />
        <Route path="/verify" element={<VerifyAccount />} />

        {/* Commune Routes (Wrapped with CommuneMembershipProvider) */}
        <Route
          path="/commune/*"
          element={
            <CommuneMembershipProvider>
              <Routes>
                <Route path=":communeid" element={<ViewCommune />} />
                <Route path="" element={<AllCommunes />} />
                <Route path=":communeid/posts" element={<CommunePostsPage />} />
                <Route path=":communeid/lists" element={<CommuneListsPage />} />
                <Route path=":communeid/carts" element={<CartPage />} />
                <Route path=":communeid/orders" element={<OrdersPage />} />
                <Route
                  path=":communeid/products"
                  element={<CommuneProduct />}
                />
                <Route
                  path=":communeid/events"
                  element={<CommuneEventsPage />}
                />
                <Route
                  path=":communeid/collaboration/posts"
                  element={<CollaborationPostPage />}
                />
                <Route
                  path=":communeid/collaboration/lists"
                  element={<CollaborationListPage />}
                />
                <Route
                  path="create/:communeid/post"
                  element={
                    <ProtectedRoute>
                      <CreatePostPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="create/:communeid/list"
                  element={
                    <ProtectedRoute>
                      <AdminModeratorProtected>
                        <DynamicListingForm />
                      </AdminModeratorProtected>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/create/:communeid/event"
                  element={
                    <ProtectedRoute>
                      <AdminModeratorProtected>
                        <CreateEvent />
                      </AdminModeratorProtected>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/create/:communeid/product"
                  element={
                    <ProtectedRoute>
                      <CreateProduct />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="edit/:communeid/:postid/post"
                  element={
                    <ProtectedRoute>
                      <EditPostsPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="edit/:communeid/:eventid/event"
                  element={
                    <ProtectedRoute>
                      <AdminModeratorProtected>
                        <EditEventPage />
                      </AdminModeratorProtected>
                    </ProtectedRoute>
                  }
                />

                {/* //Admin Collaborate */}
                <Route
                  path=":communeid/collaboration-requests"
                  element={
                    <ProtectedRoute>
                      <AdminModeratorProtected>
                        <CommuneSendRequest />
                      </AdminModeratorProtected>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path=":communeid/manage-members"
                  element={
                    <ProtectedRoute>
                      <OnlyAdmin>
                        <CommuneMemberManagement />
                      </OnlyAdmin>
                    </ProtectedRoute>
                  }
                />
                {/* //Admin Collaborate */}
                <Route
                  path=":communeid/pending"
                  element={
                    <ProtectedRoute>
                      <AdminModeratorProtected>
                        <CollaborationRequests />
                      </AdminModeratorProtected>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path=":communeid/join-members"
                  element={
                    <ProtectedRoute>
                      <AdminModeratorProtected>
                        <CommuneJoinMember />
                      </AdminModeratorProtected>
                    </ProtectedRoute>
                  }
                />

                <Route path=":communeid/members" element={<CommuneMembers />} />

                <Route
                  path="edit/:communeid/:listid/list"
                  element={
                    <ProtectedRoute>
                      <EditListingForm />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/:communeid/post/:postid"
                  element={<ViewPostPage />}
                />

                <Route
                  path="/:communeid/list/:listid"
                  element={<ViewListPage />}
                />
                <Route
                  path="/:communeid/product/:productid"
                  element={<SingleProduct />}
                />
                <Route
                  path="/:communeid/event/:eventid"
                  element={<ViewEventPage />}
                />
              </Routes>
            </CommuneMembershipProvider>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
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
