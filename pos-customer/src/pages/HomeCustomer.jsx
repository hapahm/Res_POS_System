import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import { enqueueSnackbar } from "notistack";

import { addItems } from "../redux/slices/cartSlice";
import { getCategories, getDishes } from "../https";
import Header from "../components/customer/home/Header";
import Hero from "../components/customer/home/Hero";
import CategoryTabs from "../components/customer/home/CategoryTabs";
import ProductGrid from "../components/customer/home/ProductGrid";
import BlogSection from "../components/customer/home/BlogSection";
import PopularDishesSection from "../components/customer/home/PopularDishesSection";
import Footer from "../components/customer/Footer";
import { resolveAssetUrl } from "../utils";
import heroBg from "../assets/images/restaurant-img.jpg";
import menuBg from "../assets/images/nền.jpg";
import heroDishOne from "../assets/images/butter-chicken-4.jpg";
import heroDishTwo from "../assets/images/hyderabadibiryani.jpg";
import heroDishThree from "../assets/images/masala-dosa.jpg";

const ALL_CATEGORY_ID = "all";

const HomeCustomer = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const [activeCategoryId, setActiveCategoryId] = useState(ALL_CATEGORY_ID);
    const [searchKeyword, setSearchKeyword] = useState("");

    const {
        data: categoriesResponse,
        isLoading: isCategoriesLoading,
        isError: isCategoriesError,
        refetch: refetchCategories,
    } = useQuery({
        queryKey: ["home", "categories"],
        queryFn: async () => await getCategories(),
        placeholderData: keepPreviousData,
    });

    const {
        data: dishesResponse,
        isLoading: isDishesLoading,
        isError: isDishesError,
        refetch: refetchDishes,
    } = useQuery({
        queryKey: ["home", "dishes"],
        queryFn: async () => await getDishes(),
        placeholderData: keepPreviousData,
    });

    const categories = useMemo(() => categoriesResponse?.data?.data || [], [categoriesResponse]);
    const dishes = useMemo(() => dishesResponse?.data?.data || [], [dishesResponse]);

    const visibleCategories = useMemo(() => {
        const activeOnly = categories.filter((category) => category.isActive !== false);
        return activeOnly.length ? activeOnly : categories;
    }, [categories]);

    useEffect(() => {
        if (!visibleCategories.length) {
            setActiveCategoryId(ALL_CATEGORY_ID);
            return;
        }
        if (`${activeCategoryId}` === ALL_CATEGORY_ID) return;
        const hasSelectedCategory = visibleCategories.some((category) => `${category._id}` === `${activeCategoryId}`);
        if (!hasSelectedCategory) {
            setActiveCategoryId(ALL_CATEGORY_ID);
        }
    }, [visibleCategories, activeCategoryId]);

    const filteredProducts = useMemo(() => {
        const normalizedKeyword = `${searchKeyword || ""}`.trim().toLowerCase();
        const visibleCategoryIds = new Set(visibleCategories.map((category) => `${category._id}`));

        return dishes.filter((dish) => {
            const dishCategoryId = `${dish.category?._id || dish.category || ""}`;
            const dishName = `${dish?.name || ""}`.toLowerCase();
            const dishDescription = `${dish?.description || ""}`.toLowerCase();
            const matchesKeyword =
                !normalizedKeyword ||
                dishName.includes(normalizedKeyword) ||
                dishDescription.includes(normalizedKeyword);

            if (normalizedKeyword) {
                return matchesKeyword;
            }

            if (`${activeCategoryId}` === ALL_CATEGORY_ID) {
                return visibleCategoryIds.has(dishCategoryId);
            }

            return dishCategoryId === `${activeCategoryId}`;
        });
    }, [dishes, activeCategoryId, searchKeyword, visibleCategories]);

    const isLoading = isCategoriesLoading || isDishesLoading;
    const isError = isCategoriesError || isDishesError;
    const shouldShowBlogSection = location.pathname === "/";
    const shouldShowPopularSection = location.pathname === "/thuc-don";

    const popularProducts = useMemo(() => {
        const activeDishes = dishes.filter((dish) => dish?.isAvailable !== false);

        return [...activeDishes]
            .sort((dishA, dishB) => {
                const scoreA = Number(dishA?.orderCount ?? dishA?.totalSold ?? dishA?.soldCount ?? dishA?.popularityScore ?? 0);
                const scoreB = Number(dishB?.orderCount ?? dishB?.totalSold ?? dishB?.soldCount ?? dishB?.popularityScore ?? 0);

                if (scoreB !== scoreA) return scoreB - scoreA;

                const createdAtA = new Date(dishA?.createdAt || 0).getTime();
                const createdAtB = new Date(dishB?.createdAt || 0).getTime();
                return createdAtB - createdAtA;
            })
            .slice(0, 9);
    }, [dishes]);

    const handleAddToCart = (dish, event) => {
        event.stopPropagation();
        if (!dish?.isAvailable) {
            enqueueSnackbar("Món này hiện tạm hết.", { variant: "warning" });
            return;
        }

        const unitPrice = Number(dish.price) || 0;
        dispatch(
            addItems({
                id: `${dish._id}`,
                name: dish.name,
                pricePerQuantity: unitPrice,
                quantity: 1,
                price: unitPrice,
                notes: "",
                dishId: dish._id,
                imageUrl: resolveAssetUrl(dish.imageUrl || ""),
            })
        );

        enqueueSnackbar("Đã thêm món vào giỏ.", { variant: "success" });
    };

    const handleRetryData = () => {
        refetchCategories();
        refetchDishes();
    };

    return (
        <main className="min-h-screen bg-slate-100 text-slate-800">
            <Header searchKeyword={searchKeyword} onSearchChange={setSearchKeyword} />

            <Hero
                backgroundImage={heroBg}
                highlightedDishes={[heroDishOne, heroDishTwo, heroDishThree]}
            />

            <section className="bg-white">
                <div className="mx-auto flex h-14 max-w-7xl items-center justify-center px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold italic uppercase tracking-wide text-orange-500">KCHICK</h2>
                </div>
            </section>

            <section className="relative isolate overflow-hidden py-2 sm:py-4">
                <div
                    className="absolute inset-0 -z-20 bg-cover bg-center"
                    style={{ backgroundImage: `url(${menuBg})` }}
                    aria-hidden="true"
                />
                <CategoryTabs
                    categories={visibleCategories}
                    activeCategoryId={activeCategoryId}
                    onSelectCategory={setActiveCategoryId}
                    isLoading={isLoading}
                    isError={isError}
                    onRetry={handleRetryData}
                    allCategoryId={ALL_CATEGORY_ID}
                />

                <ProductGrid
                    products={filteredProducts}
                    isLoading={isLoading}
                    isError={isError}
                    searchKeyword={searchKeyword}
                    onOpenDetail={(dishId) => navigate(`/mon/${dishId}`)}
                    onAddToCart={handleAddToCart}
                />
            </section>

            {shouldShowPopularSection && (
                <PopularDishesSection
                    products={popularProducts}
                    onOpenDetail={(dishId) => navigate(`/mon/${dishId}`)}
                    onAddToCart={handleAddToCart}
                />
            )}

            {shouldShowBlogSection && <BlogSection />}

            <Footer />
        </main>
    );
};

export default HomeCustomer;