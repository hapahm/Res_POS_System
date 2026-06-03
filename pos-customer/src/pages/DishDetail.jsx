import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";

import CustomerHeader from "../components/customer/CustomerHeader";
import Footer from "../components/customer/Footer";
import { getDishById } from "../https";
import { addItems } from "../redux/slices/cartSlice";
import { formatCurrency, resolveAssetUrl } from "../utils";

const DishDetail = () => {
    const { dishId } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [quantity, setQuantity] = useState(1);

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ["dish", dishId],
        queryFn: async () => await getDishById(dishId),
        enabled: Boolean(dishId),
    });

    const dish = data?.data?.data;

    const addToCart = () => {
        if (!dish) return;
        if (dish.isAvailable === false) {
            enqueueSnackbar("Món này hiện tạm hết.", { variant: "warning" });
            return;
        }

        const unitPrice = Number(dish.price) || 0;
        dispatch(
            addItems({
                id: `${dish._id}`,
                name: dish.name,
                pricePerQuantity: unitPrice,
                quantity,
                price: unitPrice * quantity,
                notes: "",
                dishId: dish._id,
                imageUrl: resolveAssetUrl(dish.imageUrl || ""),
            })
        );

        enqueueSnackbar("Đã thêm món vào giỏ.", { variant: "success" });
    };

    return (
        <main className="min-h-screen bg-slate-100 text-slate-800">
            <CustomerHeader />

            <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
                {isLoading ? (
                    <div className="bg-white p-6 text-sm text-slate-500 shadow-sm">Đang tải thông tin món...</div>
                ) : isError ? (
                    <div className="bg-red-50 p-6 text-sm text-red-600 shadow-sm">
                        Không thể tải chi tiết món.
                        <button className="ml-3 rounded-md bg-red-500 px-3 py-1 text-xs font-medium text-white" onClick={() => refetch()}>
                            Thử lại
                        </button>
                    </div>
                ) : !dish ? (
                    <div className="bg-white p-6 text-sm text-slate-500 shadow-sm">Không tìm thấy món.</div>
                ) : (
                    <div className="grid gap-7 bg-white p-5 shadow-sm md:grid-cols-2 md:p-7 lg:p-8">
                        <div className="overflow-hidden bg-slate-100">
                            {dish.imageUrl ? (
                                <img src={resolveAssetUrl(dish.imageUrl)} alt={dish.name} className="h-[320px] w-full object-cover sm:h-[420px]" />
                            ) : (
                                <div className="grid h-80 place-items-center text-sm text-slate-500">Image placeholder</div>
                            )}
                        </div>
                        <div className="space-y-5">
                            <h1 className="text-3xl font-bold text-slate-800">{dish.name}</h1>
                            <p className="text-3xl font-bold text-orange-500">{formatCurrency(dish.price)}</p>
                            <p className="text-base leading-7 text-slate-600">{dish.description || "Món ăn đặc trưng với hương vị tươi mới."}</p>
                            <p className="text-sm text-slate-500">Danh mục: {dish.category?.name || "Chưa rõ"}</p>

                            <div className="flex items-center gap-3">
                                <button
                                    className="h-10 w-10 bg-slate-100 text-lg font-semibold text-slate-700 transition hover:bg-slate-200"
                                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                                >
                                    -
                                </button>
                                <span className="min-w-8 text-center text-lg font-semibold">{quantity}</span>
                                <button className="h-10 w-10 bg-slate-100 text-lg font-semibold text-slate-700 transition hover:bg-slate-200" onClick={() => setQuantity((prev) => prev + 1)}>
                                    +
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <button
                                    className={`rounded-full px-5 py-2.5 text-sm font-semibold text-white ${dish.isAvailable === false ? "cursor-not-allowed bg-slate-400" : "bg-orange-500 hover:bg-orange-600"
                                        }`}
                                    onClick={addToCart}
                                    disabled={dish.isAvailable === false}
                                >
                                    {dish.isAvailable === false ? "Tạm hết món" : "Thêm vào giỏ"}
                                </button>
                                <button className="rounded-full bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200" onClick={() => navigate("/cart")}>
                                    Đi tới giỏ hàng
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </section>

            <Footer />
        </main>
    );
};

export default DishDetail;