const createHttpError = require("http-errors");
const jwt = require("jsonwebtoken");
const config = require("../config/config");
const User = require("../models/userModel");

const normalizeRole = (role = "") => `${role}`.trim().toLowerCase();

const authorizeRoles = (...roles) => {
    const allowedRoles = roles.map((role) => normalizeRole(role));

    return (req, res, next) => {
        const currentRole = normalizeRole(req.user?.role);
        if (!currentRole || !allowedRoles.includes(currentRole)) {
            return next(createHttpError(403, "Bạn không có quyền truy cập tài nguyên này!"));
        }
        return next();
    };
};


const isVerifiedUser = async (req, res, next) => {
    try {

        const { accessToken } = req.cookies;

        if (!accessToken) {
            const error = createHttpError(401, "Please provide token!");
            return next(error);
        }

        const decodeToken = jwt.verify(accessToken, config.accessTokenSecret);

        const user = await User.findById(decodeToken._id);
        if (!user) {
            const error = createHttpError(401, "User not exist!");
            return next(error);
        }

        const accountStatus = user.accountStatus || "approved";
        if (accountStatus === "pending") {
            const error = createHttpError(403, "Tài khoản của bạn đang chờ admin duyệt.");
            return next(error);
        }

        if (accountStatus === "locked") {
            const error = createHttpError(403, "Tài khoản của bạn đã bị khóa.");
            return next(error);
        }

        req.user = user;
        next();

    } catch (error) {
        const err = createHttpError(401, "Invalid Token!");
        next(err);
    }
}

const isAdminUser = (req, res, next) => {
    return authorizeRoles("admin")(req, res, next);
}

const isCustomerUser = (req, res, next) => authorizeRoles("customer")(req, res, next);

const isStaffUser = (req, res, next) => authorizeRoles("admin", "cashier", "waiter", "staff")(req, res, next);

const isAdminOrCashierUser = (req, res, next) => authorizeRoles("admin", "cashier")(req, res, next);

module.exports = {
    isVerifiedUser,
    isAdminUser,
    isCustomerUser,
    isStaffUser,
    isAdminOrCashierUser,
    authorizeRoles,
    normalizeRole
};