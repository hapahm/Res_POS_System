/**
 * Migration script to add 'status' field to all order items
 * Run this once to update existing data
 */

const mongoose = require('mongoose');
const config = require('../config/config');

// Connect to MongoDB
mongoose.connect(config.databaseURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('✅ Connected to MongoDB');
    migrateItemStatus();
}).catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
});

async function migrateItemStatus() {
    try {
        const Order = require('../models/orderModel');

        console.log('🔄 Starting migration...');

        // Find all orders
        const orders = await Order.find({});
        console.log(`📊 Found ${orders.length} orders to check`);

        let updated = 0;
        let alreadyHasStatus = 0;

        for (const order of orders) {
            let orderModified = false;

            for (const item of order.items) {
                // If item doesn't have status field, add it
                if (!item.status) {
                    // If cancelled_at exists, set status to cancelled
                    if (item.cancelled_at) {
                        item.status = 'cancelled';
                    } else {
                        item.status = 'active';
                    }
                    orderModified = true;
                    updated++;
                } else {
                    alreadyHasStatus++;
                }
            }

            if (orderModified) {
                await order.save();
            }
        }

        console.log(`✅ Migration completed!`);
        console.log(`   - Updated items: ${updated}`);
        console.log(`   - Items already had status: ${alreadyHasStatus}`);
        console.log(`   - Total orders processed: ${orders.length}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration error:', error);
        process.exit(1);
    }
}
