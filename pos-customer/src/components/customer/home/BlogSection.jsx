import { useEffect, useMemo, useState } from "react";
import { FiClock, FiEye } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { BLOG_POSTS } from "../../../constants/blogMockData";

const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
};

const BlogSection = () => {
    const navigate = useNavigate();
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
        for (let index = 0; index < BLOG_POSTS.length; index += cardsPerPage) {
            chunks.push(BLOG_POSTS.slice(index, index + cardsPerPage));
        }
        return chunks;
    }, [cardsPerPage]);

    useEffect(() => {
        setCurrentPage((prev) => Math.min(prev, Math.max(pages.length - 1, 0)));
    }, [pages.length]);

    useEffect(() => {
        if (pages.length <= 1 || isPaused) return undefined;

        const timerId = window.setInterval(() => {
            setCurrentPage((prev) => (prev + 1) % pages.length);
        }, 4500);

        return () => window.clearInterval(timerId);
    }, [pages.length, isPaused]);

    return (
        <section className="bg-[#f5f5f5] py-14 sm:py-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <h2 className="text-center text-4xl font-bold italic uppercase tracking-[0.2em] text-orange-500">BLOG</h2>

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
                                    {page.map((post) => (
                                        <article
                                            key={post.id}
                                            className="cursor-pointer overflow-hidden rounded-none border border-[#dddddd] bg-[#f7f7f7] transition hover:-translate-y-1"
                                            onClick={() => navigate(`/blog/${post.slug}`)}
                                        >
                                            <img src={post.image} alt={post.title} className="h-64 w-full object-cover" />
                                            <div className="p-5">
                                                <h3 className="line-clamp-2 text-2xl font-semibold uppercase leading-8 text-orange-500">{post.title}</h3>
                                                <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{post.excerpt}</p>

                                                <div className="mt-4 flex items-center gap-4 text-sm italic text-slate-500">
                                                    <span className="inline-flex items-center gap-1.5">
                                                        <FiEye className="text-base" />
                                                        {post.viewCount} Luot xem
                                                    </span>
                                                    <span className="inline-flex items-center gap-1.5">
                                                        <FiClock className="text-base" />
                                                        {formatDate(post.publishedAt)}
                                                    </span>
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
                                aria-label={`Trang blog ${index + 1}`}
                            />
                        ))}
                    </div>
                )}

                <div className="mt-10 text-center">
                    <button
                        className="inline-flex rounded-full bg-slate-900 px-10 py-3 text-2xl font-medium text-white transition hover:bg-slate-800"
                        onClick={() => navigate("/blog")}
                    >
                        Xem them
                    </button>
                </div>
            </div>
        </section>
    );
};

export default BlogSection;
