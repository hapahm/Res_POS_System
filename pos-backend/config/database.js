const mongoose = require("mongoose");
const config = require("./config");
const Category = require("../models/categoryModel");
const Dish = require("../models/dishModel");
const User = require("../models/userModel");

const DEFAULT_ADMIN_EMAIL = "admin1@ex.com";
const DEFAULT_ADMIN_PASSWORD = "1";

const ensureDefaultAdmin = async () => {
    const existingAdmin = await User.findOne({ email: DEFAULT_ADMIN_EMAIL });

    if (!existingAdmin) {
        const admin = new User({
            name: "System Admin",
            email: DEFAULT_ADMIN_EMAIL,
            phone: "0999999999",
            password: DEFAULT_ADMIN_PASSWORD,
            role: "Admin",
            accountStatus: "approved"
        });
        await admin.save();
        console.log("✅ Default admin account created: admin1@ex.com / 1");
        return;
    }

    const updates = {};
    if ((existingAdmin.role || "").toLowerCase() !== "admin") {
        updates.role = "Admin";
    }

    if ((existingAdmin.accountStatus || "") !== "approved") {
        updates.accountStatus = "approved";
    }

    if (Object.keys(updates).length > 0) {
        await User.findByIdAndUpdate(existingAdmin._id, updates, { new: true });
    }
}

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(config.databaseURI);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

        // Ensure collections exist
        await Category.createCollection();
        await Dish.createCollection();
        await User.createCollection();

        // Ensure indexes are built (e.g., unique dish name per category)
        await Dish.syncIndexes();

        await ensureDefaultAdmin();
    } catch (error) {
        console.log(`❌ Database connection failed: ${error.message}`);
        process.exit();
    }
}

module.exports = connectDB;