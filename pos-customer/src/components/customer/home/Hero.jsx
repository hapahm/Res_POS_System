import { useEffect, useRef, useState } from "react";
import logo from "../../../assets/images/logo2.png";

const HeroDish = ({ image, alt }) => {
    const [isFallback, setIsFallback] = useState(false);

    if (isFallback) {
        return (
            <div
                className="grid h-[280px] w-full max-w-[380px] place-items-center rounded-3xl border border-orange-200 bg-orange-50 px-4 text-center text-sm text-orange-500 sm:h-[320px] lg:h-[380px]"
            >
                Placeholder món ăn
            </div>
        );
    }

    return (
        <img
            src={image}
            alt={alt}
            className="h-[280px] w-full max-w-[380px] rounded-3xl border-4 border-white object-cover shadow-xl sm:h-[320px] lg:h-[380px]"
            onError={() => setIsFallback(true)}
        />
    );
};

const Hero = ({
    backgroundImage,
    highlightedDishes,
    badgeText = "Fresh & Healthy",
    titleText = "Fresh Chicken Best Taste",
    descriptionText = "Hương vị đặc trưng KCHICK, món ăn tươi mới mỗi ngày và phong cách trình bày hiện đại.",
}) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(true);
    const fadeTimeoutRef = useRef(null);

    useEffect(() => {
        if (!highlightedDishes?.length) return;

        const interval = setInterval(() => {
            setIsVisible(false);

            fadeTimeoutRef.current = setTimeout(() => {
                setActiveIndex((prev) => (prev + 1) % highlightedDishes.length);
                setIsVisible(true);
            }, 420);
        }, 3600);

        return () => {
            clearInterval(interval);
            if (fadeTimeoutRef.current) {
                clearTimeout(fadeTimeoutRef.current);
            }
        };
    }, [highlightedDishes]);

    const activeDishImage = highlightedDishes?.[activeIndex] || "";
    const getDishImageByOffset = (offset) => {
        if (!highlightedDishes?.length) return "";
        const nextIndex = (activeIndex + offset + highlightedDishes.length) % highlightedDishes.length;
        return highlightedDishes[nextIndex] || "";
    };

    const leftDishImage = getDishImageByOffset(-1);
    const rightDishImage = getDishImageByOffset(1);

    return (
        <section className="relative w-full overflow-hidden border-b border-slate-200">
            <img
                src={backgroundImage}
                alt="Hero background"
                className="absolute inset-0 h-full w-full object-cover opacity-35"
                onError={(event) => {
                    event.currentTarget.style.display = "none";
                }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-amber-50/95 via-orange-50/88 to-amber-100/82" />

            <div className="relative mx-auto grid min-h-[480px] w-full max-w-[1600px] items-center gap-6 px-4 py-10 sm:min-h-[560px] sm:px-8 md:grid-cols-2 md:py-14 lg:px-12 xl:min-h-[610px]">
                <div className="md:pr-8">
                    <img src={logo} alt="KCHICK mark" className="mb-6 h-20 w-20 rounded-full object-cover sm:h-24 sm:w-24" />
                    <p className="mb-3 text-base font-semibold uppercase tracking-[0.24em] text-orange-500">{badgeText}</p>
                    <h1 className="text-5xl font-medium italic leading-tight text-amber-900 sm:text-6xl lg:text-7xl">
                        {titleText}
                    </h1>
                    <p className="mt-5 max-w-xl text-base text-slate-700 sm:text-xl">
                        {descriptionText}
                    </p>
                </div>

                <div className="relative flex min-h-72 items-center justify-center sm:min-h-80 lg:min-h-[420px]">
                    <div className="relative flex w-full max-w-[420px] items-center justify-center">
                        <div className="absolute inset-0 -z-10 rounded-3xl bg-orange-200/50 blur-2xl" />

                        <div
                            className={`pointer-events-none absolute -left-20 top-1/2 hidden -translate-y-1/2 transition-all duration-500 ease-in-out lg:block ${isVisible ? "opacity-45 blur-[1.2px]" : "opacity-0 blur-[2.8px]"
                                }`}
                        >
                            <img
                                src={leftDishImage}
                                alt="Món nổi bật bên trái"
                                className="h-[230px] w-[150px] rounded-2xl border-2 border-white/80 object-cover shadow-lg"
                            />
                        </div>

                        <div
                            className={`transition-all duration-500 ease-in-out ${isVisible ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
                                }`}
                        >
                            <HeroDish image={activeDishImage} alt="Món nổi bật" />
                        </div>

                        <div
                            className={`pointer-events-none absolute -right-20 top-1/2 hidden -translate-y-1/2 transition-all duration-500 ease-in-out lg:block ${isVisible ? "opacity-45 blur-[1.2px]" : "opacity-0 blur-[2.8px]"
                                }`}
                        >
                            <img
                                src={rightDishImage}
                                alt="Món nổi bật bên phải"
                                className="h-[230px] w-[150px] rounded-2xl border-2 border-white/80 object-cover shadow-lg"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;