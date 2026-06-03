const createHttpError = require("http-errors");
const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("../config/config");

const ALLOWED_ROLES = ["waiter", "cashier", "admin", "customer", "staff"];
const DEFAULT_ADMIN_EMAIL = "admin1@ex.com";
const VIETNAM_PHONE_REGEX = /^\d{10}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeRole = (role = "") => {
    const trimmedRole = `${role}`.trim().toLowerCase();
    if (trimmedRole === "waiter") return "waiter";
    if (trimmedRole === "cashier") return "cashier";
    if (trimmedRole === "admin") return "admin";
    if (trimmedRole === "customer") return "customer";
    if (trimmedRole === "staff") return "staff";
    return "";
}

const isProduction = `${config.nodeEnv || ""}`.trim().toLowerCase() === "production";

const authCookieOptions = {
    maxAge: 1000 * 60 * 60 * 24 * 30,
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction
};
const sanitizeUser = (userDoc) => {
    const userObject = userDoc?.toObject ? userDoc.toObject() : userDoc;
    if (!userObject) return userObject;
    const { password, ...safeUser } = userObject;
    return safeUser;
}

const normalizeVietnamPhone = (phone = "") => {
    const normalizedPhone = `${phone}`.trim().replace(/\D/g, "");
    return VIETNAM_PHONE_REGEX.test(normalizedPhone) ? normalizedPhone : "";
}

const countApprovedAdmins = async (excludeUserId = null) => {
    const filter = {
        role: { $regex: /^admin$/i },
        accountStatus: "approved"
    };

    if (excludeUserId) {
        filter._id = { $ne: excludeUserId };
    }

    return User.countDocuments(filter);
}

const register = async (req, res, next) => {
    try {

        const { name, phone, email, password, role } = req.body;

        if (!name || !phone || !email || !password) {
            const error = createHttpError(400, "All fields are required!");
            return next(error);
        }

        const normalizedRole = role ? normalizeRole(role) : "customer";
        if (!normalizedRole || !ALLOWED_ROLES.includes(normalizedRole)) {
            const error = createHttpError(400, "Invalid role selected!");
            return next(error);
        }

        const normalizedEmail = `${email}`.trim().toLowerCase();
        if (!EMAIL_REGEX.test(normalizedEmail)) {
            const error = createHttpError(400, "Email must be in valid format!");
            return next(error);
        }

        const normalizedPhone = normalizeVietnamPhone(phone);
        if (!normalizedPhone) {
            const error = createHttpError(400, "Số điện thoại phải đủ 10 chữ số!");
            return next(error);
        }

        const isUserPresent = await User.findOne({ email: normalizedEmail });
        if (isUserPresent) {
            const error = createHttpError(400, "User already exist!");
            return next(error);
        }

        const isPhonePresent = await User.findOne({ phone: normalizedPhone });
        if (isPhonePresent) {
            const error = createHttpError(400, "Số điện thoại đã được đăng ký!");
            return next(error);
        }


        const user = {
            name,
            phone: normalizedPhone,
            email: normalizedEmail,
            password,
            role: normalizedRole,
            accountStatus: normalizedRole === "customer" ? "approved" : "pending"
        };
        const newUser = User(user);
        await newUser.save();

        res.status(201).json({
            success: true,
            message: normalizedRole === "customer"
                ? "Đăng ký thành công!"
                : "Đăng ký thành công! Tài khoản đang chờ admin duyệt.",
            data: sanitizeUser(newUser)
        });


    } catch (error) {
        if (error?.code === 11000) {
            if (error?.keyPattern?.phone) {
                return next(createHttpError(400, "Số điện thoại đã được đăng ký!"));
            }
            if (error?.keyPattern?.email) {
                return next(createHttpError(400, "Email đã được đăng ký!"));
            }
        }
        next(error);
    }
}


const login = async (req, res, next) => {

    try {

        const { email, password } = req.body;

        if (!email || !password) {
            const error = createHttpError(400, "All fields are required!");
            return next(error);
        }

        const isUserPresent = await User.findOne({ email: `${email}`.trim().toLowerCase() });
        if (!isUserPresent) {
            const error = createHttpError(401, "Invalid Credentials");
            return next(error);
        }

        const isMatch = await bcrypt.compare(password, isUserPresent.password);
        if (!isMatch) {
            const error = createHttpError(401, "Invalid Credentials");
            return next(error);
        }

        const accountStatus = isUserPresent.accountStatus || "approved";
        if (accountStatus === "pending") {
            const error = createHttpError(403, "Tài khoản của bạn đang chờ admin duyệt.");
            return next(error);
        }

        if (accountStatus === "locked") {
            const error = createHttpError(403, "Tài khoản của bạn đã bị khóa.");
            return next(error);
        }

        const accessToken = jwt.sign({ _id: isUserPresent._id }, config.accessTokenSecret, {
            expiresIn: '1d'
        });

        res.cookie('accessToken', accessToken, authCookieOptions)

        res.status(200).json({
            success: true, message: "User login successfully!",
            data: sanitizeUser(isUserPresent)
        });


    } catch (error) {
        next(error);
    }

}

const getUserData = async (req, res, next) => {
    try {

        const user = await User.findById(req.user._id).select("-password");
        res.status(200).json({ success: true, data: user });

    } catch (error) {
        next(error);
    }
}

const logout = async (req, res, next) => {
    try {
        res.clearCookie('accessToken', {
            httpOnly: true,
            sameSite: isProduction ? "none" : "lax",
            secure: isProduction
        });
        res.status(200).json({ success: true, message: "User logout successfully!" });

    } catch (error) {
        next(error);
    }
}

const getInternalAccounts = async (req, res, next) => {
    try {
        const users = await User.find().select("-password").sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: users });
    } catch (error) {
        next(error);
    }
}

const updateAccountStatus = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { accountStatus } = req.body;

        if (!["approved", "locked"].includes(accountStatus)) {
            const error = createHttpError(400, "Invalid account status!");
            return next(error);
        }

        if (`${req.user._id}` === `${userId}` && accountStatus === "locked") {
            const error = createHttpError(400, "Bạn không thể tự khóa tài khoản của mình!");
            return next(error);
        }

        const targetUser = await User.findById(userId);
        if (!targetUser) {
            const error = createHttpError(404, "User not found!");
            return next(error);
        }

        if (
            accountStatus === "locked" &&
            `${targetUser.email}`.toLowerCase() === DEFAULT_ADMIN_EMAIL
        ) {
            const error = createHttpError(400, "Không thể khóa tài khoản admin mặc định!");
            return next(error);
        }

        if (accountStatus === "locked" && `${targetUser.role || ""}`.toLowerCase() === "admin") {
            const remainingApprovedAdmins = await countApprovedAdmins(targetUser._id);
            if (remainingApprovedAdmins < 1) {
                const error = createHttpError(400, "Hệ thống phải có ít nhất 1 admin đang hoạt động!");
                return next(error);
            }
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { accountStatus },
            { new: true, runValidators: true }
        ).select("-password");

        if (!updatedUser) {
            const error = createHttpError(404, "User not found!");
            return next(error);
        }

        res.status(200).json({
            success: true,
            message: accountStatus === "approved" ? "Duyệt tài khoản thành công!" : "Khóa tài khoản thành công!",
            data: updatedUser
        });
    } catch (error) {
        next(error);
    }
}

const updateAccountRole = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { role } = req.body;

        const normalizedRole = normalizeRole(role);
        if (!normalizedRole || !ALLOWED_ROLES.includes(normalizedRole)) {
            const error = createHttpError(400, "Invalid role selected!");
            return next(error);
        }

        if (`${req.user._id}` === `${userId}`) {
            const error = createHttpError(400, "Bạn không thể tự đổi quyền tài khoản của mình!");
            return next(error);
        }

        const targetUser = await User.findById(userId);
        if (!targetUser) {
            const error = createHttpError(404, "User not found!");
            return next(error);
        }

        if (
            `${targetUser.email}`.toLowerCase() === DEFAULT_ADMIN_EMAIL &&
            normalizedRole !== "admin"
        ) {
            const error = createHttpError(400, "Không thể hạ quyền tài khoản admin mặc định!");
            return next(error);
        }

        if (`${targetUser.role || ""}`.toLowerCase() === "admin" && normalizedRole !== "admin") {
            const remainingApprovedAdmins = await countApprovedAdmins(targetUser._id);
            if (remainingApprovedAdmins < 1) {
                const error = createHttpError(400, "Hệ thống phải có ít nhất 1 admin đang hoạt động!");
                return next(error);
            }
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { role: normalizedRole },
            { new: true, runValidators: true }
        ).select("-password");

        if (!updatedUser) {
            const error = createHttpError(404, "User not found!");
            return next(error);
        }

        res.status(200).json({
            success: true,
            message: "Cập nhật quyền thành công!",
            data: updatedUser
        });
    } catch (error) {
        next(error);
    }
}




module.exports = {
    register,
    login,
    getUserData,
    logout,
    getInternalAccounts,
    updateAccountStatus,
    updateAccountRole
}