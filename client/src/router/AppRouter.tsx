import { lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import UIProvider from "../components/ui/UIProvider";
import AuthProvider from "../auth/AuthProvider";
import ProtectedRoute from "../auth/ProtectedRoute";
import PublicLayout from "../components/public/PublicLayout";
import HomePage from "../pages/public/HomePage";
import SavedEventsProvider from "../saved-events/SavedEventsProvider";
const SavedEventsPage = lazy(() => import("../pages/account/SavedEventsPage"));
const DiscoverPage = lazy(() => import("../pages/public/DiscoverPage"));
const EventDetailsPage = lazy(() => import("../pages/public/EventDetailsPage"));
const VendorApplicationPage = lazy(
  () => import("../pages/public/VendorApplicationPage"),
);
const NotFoundPage = lazy(() => import("../pages/public/NotFoundPage"));
const OrganizerEventFormPage = lazy(
  () => import("../pages/organizer/OrganizerEventFormPage"),
);
const OrganizerVendorCallsPage = lazy(
  () => import("../pages/organizer/OrganizerVendorCallsPage"),
);
const OrganizerAnnouncementsPage = lazy(
  () => import("../pages/organizer/OrganizerAnnouncementsPage"),
);
const AuthPage = lazy(() => import("../pages/account/AuthPage"));
const ProfilePage = lazy(() => import("../pages/account/ProfilePage"));
const EditProfilePage = lazy(() => import("../pages/account/EditProfilePage"));
const MyEventsPage = lazy(() => import("../pages/account/MyEventsPage"));
const ApplicationsPage = lazy(
  () => import("../pages/account/ApplicationsPage"),
);
const ConfirmedEventsPage = lazy(
  () => import("../pages/account/ConfirmedEventsPage"),
);
const CatalogManagementPage = lazy(
  () => import("../pages/account/CatalogManagementPage"),
);
const FeedPage = lazy(() => import("../pages/social/FeedPage"));
const OpportunitiesPage = lazy(
  () => import("../pages/social/OpportunitiesPage"),
);
export default function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <UIProvider>
          <SavedEventsProvider>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/feed" element={<FeedPage />} />
              <Route path="/discover" element={<DiscoverPage />} />
              <Route path="/events/:id" element={<EventDetailsPage />} />
              <Route
                path="/organizers/:profileId"
                element={<ProfilePage kind="organizer" />}
              />
              <Route
                path="/vendors/:profileId"
                element={<ProfilePage kind="vendor" />}
              />
              <Route path="/opportunities" element={<OpportunitiesPage />} />
              <Route path="/login" element={<AuthPage />} />
              <Route path="/register" element={<AuthPage registering />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/saved-events" element={<SavedEventsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/profile/edit" element={<EditProfilePage />} />
                <Route
                  path="/organizer/profile/edit"
                  element={
                    <Navigate to="/profile/edit?section=organizer" replace />
                  }
                />
                <Route path="/my-applications" element={<ApplicationsPage />} />
                <Route path="/applications" element={<ApplicationsPage />} />
                <Route element={<ProtectedRoute requireOrganizer />}>
                  <Route path="/my-events" element={<MyEventsPage />} />
                  <Route
                    path="/posts/new"
                    element={<OrganizerAnnouncementsPage />}
                  />
                  <Route
                    path="/events/new"
                    element={<OrganizerEventFormPage />}
                  />
                  <Route
                    path="/events/:eventId/edit"
                    element={<OrganizerEventFormPage />}
                  />
                  <Route
                    path="/events/:eventId/posts"
                    element={<OrganizerAnnouncementsPage />}
                  />
                  <Route
                    path="/events/:eventId/vendor-call"
                    element={<OrganizerVendorCallsPage />}
                  />
                  <Route
                    path="/events/:eventId/applications"
                    element={<ApplicationsPage />}
                  />
                  <Route path="/catalog" element={<CatalogManagementPage />} />
                  <Route
                    path="/organizer"
                    element={<Navigate to="/profile" replace />}
                  />
                  <Route
                    path="/organizer/events/new"
                    element={<Navigate to="/events/new" replace />}
                  />
                  <Route
                    path="/organizer/events/:eventId/edit"
                    element={<OrganizerEventFormPage />}
                  />
                  <Route
                    path="/organizer/announcements"
                    element={<OrganizerAnnouncementsPage />}
                  />
                  <Route
                    path="/organizer/vendor-calls"
                    element={<OrganizerVendorCallsPage />}
                  />
                </Route>
                <Route
                  path="/vendor-application/:vendorCallId"
                  element={<VendorApplicationPage />}
                />
                <Route
                  path="/vendor/applications"
                  element={<Navigate to="/my-applications" replace />}
                />
                <Route
                  path="/confirmed-events"
                  element={<ConfirmedEventsPage />}
                />
                <Route
                  path="/vendor/confirmed-events"
                  element={<Navigate to="/confirmed-events" replace />}
                />
                <Route
                  path="/track-application"
                  element={<Navigate to="/my-applications" replace />}
                />
              </Route>
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
          </SavedEventsProvider>
        </UIProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
