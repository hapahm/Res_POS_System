import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import { Home, Auth, Orders, Tables, Menu, Dashboard, Chat, ChatTest, Payment, PaymentResult, PaymentHistory } from "./pages";
import KitchenDisplay from "./pages/KitchenDisplay";
import Header from "./components/shared/Header";
import AdminChatBubble from "./components/chat/AdminChatBubble";
import { useSelector } from "react-redux";
import useLoadData from "./hooks/useLoadData";
import FullScreenLoader from "./components/shared/FullScreenLoader"

function Layout() {
  const isLoading = useLoadData();
  const location = useLocation();
  const hideHeaderRoutes = ["/auth", "/chat/test", "/kitchen", "/payment-result"];
  const hideChatBubbleRoutes = ["/auth", "/chat/test", "/payment-result", "/staff/chat", "/kitchen"];
  const { isAuth } = useSelector(state => state.user);

  if (isLoading) return <FullScreenLoader />

  return (
    <>
      {!hideHeaderRoutes.includes(location.pathname) && <Header />}
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoutes>
              <Home />
            </ProtectedRoutes>
          }
        />
        <Route path="/auth" element={isAuth ? <Navigate to="/" /> : <Auth />} />
        <Route
          path="/orders"
          element={
            <ProtectedRoutes>
              <Orders />
            </ProtectedRoutes>
          }
        />
        <Route
          path="/tables"
          element={
            <ProtectedRoutes>
              <Tables />
            </ProtectedRoutes>
          }
        />
        <Route
          path="/menu/:tableId"
          element={
            <ProtectedRoutes>
              <Menu />
            </ProtectedRoutes>
          }
        />
        <Route
          path="/menu"
          element={<Navigate to="/tables" />}
        />
        <Route
          path="/payment"
          element={
            <Navigate to="/admin/payment" />
          }
        />
        <Route
          path="/admin/payment"
          element={
            <AdminOrCashierRoutes>
              <Payment />
            </AdminOrCashierRoutes>
          }
        />
        <Route
          path="/admin/payments"
          element={
            <AdminRoutes>
              <PaymentHistory />
            </AdminRoutes>
          }
        />
        <Route
          path="/payment-result"
          element={<PaymentResult />}
        />
        <Route
          path="/dashboard"
          element={
            <AdminRoutes>
              <Dashboard />
            </AdminRoutes>
          }
        />
        <Route
          path="/staff/chat"
          element={
            <ProtectedRoutes>
              <Chat />
            </ProtectedRoutes>
          }
        />
        <Route
          path="/kitchen"
          element={
            <ProtectedRoutes>
              <KitchenDisplay />
            </ProtectedRoutes>
          }
        />
        <Route
          path="/chat/test"
          element={<ChatTest />}
        />
        <Route path="*" element={<div>Not Found</div>} />
      </Routes>
      {isAuth && !hideChatBubbleRoutes.includes(location.pathname) && <AdminChatBubble />}
    </>
  );
}

function ProtectedRoutes({ children }) {
  const { isAuth } = useSelector((state) => state.user);
  if (!isAuth) {
    return <Navigate to="/auth" />;
  }

  return children;
}

function AdminRoutes({ children }) {
  const { isAuth, role } = useSelector((state) => state.user);
  if (!isAuth) {
    return <Navigate to="/auth" />;
  }
  if (role?.toLowerCase() !== "admin") {
    return <Navigate to="/" />;
  }

  return children;
}

function AdminOrCashierRoutes({ children }) {
  const { isAuth, role } = useSelector((state) => state.user);
  if (!isAuth) {
    return <Navigate to="/auth" />;
  }

  const normalizedRole = `${role || ""}`.toLowerCase();
  if (!["admin", "cashier"].includes(normalizedRole)) {
    return <Navigate to="/" />;
  }

  return children;
}

function App() {
  return (
    <Router>
      <Layout />
    </Router>
  );
}

export default App;
