import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { ChatProvider } from "./context/ChatContext";
import LoginPage from "./pages/LoginPage";
import ChatPage from "./pages/ChatPage";

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="full-screen-center">Loading…</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage mode="login" />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <LoginPage mode="register" />} />
      <Route
        path="/"
        element={
          user ? (
            <ChatProvider>
              <ChatPage />
            </ChatProvider>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route path="*" element={<Navigate to={user ? "/" : "/login"} replace />} />
      <Route path="/forgot-password" element={<LoginPage mode="forgot-password" />} />
<Route path="/reset-password/:token" element={<LoginPage mode="reset-password" />} />
    </Routes>
  );
}