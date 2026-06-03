import butterChickenImage from "../assets/images/butter-chicken-4.jpg";
import biryaniImage from "../assets/images/hyderabadibiryani.jpg";
import gulabJamunImage from "../assets/images/gulab-jamun.webp";
import masalaDosaImage from "../assets/images/masala-dosa.jpg";
import choleBhatureImage from "../assets/images/chole-bhature.jpg";
import paneerTikaImage from "../assets/images/paneer-tika.webp";

export const BLOG_POSTS = [
    {
        id: "blog-1",
        slug: "bi-quyet-goi-mon-cho-bua-toi",
        title: "Bi quyet goi mon cho bua toi dong nguoi ma van nhanh",
        excerpt:
            "Goi y cach ket hop mon khai vi, mon chinh va do uong de toi uu thoi gian phuc vu trong gio cao diem.",
        image: butterChickenImage,
        publishedAt: "2026-02-10",
        viewCount: 4095,
        readTimeMinutes: 4,
        author: "KCHICK Editorial",
        category: "Kinh nghiem goi mon",
        content: [
            {
                heading: "Xac dinh so nguoi va thoi gian dung bua",
                paragraphs: [
                    "Truoc khi goi, hay xac dinh ro nhom co bao nhieu nguoi va du kien dung bua trong bao lau. Thong tin nay giup nhan vien de xuat mon co toc do ra bep phu hop.",
                    "Neu ban den vao gio cao diem, uu tien mon de chia se va mon che bien nhanh de ban khong phai cho lau.",
                ],
            },
            {
                heading: "Ap dung cong thuc 1 khai vi - 2 mon chinh - 1 do uong",
                paragraphs: [
                    "Voi nhom 2-3 nguoi, mot mon khai vi nhe se giup kich vi giac. Sau do chon hai mon chinh khac nhau ve cach nau de bua an da dang hon.",
                    "Do uong nen chon theo mon cay nhat trong ban, nham can bang huong vi tong the.",
                ],
            },
            {
                heading: "Dat uu tien cho mon signature",
                paragraphs: [
                    "Neu ban lan dau den quan, hay goi it nhat mot mon signature de co trai nghiem dung chat cua thuong hieu.",
                    "Khi da quen khau vi, ban co the them mon moi de thu nghiem ma van giu duoc muc do an toan cho bua an.",
                ],
            },
        ],
        highlights: ["Goi mon theo nhom", "Toi uu thoi gian", "Can bang huong vi"],
    },
    {
        id: "blog-2",
        slug: "combo-gia-dinh-tiet-kiem",
        title: "5 combo gia dinh tiet kiem cho cuoi tuan",
        excerpt:
            "Danh sach combo da dang khau vi, can bang chi phi va de chia se cho nhom 3-6 nguoi.",
        image: biryaniImage,
        publishedAt: "2026-02-17",
        viewCount: 3250,
        readTimeMinutes: 5,
        author: "KCHICK Editorial",
        category: "Combo gia dinh",
        content: [
            {
                heading: "Combo cho 3 nguoi",
                paragraphs: [
                    "Combo nho nen co mot mon com, mot mon nuong va mot mon canh de de chia. Cach phoi nay giup bua an no lau nhung khong bi ngan.",
                    "Neu co tre em, bo sung mon it cay de ca nha de an hon.",
                ],
            },
            {
                heading: "Combo cho 4-6 nguoi",
                paragraphs: [
                    "Voi nhom dong, nen goi theo suat lon ngay tu dau de tiet kiem chi phi hon so voi goi le tung mon.",
                    "Ban co the chia theo ty le 40% mon chinh, 30% mon phu, 20% rau va 10% do uong.",
                ],
            },
            {
                heading: "Meo can doi ngan sach",
                paragraphs: [
                    "Dat tran ngan sach truoc khi goi va uu tien mon co dinh luong on dinh. Tranh goi qua nhieu mon cung nhom huong vi.",
                    "Khi can bo sung, hay goi theo tung dot nho de tranh du thua.",
                ],
            },
        ],
        highlights: ["Combo tiet kiem", "Phu hop gia dinh", "De chia se"],
    },
    {
        id: "blog-3",
        slug: "chon-mon-trang-mieng",
        title: "Chon mon trang mieng dung vi sau bua an nhieu dau mo",
        excerpt:
            "Tu mon ngot nhe den mon mat lanh, day la nhung lua chon de ket bua an gon gang ma van ngon mieng.",
        image: gulabJamunImage,
        publishedAt: "2026-02-21",
        viewCount: 4203,
        readTimeMinutes: 3,
        author: "KCHICK Editorial",
        category: "Trang mieng",
        content: [
            {
                heading: "Trang mieng sau mon cay",
                paragraphs: [
                    "Sau khi dung mon cay, nen uu tien mon ngot co thanh phan sua hoac kem de lam diu vi cay.",
                    "Nhung mon co do ngot vua phai se giup ket bua an nhe nhang hon.",
                ],
            },
            {
                heading: "Trang mieng cho bua an nhieu dau mo",
                paragraphs: [
                    "Neu bua an co nhieu mon chien nuong, hay chon mon mat lanh va it beo de can bang vi giac.",
                    "Tra nong nhat la tra thao moc cung la lua chon hop ly de ket hop.",
                ],
            },
            {
                heading: "Khau phan hop ly",
                paragraphs: [
                    "Trang mieng nen chiem khoang 15-20% tong khau phan cua bua an. Dieu nay giup tranh cam giac qua no.",
                    "Neu dung theo nhom, goi 1-2 mon de chia thuong hop ly hon goi moi nguoi mot phan.",
                ],
            },
        ],
        highlights: ["Ket bua an gon", "Can bang vi giac", "Phu hop nhom ban"],
    },
    {
        id: "blog-4",
        slug: "mon-an-sang-nhanh-gon",
        title: "Mon an sang nhanh gon cho ngay ban ron",
        excerpt:
            "Goi y nhung mon an sang phuc vu nhanh, de an tai ban hoac mang di ma van day du nang luong.",
        image: masalaDosaImage,
        publishedAt: "2026-02-28",
        viewCount: 2870,
        readTimeMinutes: 4,
        author: "KCHICK Editorial",
        category: "Bua sang",
        content: [
            {
                heading: "Tieu chi cho bua sang nhanh",
                paragraphs: [
                    "Bua sang nhanh can dam bao ba yeu to: de an, de mang di va du nang luong toi thieu cho 3-4 gio lam viec.",
                    "Nhung mon co tinh bot ket hop dam va rau se giup no lau ma khong nang bung.",
                ],
            },
            {
                heading: "Lua chon theo thoi gian",
                paragraphs: [
                    "Neu ban chi co 10 phut, nen uu tien mon da che bien san va do uong don gian.",
                    "Neu co 20 phut, co the them mon nong de tang cam giac ngon mieng va tap trung hon.",
                ],
            },
            {
                heading: "Luu y khi mang di",
                paragraphs: [
                    "Voi don mang di, hay chon mon it nuoc sot de giu do gion va tranh do ra ngoai.",
                    "Dat them khan giay va muong nia phu hop se giup trai nghiem an thuong tien loi hon.",
                ],
            },
        ],
        highlights: ["Nhanh gon", "Du nang luong", "Phu hop mang di"],
    },
    {
        id: "blog-5",
        slug: "thuc-don-cay-nhe",
        title: "Thuc don cay nhe cho khach moi thu am thuc An Do",
        excerpt:
            "Huong dan bat dau voi cap do cay vua phai, de de dang lam quen huong vi dac trung.",
        image: choleBhatureImage,
        publishedAt: "2026-03-03",
        viewCount: 1942,
        readTimeMinutes: 4,
        author: "KCHICK Editorial",
        category: "Huong dan khau vi",
        content: [
            {
                heading: "Cap do cay cho nguoi moi",
                paragraphs: [
                    "Nguoi moi nen bat dau voi mon co cap do cay nhe va co thanh phan kem hoac sua de de thich nghi.",
                    "Sau do ban co the nang dan cap do cay theo tung bua an de cam nhan ro net huong vi.",
                ],
            },
            {
                heading: "Cach ket hop mon de giam cay",
                paragraphs: [
                    "Com, banh mi mem va sua chua la nhung thanh phan giup can bang vi cay rat tot.",
                    "Khi an mon cay, nen uong nuoc ngam tung ngup nho thay vi uong qua nhanh.",
                ],
            },
            {
                heading: "Danh sach goi y an toan",
                paragraphs: [
                    "Bat dau bang mon khai vi nhe, tiep theo la mon chinh cay vua va ket thuc bang trang mieng mat.",
                    "Cach sap xep nay giup ban khong bi soc vi giac ma van thu duoc nhieu huong vi.",
                ],
            },
        ],
        highlights: ["Nguoi moi de an", "Cap do cay vua", "Huong vi de tiep can"],
    },
    {
        id: "blog-6",
        slug: "cach-phoi-mon-nuong",
        title: "Cach phoi mon nuong va nuoc cham de tang huong vi",
        excerpt:
            "Nhung meo nho de ket hop mon nuong voi rau, banh mi va xot, giup bua an tron vi hon.",
        image: paneerTikaImage,
        publishedAt: "2026-03-05",
        viewCount: 1688,
        readTimeMinutes: 6,
        author: "KCHICK Editorial",
        category: "Mon nuong",
        content: [
            {
                heading: "Phan bo chat vi cho dia nuong",
                paragraphs: [
                    "Mot dia nuong can co do beo, do chua nhe va do cay vua de tao can bang. Neu thieu mot trong ba yeu to, mon an se de bi ngan.",
                    "Rau song va do chua nhe dong vai tro quan trong de lam sach vi giac giua cac mieng an.",
                ],
            },
            {
                heading: "Chon nuoc cham theo nguyen lieu",
                paragraphs: [
                    "Mon ga nuong hop voi xot chua ngot nhe, trong khi mon pho mai nuong hop voi xot thom beo hoac xot cay vua.",
                    "Khong nen dung qua nhieu loai xot cung luc de tranh mat mui chinh cua mon nuong.",
                ],
            },
            {
                heading: "Sap xep thu tu thuong thuc",
                paragraphs: [
                    "Nen bat dau tu mieng nuong nhat, sau do tang dan cuong do gia vi de giu trai nghiem li mach.",
                    "Ket thuc voi mot ngup tra nong se giup huong vi dong lai ro rang hon.",
                ],
            },
        ],
        highlights: ["Can bang vi giac", "Nuoc cham dung cach", "Thuong thuc co trinh tu"],
    },
];

export const getBlogPostBySlug = (slug) =>
    BLOG_POSTS.find((post) => `${post.slug}` === `${slug}`);
