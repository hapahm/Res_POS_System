import { MdOutlineGridView } from "react-icons/md";

const CategoryTabs = ({
    categories,
    activeCategoryId,
    onSelectCategory,
    isLoading,
    isError,
    onRetry,
    allCategoryId,
}) => {
    const categoryItems = [
        {
            _id: allCategoryId,
            name: "Tất cả món",
            icon: <MdOutlineGridView className="text-base" />,
        },
        ...categories.map((category) => {
            const normalizedName = `${category.name || ""}`.toLowerCase();
            let icon = "🍽️";
            if (normalizedName.includes("tráng") || normalizedName.includes("dessert")) icon = "🍰";
            if (normalizedName.includes("khai") || normalizedName.includes("salad")) icon = "🥗";
            if (normalizedName.includes("uống") || normalizedName.includes("drink")) icon = "🍹";
            if (normalizedName.includes("mì") || normalizedName.includes("súp") || normalizedName.includes("phở")) icon = "🍜";

            return {
                ...category,
                icon,
            };
        }),
    ];

    return (
        <section className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
            <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                {isLoading ? (
                    <div className="rounded-xl border border-white/20 bg-white/95 p-5 text-sm text-slate-500">Đang tải danh mục...</div>
                ) : isError ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-600">
                        Không thể tải dữ liệu từ máy chủ.
                        <button className="ml-3 rounded-md bg-red-500 px-3 py-1 text-xs font-medium text-white" onClick={onRetry}>
                            Thử lại
                        </button>
                    </div>
                ) : !categories.length ? (
                    <div className="rounded-xl border border-white/20 bg-white/95 p-5 text-sm text-slate-500">Chưa có danh mục nào để hiển thị.</div>
                ) : (
                    <div className="inline-flex min-w-full items-center justify-center border-b border-white/35 pb-3">
                        {categoryItems.map((category, index) => (
                            <div key={category._id} className="flex items-center">
                                <button
                                    onClick={() => onSelectCategory(category._id)}
                                    className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-1.5 text-base font-semibold transition sm:text-lg ${`${activeCategoryId}` === `${category._id}`
                                        ? "bg-white text-orange-500 shadow-sm"
                                        : "text-white hover:bg-white/20"
                                        }`}
                                >
                                    <span>{category.icon}</span>
                                    {category.name}
                                </button>
                                {index < categoryItems.length - 1 && <span className="mx-2 h-6 w-px bg-white/30" />}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default CategoryTabs;