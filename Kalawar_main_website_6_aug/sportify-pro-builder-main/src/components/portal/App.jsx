import React from "react";
import { useApp } from "./context/AppContext";

// Common layout components
import RoleSwitcherBar from "./components/common/RoleSwitcherBar";
import Navbar from "./components/common/Navbar";
import Footer from "./components/common/Footer";
import ToastContainer from "./components/common/ToastContainer";

// Views
import HeroCarousel from "./components/carousel/HeroCarousel";
import HomeView from "./components/home/HomeView";
import GymDirectory from "./components/gym/GymDirectory";
import GymAdminDashboard from "./components/gym/GymAdminDashboard";
import AcademyDirectory from "./components/academy/AcademyDirectory";
import AcademyAdminDashboard from "./components/academy/AcademyAdminDashboard";
import MediaFeed from "./components/media/MediaFeed";
import SuperAdminDashboard from "./components/admin/SuperAdminDashboard";

// Modals
import GymPartnerModal from "./components/gym/GymPartnerModal";
import GymDetailsModal from "./components/gym/GymDetailsModal";
import AcademyPartnerModal from "./components/academy/AcademyPartnerModal";
import AcademyDetailsModal from "./components/academy/AcademyDetailsModal";
import GatekeeperModal from "./components/media/GatekeeperModal";
import MediaUploadModal from "./components/media/MediaUploadModal";
import AdminLoginModal from "./components/admin/AdminLoginModal";
import UnifiedAuthModal from "./components/common/UnifiedAuthModal";

export default function App() {
  const { activeView } = useApp();

  return (
    <div className="min-h-screen bg-obsidian-950 text-white flex flex-col font-sans selection:bg-gold-500 selection:text-obsidian-950">
      {/* 1. Top Role Switcher Demo Toolbar */}
      <RoleSwitcherBar />

      {/* 2. Glassmorphic Navigation Bar */}
      <Navbar />

      {/* 3. Main View Orchestrator */}
      <main className="flex-grow">
        {activeView === "home" && (
          <>
            <HeroCarousel />
            <HomeView />
          </>
        )}

        {activeView === "gym" && <GymDirectory />}
        {activeView === "gym_admin" && <GymAdminDashboard />}

        {activeView === "academy" && <AcademyDirectory />}
        {activeView === "academy_admin" && <AcademyAdminDashboard />}

        {activeView === "media" && <MediaFeed />}

        {activeView === "super_admin" && <SuperAdminDashboard />}
      </main>

      {/* 4. Footer with Admin Redirect Link */}
      <Footer />

      {/* 5. Modals */}
      <GymPartnerModal />
      <GymDetailsModal />
      <AcademyPartnerModal />
      <AcademyDetailsModal />
      <GatekeeperModal />
      <MediaUploadModal />
      <AdminLoginModal />
      <UnifiedAuthModal />

      {/* 6. Real-time Toast Notifications */}
      <ToastContainer />
    </div>
  );
}
