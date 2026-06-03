import { useState } from "react";
import { FaShoppingBasket } from "react-icons/fa";
import { formatCurrency, resolveAssetUrl } from "../../../utils";

const DishImage = ({ src, alt }) => {
    const [isFallback, setIsFallback] = useState(false);

    if (isFallback || !src) {
        return <div className="grid h-full w-full place-items-center text-sm text-slate-500">Image placeholder</div>;
    }

    return (
        <img
            src={src}
            alt={alt}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            onError={() => setIsFallback(true)}
        />
    );
};

const ProductCard = ({ product, onOpenDetail, onAddToCart }) => {
    return (
        <article
            className="group flex w-[245px] cursor-pointer flex-col rounded-2xl border-8 border-white bg-white shadow-md transition duration-300 hover:-translate-y-1 hover:shadow-lg"
            onClick={() => onOpenDetail(product._id)}
        >
            <div className="aspect-square w-full overflow-hidden rounded-xl bg-slate-100">
                <DishImage src={resolveAssetUrl(product.imageUrl)} alt={product.name} />
            </div>
            <div className="flex flex-1 flex-col items-center gap-2 p-4 text-center">
                <h3 className="line-clamp-2 min-h-[56px] text-lg font-semibold leading-7 text-slate-800 sm:text-xl">{product.name}</h3>
                <p className="text-lg font-light text-orange-500">{formatCurrency(product.price)}</p>
                <button
                    onClick={(event) => onAddToCart(product, event)}
                    className={`mt-1 inline-flex min-w-[132px] items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition ${product.isAvailable !== false ? "bg-orange-500 hover:bg-orange-600" : "cursor-not-allowed bg-slate-400"
                        }`}
                    disabled={product.isAvailable === false}
                >
                    {product.isAvailable === false ? "Tạm hết món" : "Đặt ngay"}
                    {product.isAvailable !== false && <FaShoppingBasket className="text-xs" />}
                </button>
            </div>
        </article>
    );
};

export default ProductCard;