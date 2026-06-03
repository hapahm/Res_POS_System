import { FiChevronUp, FiMail, FiPhone } from "react-icons/fi";
import { FaFacebookF } from "react-icons/fa";

import footerBanner from "../../assets/images/restaurant-img.jpg";

const Footer = () => {
    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <footer className="relative mt-12 border-t border-slate-300 bg-slate-100 text-slate-800">
            <section className="relative overflow-hidden border-b border-orange-400">
                <img
                    src={footerBanner}
                    alt="Đặt món ngay hôm nay"
                    className="h-48 w-full object-cover sm:h-56"
                    onError={(event) => {
                        event.currentTarget.style.display = "none";
                    }}
                />
                <div className="absolute inset-0 bg-black/65" />

                <div className="absolute inset-0 grid place-items-center px-4 text-center">
                    <div>
                        <h2 className="text-3xl font-bold uppercase tracking-wide text-white sm:text-5xl">Đặt món ngay hôm nay</h2>
                        <button className="mt-6 rounded-full bg-orange-500 px-10 py-3 text-base font-semibold text-white transition hover:bg-orange-600">
                            Đặt ngay
                        </button>
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-3 lg:col-span-2">
                        <h3 className="text-3xl font-semibold text-slate-950">KCHICK RESTAURANT</h3>
                        <p className="text-sm leading-7 text-slate-700">
                            CÔNG TY TNHH XUẤT NHẬP KHẨU VÀ DỊCH VỤ MINH HÀ - Số ĐKKD: 0123456789 do Sở KĐ & ĐT Tp. Hà Nội cấp ngày
                            31/05/2026 - Địa chỉ: TT13 LÔ C14, KHU ĐÔ THỊ VĂN QUÁN, PHƯỜNG VĂN QUÁN, QUẬN HÀ ĐÔNG, TP.HÀ NỘI
                        </p>
                        <div className="flex flex-wrap items-center gap-5 text-base text-slate-800">
                            <span className="inline-flex items-center gap-2">
                                <FiPhone /> 012 345 6789
                            </span>
                            <span className="inline-flex items-center gap-2">
                                <FiMail /> marketing@minhha.vn
                            </span>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-3xl font-semibold text-orange-500">Thông tin</h4>
                        <ul className="mt-4 space-y-3 text-base text-slate-800">
                            <li>Giới thiệu</li>
                            <li>Liên hệ</li>
                            <li>Blog</li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-3xl font-semibold text-orange-500">Kết nối</h4>
                        <div className="mt-4 flex items-center gap-3">
                            <span className="grid h-10 w-10 place-items-center rounded bg-slate-800 text-white">
                                <FaFacebookF />
                            </span>
                            <span className="rounded-md bg-sky-600 px-3 py-2 text-xs font-semibold text-white">ĐÃ THÔNG BÁO BỘ CÔNG THƯƠNG</span>
                        </div>
                        <h5 className="mt-6 text-3xl font-semibold text-orange-500">Hỗ trợ</h5>
                        <ul className="mt-4 space-y-3 text-base text-slate-800">
                            <li>Chính sách vận chuyển và thanh toán</li>
                            <li>Bảo mật thông tin</li>
                            <li>Chính sách kiểm tra hàng và đổi trả</li>
                        </ul>
                    </div>
                </div>
            </section>

            <button
                className="fixed bottom-5 right-5 z-30 grid h-12 w-12 place-items-center rounded-full border-2 border-slate-800 bg-white text-slate-900 shadow"
                onClick={scrollToTop}
                aria-label="Lên đầu trang"
            >
                <FiChevronUp className="text-2xl" />
            </button>
        </footer>
    );
};

export default Footer;