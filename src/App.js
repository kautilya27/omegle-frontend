import { Routes, Route, useLocation } from "react-router-dom"
import HomePage from "./pages/HomePage"
import ChatPage from "./pages/ChatPage"
import AdminDashboard from "./pages/AdminDashboard"
import { ThemeProvider } from "./contexts/ThemeContext"
import "./App.css"
import Header from "./components/Header"
import InfoSection  from "./components/InfoSection"
import FeaturesSection from "./components/FeaturesSection"
import FaqSection from "./components/FaqSection"
import Footer from "./components/Footer"
import PrivacyPolicy from "./components/PrivacyPolicy"
import TermsOfService from "./components/TermsOfService"
import CommunityGuidelines from "./components/CommunityGuidelines"
import ScrollToTop from "./components/ScrollToTop"
import BlogAdmin from "./pages/BlogAdmin";
import BlogList from "./pages/BlogList";
import BlogDetail from "./pages/BlogDetail";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  const location = useLocation();
     // Blog-related paths
   const isAdminAuthenticated = !!localStorage.getItem("adminToken");
    const isBlogPage =
    location.pathname === "/blog" ||
    location.pathname === "/admin/blog" ||
    location.pathname.startsWith("/blog/");

     // Chat page
    const isChatPage = location.pathname === "/chat";


  return (
    <>
      <Header/>
      <ThemeProvider>
      <ScrollToTop />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/community-guidelines" element={<CommunityGuidelines />} />
         <Route path="/admin/blog" element={<ProtectedRoute isAuthenticated={isAdminAuthenticated}>
                  <BlogAdmin />
                </ProtectedRoute>} />
          <Route path="/blog" element={<BlogList />} />
          <Route path="/blog/:slug" element={<BlogDetail />} />
        </Routes>
        {/* Only show these sections if not on /chat */}
        {!isChatPage && !isBlogPage && (
          <>
            <InfoSection />
            <FeaturesSection />
            <FaqSection />
          </>
        )}
      </ThemeProvider>
        {!isBlogPage && <Footer />}
      
    </>
  )
}

export default App
