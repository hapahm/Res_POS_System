import { useEffect, useMemo, useRef, useState } from "react";
import { FiMenu, FiSearch, FiShoppingCart, FiUser } from "react-icons/fi";
import { MdKeyboardArrowDown } from "react-icons/md";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useMutation } from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";

import { logout } from "../../../https";
import { removeUser } from "../../../redux/slices/customerUserSlice";

import logo from "../../../assets/images/logo2.png";

const MENU_ITEMS = [
    { label: "Trang chủ", path: "/", key: "home" },
    { label: "Giới thiệu", path: "/gioi-thieu", key: "about" },
    { label: "Thực đơn", path: "/thuc-don", key: "menu" },
    { label: "Blog", path: "/blog", key: "blog" },
];

const Header = ({ searchKeyword = "", onSearchChange = () => { } }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isSearchOpenMobile, setIsSearchOpenMobile] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const userMenuRef = useRef(null);
    const cartItems = useSelector((state) => state.cart || []);
    const { isAuth } = useSelector((state) => state.user || {});
    const isQrFlow = location.pathname.startsWith("/qr-order") || location.pathname.startsWith("/qr/cart");

    const cartCount = useMemo(
        () => cartItems.reduce((total, item) => total + (Number(item.quantity) || 1), 0),
        [cartItems]
    );

    const isMenuActive = (menuKey) => {
        const { pathname } = location;
        if (menuKey === "home") return pathname === "/";
        if (menuKey === "menu") return pathname.startsWith("/thuc-don") || pathname.startsWith("/mon/") || pathname.startsWith("/cart") || pathname.startsWith("/qr-order") || pathname.startsWith("/qr/cart");
        if (menuKey === "about") return pathname.startsWith("/gioi-thieu");
        if (menuKey === "blog") return pathname.startsWith("/blog");
        return false;
    };

    const handleNavigate = (path) => {
        navigate(path);
        setIsMobileMenuOpen(false);
        setIsUserMenuOpen(false);
    };

    const logoutMutation = useMutation({
        mutationFn: () => logout(),
        onSuccess: () => {
            dispatch(removeUser());
            enqueueSnackbar("Đăng xuất thành công.", { variant: "success" });
            navigate("/");
            setIsUserMenuOpen(false);
        },
        onError: () => {
            dispatch(removeUser());
            navigate("/");
            setIsUserMenuOpen(false);
        },
    });

    const handleUserIconClick = () => {
        if (!isAuth) {
            navigate("/auth");
            return;
        }

        setIsUserMenuOpen((prev) => !prev);
    };

    const handleLogout = () => {
        logoutMutation.mutate();
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setIsUserMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="mx-auto flex h-20 w-full max-w-[1500px] items-center justify-between px-4 sm:h-24 sm:px-8 lg:px-12">
                <button className="md:hidden" onClick={() => setIsMobileMenuOpen((prev) => !prev)} aria-label="Mở menu">
                    <FiMenu className="text-3xl text-slate-700" />
                </button>

                <button className="flex items-center gap-3" onClick={() => handleNavigate("/")}>
                    <img src={logo} alt="KCHICK logo" className="h-11 w-11 rounded-full object-cover sm:h-12 sm:w-12" />
                    <span className="hidden text-xl font-semibold tracking-wide text-orange-500 sm:block">KCHICK</span>
                </button>

                <nav className="hidden flex-1 items-center justify-center gap-9 px-6 md:flex lg:gap-11">
                    {MENU_ITEMS.map((item) => (
                        <button
                            key={item.key}
                            onClick={() => handleNavigate(item.path)}
                            className={`text-lg font-semibold uppercase tracking-wide transition-colors ${isMenuActive(item.key) ? "text-orange-500" : "text-slate-600 hover:text-orange-400"
                                }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className="flex items-center gap-3 text-slate-600 sm:gap-5">
                    <div className="hidden items-center rounded-lg border border-slate-200 bg-white px-3 py-2 lg:flex">
                        <FiSearch className="mr-2 text-lg text-slate-400" />
                        <input
                            type="text"
                            value={searchKeyword}
                            onChange={(event) => onSearchChange(event.target.value)}
                            placeholder="Tìm món ăn..."
                            className="w-56 bg-transparent text-sm text-slate-700 outline-none"
                        />
                    </div>
                    <button
                        aria-label="Giỏ hàng"
                        className="relative transition hover:text-orange-500"
                        onClick={() => handleNavigate(isQrFlow ? "/qr/cart" : "/cart")}
                    >
                        <FiShoppingCart className="text-2xl" />
                        <span className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-orange-500 px-1 text-[10px] font-semibold text-white">
                            {cartCount}
                        </span>
                    </button>
                    {!isQrFlow && (
                        <div className="relative" ref={userMenuRef}>
                            <button aria-label="Tài khoản" className="transition hover:text-orange-500" onClick={handleUserIconClick}>
                                <FiUser className="text-2xl" />
                            </button>
                            {isAuth && isUserMenuOpen && (
                                <div className="absolute right-0 top-8 z-50 w-44 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                                    <button
                                        onClick={() => handleNavigate("/orders")}
                                        className="w-full rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                                    >
                                        Đơn hàng của tôi
                                    </button>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                                    >
                                        Đăng xuất
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                    <button
                        aria-label="Tìm kiếm"
                        className="transition hover:text-orange-500 lg:hidden"
                        onClick={() => setIsSearchOpenMobile((prev) => !prev)}
                    >
                        <FiSearch className="text-2xl" />
                    </button>
                    <button className="hidden items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-sm font-semibold sm:flex">
                        VN <MdKeyboardArrowDown className="text-lg" />
                    </button>
                </div>
            </div>

            {isSearchOpenMobile && (
                <div className="border-t border-slate-200 bg-white px-4 py-3 lg:hidden">
                    <div className="flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2">
                        <FiSearch className="mr-2 text-lg text-slate-400" />
                        <input
                            type="text"
                            value={searchKeyword}
                            onChange={(event) => onSearchChange(event.target.value)}
                            placeholder="Tìm món ăn..."
                            className="w-full bg-transparent text-sm text-slate-700 outline-none"
                        />
                    </div>
                </div>
            )}

            {isMobileMenuOpen && (
                <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
                    <div className="flex flex-col gap-2">
                        {MENU_ITEMS.map((item) => (
                            <button
                                key={item.key}
                                onClick={() => handleNavigate(item.path)}
                                className={`rounded-md px-2 py-2 text-left text-sm font-medium transition ${isMenuActive(item.key) ? "bg-orange-50 text-orange-500" : "text-slate-600 hover:bg-slate-50"
                                    }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;