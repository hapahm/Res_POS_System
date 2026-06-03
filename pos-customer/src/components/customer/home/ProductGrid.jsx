import ProductCard from "./ProductCard";

const ProductGrid = ({ products, isLoading, isError, searchKeyword = "", onOpenDetail, onAddToCart }) => {
    const hasSearch = `${searchKeyword || ""}`.trim().length > 0;

    return (
        <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
            {isLoading ? (
                <div className="rounded-xl border border-white/20 bg-white/95 p-5 text-sm text-slate-500">Đang tải món ăn...</div>
            ) : isError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-600">Không thể tải món ăn từ máy chủ.</div>
            ) : products.length === 0 ? (
                <div className="rounded-xl border border-white/20 bg-white/95 p-5 text-sm text-slate-500">
                    {hasSearch ? "Không tìm thấy món phù hợp với từ khóa tìm kiếm." : "Danh mục này hiện chưa có món."}
                </div>
            ) : (
                <div className="flex flex-wrap justify-center gap-5">
                    {products.map((product) => (
                        <ProductCard
                            key={product._id}
                            product={product}
                            onOpenDetail={onOpenDetail}
                            onAddToCart={onAddToCart}
                        />
                    ))}
                </div>
            )}
        </section>
    );
};

export default ProductGrid;