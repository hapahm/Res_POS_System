require("dotenv").config();
const os = require("os");

const VIRTUAL_ADAPTER_KEYWORDS = [
    "vmware",
    "virtualbox",
    "vbox",
    "hyper-v",
    "docker",
    "wsl",
    "loopback",
    "bluetooth",
    "tailscale"
];

const getPreferredLanIp = () => {
    const interfaces = os.networkInterfaces();
    const candidates = [];

    Object.entries(interfaces).forEach(([ifaceName, ifaceAddresses]) => {
        const normalizedName = `${ifaceName || ""}`.toLowerCase();
        const isVirtual = VIRTUAL_ADAPTER_KEYWORDS.some((keyword) => normalizedName.includes(keyword));

        (ifaceAddresses || []).forEach((iface) => {
            if (!iface || iface.family !== "IPv4" || iface.internal) return;

            candidates.push({
                ip: iface.address,
                ifaceName,
                score: isVirtual
                    ? 0
                    : /wi-?fi|wireless/i.test(ifaceName)
                        ? 3
                        : /ethernet|en/i.test(ifaceName)
                            ? 2
                            : 1
            });
        });
    });

    if (!candidates.length) return "127.0.0.1";

    candidates.sort((a, b) => b.score - a.score);
    return candidates[0].ip;
};

const resolveCustomerAppUrl = () => {
    const rawValue = `${process.env.CUSTOMER_APP_URL || ""}`.trim();
    if (rawValue && rawValue.toLowerCase() !== "auto") {
        return rawValue;
    }

    const port = `${process.env.CUSTOMER_APP_PORT || "5174"}`.trim();
    const lanIp = getPreferredLanIp();
    return `http://${lanIp}:${port}`;
};

const config = Object.freeze({
    port: process.env.PORT || 3000,
    databaseURI: process.env.MONGODB_URI || "mongodb://localhost:27017/pos_db",
    customerAppUrl: resolveCustomerAppUrl(),
    nodeEnv: process.env.NODE_ENV || "development",
    accessTokenSecret: process.env.JWT_SECRET,
    razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    razorpaySecretKey: process.env.RAZORPAY_KEY_SECRET,
    razorpyWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
    vnpTmnCode: process.env.VNP_TMN_CODE || "LRNXSLDS",
    vnpHashSecret: process.env.VNP_HASH_SECRET || "O0TZ65HIF3L7HSZDAAS1GYOYTDAMEOH2",
    vnpUrl: process.env.VNP_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
    vnpReturnUrl: process.env.VNP_RETURN_URL,
    vnpIpnUrl: process.env.VNP_IPN_URL,
    vnpFrontendReturnUrl: process.env.VNP_FRONTEND_RETURN_URL || "http://localhost:5173/payment-result"
});

module.exports = config;
