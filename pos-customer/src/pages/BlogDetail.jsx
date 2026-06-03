import { Link, useParams } from "react-router-dom";
import { FiClock, FiEye } from "react-icons/fi";
import Header from "../components/customer/home/Header";
import Footer from "../components/customer/Footer";
import { BLOG_POSTS, getBlogPostBySlug } from "../constants/blogMockData";

const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
};

const BlogDetail = () => {
    const { slug } = useParams();
    const post = getBlogPostBySlug(slug);

    if (!post) {
        return (
            <main className="min-h-screen bg-slate-100 text-slate-800">
                <Header />
                <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
                    <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
                        <h1 className="text-3xl font-bold text-slate-900">Không tìm thấy bài viết</h1>
                        <p className="mt-3 text-sm text-slate-600">Bài viết bạn đang tìm có thể đã bị xoá hoặc URL không đúng.</p>
                        <Link
                            to="/blog"
                            className="mt-6 inline-flex rounded-full bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
                        >
                            Quay về trang Blog
                        </Link>
                    </div>
                </section>
                <Footer />
            </main>
        );
    }

    const relatedPosts = BLOG_POSTS.filter((item) => item.slug !== post.slug).slice(0, 3);

    return (
        <main className="min-h-screen bg-slate-100 text-slate-800">
            <Header />

            <article className="mx-auto max-w-5xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
                <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
                    <img src={post.image} alt={post.title} className="h-[300px] w-full object-cover sm:h-[420px]" />

                    <div className="p-6 sm:p-10">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-500">{post.category}</p>
                        <h1 className="mt-3 text-3xl font-bold leading-tight text-slate-900 sm:text-5xl">{post.title}</h1>

                        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
                            <span>{formatDate(post.publishedAt)}</span>
                            <span className="inline-flex items-center gap-1.5">
                                <FiClock className="text-base" />
                                {post.readTimeMinutes} phút đọc
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <FiEye className="text-base" />
                                {post.viewCount} lượt xem
                            </span>
                            <span>Tác giả: {post.author}</span>
                        </div>

                        <p className="mt-6 text-lg leading-8 text-slate-700">{post.excerpt}</p>

                        {post.highlights?.length ? (
                            <div className="mt-7 flex flex-wrap gap-2">
                                {post.highlights.map((item) => (
                                    <span
                                        key={item}
                                        className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700"
                                    >
                                        {item}
                                    </span>
                                ))}
                            </div>
                        ) : null}

                        <div className="mt-10 space-y-10">
                            {post.content?.map((section) => (
                                <section key={section.heading}>
                                    <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">{section.heading}</h2>
                                    <div className="mt-4 space-y-4">
                                        {section.paragraphs?.map((paragraph, index) => (
                                            <p key={`${section.heading}-${index}`} className="text-base leading-8 text-slate-700 sm:text-lg sm:leading-9">
                                                {paragraph}
                                            </p>
                                        ))}
                                    </div>
                                </section>
                            ))}
                        </div>
                    </div>
                </div>
            </article>

            <section className="mx-auto max-w-5xl px-4 pb-16 sm:px-6 lg:px-8">
                <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
                    <div className="flex items-center justify-between gap-3">
                        <h3 className="text-2xl font-bold text-slate-900">Bài viết liên quan</h3>
                        <Link to="/blog" className="text-sm font-semibold text-orange-600 hover:text-orange-700">
                            Xem tất cả
                        </Link>
                    </div>

                    <div className="mt-6 grid gap-5 md:grid-cols-3">
                        {relatedPosts.map((item) => (
                            <Link
                                key={item.id}
                                to={`/blog/${item.slug}`}
                                className="overflow-hidden rounded-2xl bg-slate-50 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                            >
                                <img src={item.image} alt={item.title} className="h-44 w-full object-cover" />
                                <div className="p-4">
                                    <h4 className="line-clamp-2 text-base font-bold text-slate-900">{item.title}</h4>
                                    <p className="mt-2 text-xs text-slate-500">{formatDate(item.publishedAt)}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
};

export default BlogDetail;
