import {
  BrowserRouter,
  Route,
  Routes,
} from "react-router-dom";

import HomePage from "../pages/public/HomePage";
import DiscoverPage from "../pages/public/DiscoverPage";
import EventDetailsPage from "../pages/public/EventDetailsPage";
import VendorApplicationPage from "../pages/public/VendorApplicationPage";
import TrackApplicationPage from "../pages/public/TrackApplicationPage";
import NotFoundPage from "../pages/public/NotFoundPage";

import OrganizerDashboardPage from "../pages/organizer/OrganizerDashboardPage";
import OrganizerEventFormPage from "../pages/organizer/OrganizerEventFormPage";
import OrganizerVendorCallsPage from "../pages/organizer/OrganizerVendorCallsPage";
import OrganizerAnnouncementsPage from "../pages/organizer/OrganizerAnnouncementsPage";

import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import AdminManagementPage from "../pages/admin/AdminManagementPage";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC */}
        <Route
          path="/"
          element={<HomePage />}
        />

        <Route
          path="/discover"
          element={<DiscoverPage />}
        />

        <Route
          path="/events/:id"
          element={
            <EventDetailsPage />
          }
        />

        <Route
          path="/vendor-application/:vendorCallId"
          element={
            <VendorApplicationPage />
          }
        />

        <Route
          path="/track-application"
          element={
            <TrackApplicationPage />
          }
        />

        {/* ORGANIZER */}
        <Route
          path="/organizer"
          element={
            <OrganizerDashboardPage />
          }
        />

        <Route
          path="/organizer/events/new"
          element={
            <OrganizerEventFormPage />
          }
        />

        <Route
          path="/organizer/events/:eventId/edit"
          element={
            <OrganizerEventFormPage />
          }
        />

        <Route
        path="/organizer/vendor-calls"
        element={<OrganizerVendorCallsPage />}
        />

        <Route
        path="/organizer/announcements"
        element={<OrganizerAnnouncementsPage />}
        />

        {/* ADMIN */}
        <Route
          path="/admin"
          element={
            <AdminDashboardPage />
          }
        />

        <Route
        path="/admin/manage"
        element={<AdminManagementPage />
        }
        />

        {/* NOT FOUND */}
        <Route
          path="*"
          element={<NotFoundPage />}
        />
      </Routes>
    </BrowserRouter>
  );
}