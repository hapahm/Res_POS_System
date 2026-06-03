import Header from "../components/customer/home/Header";
import Hero from "../components/customer/home/Hero";
import Footer from "../components/customer/Footer";
import { BLOG_POSTS } from "../constants/blogMockData";
import { useNavigate } from "react-router-dom";
import { FiClock, FiEye } from "react-icons/fi";
import heroBg from "../assets/images/restaurant-img.jpg";

const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
};

const Blog = () => {
    const navigate = useNavigate();

    return (
        <main className="min-h-screen bg-slate-100 text-slate-800">
            <Header />

            <Hero
                backgroundImage={heroBg}
                highlightedDishes={BLOG_POSTS.slice(0, 3).map((post) => post.image)}
                badgeText="Kchick stories"
                titleText="Blog ẩm thực"
                descriptionText="Các bài viết được tổng hợp để giúp bạn chọn món nhanh, hiểu hơn về hương vị và tối ưu trải nghiệm khi dùng bữa tại KCHICK."
            />

            <section className="bg-white">
                <div className="mx-auto flex h-14 max-w-7xl items-center justify-center px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold italic uppercase tracking-wide text-orange-500">KCHICK</h2>
                </div>
            </section>

            <section className="bg-white py-8 sm:py-10">
                <div className="mx-auto max-w-7xl px-4 pb-16 pt-2 sm:px-6 lg:px-8">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {BLOG_POSTS.map((post) => (
                            <article
                                key={post.id}
                                className="cursor-pointer overflow-hidden rounded-none border border-[#dddddd] bg-[#f7f7f7] transition hover:-translate-y-1"
                                onClick={() => navigate(`/blog/${post.slug}`)}
                            >
                                <img src={post.image} alt={post.title} className="h-64 w-full object-cover" />
                                <div className="p-5">
                                    <h2 className="line-clamp-2 text-2xl font-semibold uppercase leading-8 text-orange-500">{post.title}</h2>
                                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{post.excerpt}</p>

                                    <div className="mt-4 flex items-center gap-4 text-sm italic text-slate-500">
                                        <span className="inline-flex items-center gap-1.5">
                                            <FiEye className="text-base" />
                                            {post.viewCount} Lượt xem
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
            </section>

            <Footer />
        </main>
    );
};

export default Blog;
