import mongoose from "mongoose";
import dotenv from "dotenv";
import { connectDB, disconnectDB } from "./src/config/db";
import { Order } from "./src/models/Order";
import { Session } from "./src/models/Session";
import { User } from "./src/models/User";
import { Product } from "./src/models/Product";
import { Table } from "./src/models/Table";
import bcrypt from "bcrypt";

dotenv.config();

const seedAnalytics = async () => {
  try {
    await connectDB();
    console.log("🌱 Generating analytics data...");

    // 1. Clear existing analytics data
    await Order.deleteMany({});
    await Session.deleteMany({});
    console.log("🗑️ Cleared existing orders and sessions");

    // 2. Ensure we have staff/cashiers
    let users = await User.find({ role: { $in: ["admin", "staff", "waiter", "cashier"] } });
    if (users.length < 3) {
      const hashedPassword = await bcrypt.hash("password123", 10);
      const newUsers = await User.insertMany([
        { name: "John Cashier", email: "john@cafe.com", passwordHash: hashedPassword, role: "admin", active: true, isApproved: true },
        { name: "Sarah Waiter", email: "sarah@cafe.com", passwordHash: hashedPassword, role: "waiter", active: true, isApproved: true },
        { name: "Mike Waiter", email: "mike@cafe.com", passwordHash: hashedPassword, role: "waiter", active: true, isApproved: true },
      ]);
      users = [...users, ...newUsers];
      console.log("👤 Created fake staff users");
    }

    const waiters = users.filter(u => u.role === "waiter" || u.role === "staff");
    const cashiers = users.filter(u => u.role === "cashier" || u.role === "admin");

    const products = await Product.find();
    const tables = await Table.find();

    if (products.length === 0 || tables.length === 0) {
      console.error("❌ No products or tables found. Run seed.ts first!");
      process.exit(1);
    }

    const now = new Date();
    const orders = [];
    const sessions = [];
    let orderCounter = 1001;

    // Generate data for the last 30 days
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(now.getDate() - i);
      
      // Each cashier/admin user has one session per day
      const activeCashiers = cashiers.length > 0 ? cashiers : users;
      for (const cashierUser of activeCashiers) {
        const startTime = new Date(date);
        startTime.setHours(8 + Math.floor(Math.random() * 2), 0, 0);
        
        const endTime = new Date(date);
        endTime.setHours(20 + Math.floor(Math.random() * 4), 0, 0);

        const session = new Session({
          cashier: cashierUser._id,
          user: cashierUser._id,
          startTime,
          endTime,
          startingBalance: 1000,
          endingBalance: 0,
          totalSales: 0,
          status: "closed",
        });

        // Generate 5-15 orders per session
        const numOrders = 5 + Math.floor(Math.random() * 10);
        let sessionTotal = 0;

        for (let j = 0; j < numOrders; j++) {
          const orderTime = new Date(startTime);
          // Distribute orders throughout the session
          orderTime.setMinutes(Math.floor(Math.random() * (endTime.getTime() - startTime.getTime()) / 60000));

          const numItems = 1 + Math.floor(Math.random() * 4);
          const orderItems = [];
          let orderTotal = 0;

          for (let k = 0; k < numItems; k++) {
            const product = products[Math.floor(Math.random() * products.length)];
            const qty = 1 + Math.floor(Math.random() * 2);
            const price = product.basePrice;
            
            orderItems.push({
              product: product._id,
              quantity: qty,
              size: "Regular",
              price: price,
              itemStatus: "completed"
            });
            orderTotal += price * qty;
          }

          // Random prep time between 5 and 25 minutes
          const prepMinutes = 5 + Math.random() * 20;
          const orderTimeUpdatedAt = new Date(orderTime.getTime() + prepMinutes * 60000);

          const randomWaiter = waiters.length > 0 ? waiters[Math.floor(Math.random() * waiters.length)] : cashierUser;
          const randomStatus = ["completed", "completed", "completed", "served", "ready"][Math.floor(Math.random() * 5)];

          const order = new Order({
            customOrderID: `ORD-${orderTime.getTime()}-${Math.floor(Math.random() * 10000)}`,
            orderNumber: `ORD${orderCounter++}`,
            items: orderItems,
            totalPrice: orderTotal,
            discountPercent: 0,
            taxRate: 5,
            status: randomStatus,
            paymentMethod: ["cash", "card", "upi"][Math.floor(Math.random() * 3)],
            table: tables[Math.floor(Math.random() * tables.length)]._id,
            sessionId: session._id,
            responsibleStaff: randomWaiter._id,
            cashierId: cashierUser._id,
            createdAt: orderTime,
            updatedAt: orderTimeUpdatedAt,
          });

          orders.push(order);
          sessionTotal += orderTotal;
        }

        session.totalSales = sessionTotal;
        session.endingBalance = 1000 + sessionTotal;
        sessions.push(session);
      }
    }

    console.log(`📦 Inserting ${sessions.length} sessions and ${orders.length} orders...`);
    await Session.insertMany(sessions, { timestamps: false });
    await Order.insertMany(orders, { timestamps: false });

    console.log("🌱 Analytics data seeded successfully!");
    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

seedAnalytics();
