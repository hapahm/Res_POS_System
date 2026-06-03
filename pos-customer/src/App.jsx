import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import { useEffect } from "react";
import HomeCustomer from "./pages/HomeCustomer";
import About from "./pages/About";
import DishDetail from "./pages/DishDetail";
import Cart from "./pages/Cart";
import Blog from "./pages/Blog";
import BlogDetail from "./pages/BlogDetail";
import Auth from "./pages/Auth";
import Orders from "./pages/Orders";
import Tables from "./pages/Tables";
import Menu from "./pages/Menu";
import PaymentResult from "./pages/PaymentResult";
import Header from "./components/shared/Header";
import CustomerChatWidget from "./components/chat/CustomerChatWidget";
import { useDispatch, useSelector } from "react-redux";
import useLoadData from "./hooks/useLoadData";
import CustomerFullScreenLoader from "./components/shared/CustomerFullScreenLoader";
import { updateTable } from "./redux/slices/customerSessionSlice";

const OBJECT_ID_REGEX = /^[a-f0-9]{24}$/i;

function Layout() {
  const isLoading = useLoadData();
  const location = useLocation();
  const dispatch = useDispatch();
  const hideHeaderRoutes = ["/", "/gioi-thieu", "/nha-hang", "/thuc-don", "/blog", "/cart", "/orders", "/qr/cart", "/qr-order", "/auth", "/payment-result"];
  const hideHeaderRoutePrefixes = ["/mon/", "/blog/"];
  const hideChatWidgetRoutes = ["/auth", "/payment-result", "/qr-order", "/qr/cart"];
  const hideChatWidgetRoutePrefixes = [];
  const shouldHideLegacyHeader =
    hideHeaderRoutes.includes(location.pathname) ||
    hideHeaderRoutePrefixes.some((prefix) => location.pathname.startsWith(prefix));
  const shouldHideChatWidget =
    hideChatWidgetRoutes.includes(location.pathname) ||
    hideChatWidgetRoutePrefixes.some((prefix) => location.pathname.startsWith(prefix));
  const { isAuth } = useSelector(state => state.user);
  const selectedTable = useSelector((state) => state.customer?.table);

  useEffect(() => {
    const qrPaths = ["/qr-order", "/qr/cart"];
    if (!qrPaths.includes(location.pathname)) return;

    const query = new URLSearchParams(location.search || "");
    const tableId = `${query.get("tableId") || ""}`.trim();
    const tableNo = `${query.get("tableNo") || ""}`.trim();

    if (!OBJECT_ID_REGEX.test(tableId)) return;

    const currentTableId = `${selectedTable?.tableId || selectedTable?._id || ""}`;
    const currentTableNo = `${selectedTable?.tableNo || ""}`;
    if (currentTableId === tableId && currentTableNo === tableNo) return;

    dispatch(
      updateTable({
        table: {
          tableId,
          tableNo,
        },
      })
    );
  }, [location.pathname, location.search, dispatch, selectedTable]);

  if (isLoading) return <CustomerFullScreenLoader />

  return (
    <>
      {!shouldHideLegacyHeader && <Header />}
      <Routes>
        <Route path="/" element={<HomeCustomer />} />
        <Route
          path="/gioi-thieu"
          element={<About />}
        />
        <Route path="/nha-hang" element={<Navigate to="/gioi-thieu" replace />} />
        <Route
          path="/thuc-don"
          element={<HomeCustomer />}
        />
        <Route
          path="/blog"
          element={<Blog />}
        />
        <Route path="/blog/:slug" element={<BlogDetail />} />
        <Route path="/mon/:dishId" element={<DishDetail />} />
        <Route
          path="/cart"
          element={
            <ProtectedRoutes>
              <Cart />
            </ProtectedRoutes>
          }
        />
        <Route path="/qr-order" element={<HomeCustomer />} />
        <Route path="/qr/cart" element={<Cart qrMode />} />
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
          path="/payment-result"
          element={<PaymentResult />}
        />
        <Route path="*" element={<div>Not Found</div>} />
      </Routes>
      {!shouldHideChatWidget && <CustomerChatWidget />}
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

function App() {
  return (
    <Router>
      <Layout />
    </Router>
  );
}

export default App;
