import Header from "../components/customer/home/Header";
import Hero from "../components/customer/home/Hero";
import BlogSection from "../components/customer/home/BlogSection";
import Footer from "../components/customer/Footer";
import heroBg from "../assets/images/restaurant-img.jpg";
import restaurantImage from "../assets/images/restaurant-img.jpg";
import storyImage from "../assets/images/masala-dosa.jpg";
import scaleImage from "../assets/images/chole-bhature.jpg";
import signatureImage from "../assets/images/butter-chicken-4.jpg";
import menuOneImage from "../assets/images/paneer-tika.webp";
import menuTwoImage from "../assets/images/hyderabadibiryani.jpg";

const ABOUT_SECTIONS = [
    {
        id: "history",
        title: "Lịch sử hình thành",
        description:
            "Nhà hàng KCHICK được thành lập với mong muốn mang đến trải nghiệm ẩm thực hiện đại, chỉn chu và gần gũi cho mọi thực khách. Từ những ngày đầu, chúng tôi tập trung vào chất lượng nguyên liệu, quy trình chế biến sạch và phong cách phục vụ tận tâm.",
        description2:
            "Trải qua nhiều năm phát triển, KCHICK không ngừng hoàn thiện thực đơn và không gian để phù hợp với nhu cầu đa dạng của khách hàng. Chúng tôi tin rằng mỗi bữa ăn ngon không chỉ nằm ở hương vị, mà còn là cảm giác thoải mái và kết nối giữa mọi người.",
        image: storyImage,
    },
    {
        id: "scale",
        title: "Quy mô hoạt động",
        description:
            "KCHICK hiện hoạt động với đội ngũ bếp và phục vụ được đào tạo bài bản, luôn sẵn sàng mang đến dịch vụ nhanh chóng và đồng đều. Hệ thống vận hành được chuẩn hóa giúp nhà hàng duy trì chất lượng ổn định trong mọi khung giờ.",
        description2:
            "Bên cạnh phục vụ tại chỗ, chúng tôi phát triển mạnh kênh đặt món trực tuyến nhằm đáp ứng nhu cầu tiện lợi của khách hàng. Mỗi đơn hàng đều được kiểm soát kỹ từ khâu chuẩn bị đến giao nhận để đảm bảo trải nghiệm trọn vẹn.",
        image: scaleImage,
    },
    {
        id: "signature",
        title: "Món ăn đặc trưng",
        description:
            "Thực đơn KCHICK nổi bật với các món gà, món nướng và món ăn kèm được kết hợp hài hòa giữa khẩu vị truyền thống và phong cách hiện đại. Mỗi món đều được nghiên cứu kỹ để đạt độ cân bằng về hương, vị và hình thức trình bày.",
        description2:
            "Chúng tôi ưu tiên nguyên liệu tươi mới mỗi ngày, cùng quy trình nêm nếm nhất quán để giữ trọn chất lượng khi phục vụ tại bàn hoặc mang đi. Đây cũng là lý do nhiều khách hàng chọn KCHICK cho những bữa ăn gia đình, gặp gỡ bạn bè và dịp đặc biệt.",
        image: signatureImage,
    },
];

const About = () => {
    return (
        <main className="min-h-screen bg-slate-100 text-slate-800">
            <Header />

            <Hero
                backgroundImage={heroBg}
                highlightedDishes={[restaurantImage, menuOneImage, menuTwoImage]}
                badgeText="Kchick stories"
                titleText="Giới thiệu nhà hàng"
                descriptionText="Khám phá hành trình phát triển, phong cách phục vụ và những giá trị ẩm thực mà KCHICK luôn theo đuổi trong từng bữa ăn."
            />

            <section className="bg-white">
                <div className="mx-auto flex h-14 max-w-7xl items-center justify-center px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold italic uppercase tracking-wide text-orange-500">KCHICK</h2>
                </div>
            </section>

            {ABOUT_SECTIONS.map((item, index) => (
                <section key={item.id} className={index % 2 === 0 ? "bg-white" : "bg-[#ececec]"}>
                    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-10">
                        <div className="grid items-center gap-10 md:grid-cols-2 lg:gap-16">
                            <div className={`mx-auto w-full max-w-[560px] ${index % 2 === 1 ? "md:order-2" : ""}`}>
                                <h3 className="text-4xl font-bold uppercase tracking-[0.12em] text-orange-500">{item.title}</h3>
                                <p className="mt-6 text-[13px] leading-7 text-slate-700">{item.description}</p>
                                <p className="mt-4 text-[13px] leading-7 text-slate-700">{item.description2}</p>
                            </div>

                            <div className={`mx-auto w-full max-w-[560px] ${index % 2 === 1 ? "md:order-1" : ""}`}>
                                <img src={item.image} alt={item.title} className="h-[300px] w-full object-cover sm:h-[340px]" />
                            </div>
                        </div>
                    </div>
                </section>
            ))}

            <section className="bg-[#ececec]">
                <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-10">
                    <h3 className="text-center text-4xl font-bold italic text-orange-500">Menu món ăn</h3>

                    <div className="mx-auto mt-8 grid max-w-5xl gap-5 md:grid-cols-2">
                        <div className="group relative overflow-hidden">
                            <img src={menuOneImage} alt="Menu nổi bật 1" className="h-[300px] w-full object-cover" />
                            <button className="absolute bottom-3 right-3 bg-white/90 px-3 py-1 text-xs font-semibold text-slate-900">Xem thêm</button>
                        </div>

                        <div className="group relative overflow-hidden">
                            <img src={menuTwoImage} alt="Menu nổi bật 2" className="h-[300px] w-full object-cover" />
                            <button className="absolute bottom-3 right-3 bg-white/90 px-3 py-1 text-xs font-semibold text-slate-900">Xem thêm</button>
                        </div>
                    </div>

                    <div className="mt-5 flex items-center justify-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-slate-700" />
                        <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
                    </div>
                </div>
            </section>

            <BlogSection />

            <Footer />
        </main>
    );
};

export default About;
