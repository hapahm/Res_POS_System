import { useEffect, useMemo, useState } from "react";
import { FiTag } from "react-icons/fi";
import { formatCurrency, resolveAssetUrl } from "../../../utils";

const PopularDishesSection = ({ products = [], onOpenDetail, onAddToCart }) => {
    const [currentPage, setCurrentPage] = useState(0);
    const [cardsPerPage, setCardsPerPage] = useState(3);
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        const updateCardsPerPage = () => {
            if (window.innerWidth < 768) {
                setCardsPerPage(1);
                return;
            }
            if (window.innerWidth < 1024) {
                setCardsPerPage(2);
                return;
            }
            setCardsPerPage(3);
        };

        updateCardsPerPage();
        window.addEventListener("resize", updateCardsPerPage);
        return () => window.removeEventListener("resize", updateCardsPerPage);
    }, []);

    const pages = useMemo(() => {
        const chunks = [];
        for (let index = 0; index < products.length; index += cardsPerPage) {
            chunks.push(products.slice(index, index + cardsPerPage));
        }
        return chunks;
    }, [products, cardsPerPage]);

    useEffect(() => {
        setCurrentPage((prev) => Math.min(prev, Math.max(pages.length - 1, 0)));
    }, [pages.length]);

    useEffect(() => {
        if (pages.length <= 1 || isPaused) return undefined;

        const timerId = window.setInterval(() => {
            setCurrentPage((prev) => (prev + 1) % pages.length);
        }, 4300);

        return () => window.clearInterval(timerId);
    }, [pages.length, isPaused]);

    if (!products.length) return null;

    return (
        <section className="bg-[#f5f5f5] py-14 sm:py-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <h2 className="text-center text-4xl font-bold italic uppercase tracking-[0.2em] text-orange-500">MÓN PHỔ BIẾN</h2>

                <div
                    className="mt-10 overflow-hidden"
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                >
                    <div
                        className="flex transition-transform duration-700 ease-out"
                        style={{ transform: `translateX(-${currentPage * 100}%)` }}
                    >
                        {pages.map((page, pageIndex) => (
                            <div key={`page-${pageIndex}`} className="w-full shrink-0">
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {page.map((dish) => (
                                        <article
                                            key={dish._id}
                                            className="cursor-pointer overflow-hidden rounded-none border border-[#dddddd] bg-[#f7f7f7] transition hover:-translate-y-1"
                                            onClick={() => onOpenDetail?.(dish._id)}
                                        >
                                            <img src={resolveAssetUrl(dish.imageUrl)} alt={dish.name} className="h-64 w-full object-cover" />
                                            <div className="p-5">
                                                <h3 className="line-clamp-2 text-2xl font-semibold uppercase leading-8 text-orange-500">{dish.name}</h3>
                                                <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
                                                    {dish.description || "Món ăn nổi bật được nhiều khách hàng lựa chọn tại KCHICK."}
                                                </p>

                                                <div className="mt-4 flex items-center justify-between gap-4 text-sm italic text-slate-500">
                                                    <span className="inline-flex items-center gap-1.5">
                                                        <FiTag className="text-base" />
                                                        {formatCurrency(dish.price)}
                                                    </span>
                                                    <button
                                                        className={`rounded-full px-4 py-1.5 text-xs font-semibold text-white ${dish.isAvailable !== false ? "bg-orange-500 hover:bg-orange-600" : "bg-slate-400"}`}
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            onAddToCart?.(dish, event);
                                                        }}
                                                        disabled={dish.isAvailable === false}
                                                    >
                                                        {dish.isAvailable === false ? "Tạm hết" : "Đặt ngay"}
                                                    </button>
                                                </div>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {pages.length > 1 && (
                    <div className="mt-8 flex items-center justify-center gap-2">
                        {pages.map((_, index) => (
                            <button
                                key={`dot-${index}`}
                                className={`h-2.5 w-2.5 rounded-full transition ${index === currentPage ? "bg-orange-500" : "bg-slate-400"
                                    }`}
                                onClick={() => setCurrentPage(index)}
                                aria-label={`Trang món phổ biến ${index + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default PopularDishesSection;
