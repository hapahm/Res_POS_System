# 🍽️ **KChick Restaurant POS System**  

A full-featured **Restaurant POS System** built using the **MERN Stack** to streamline restaurant operations, enhance customer experience, and manage orders, payments, and inventory with ease.

## ✨ **Features**

- 🍽️ **Order Management**  
  Efficiently manage customer orders with real-time updates and status tracking.

- 🪑 **Table Reservations**  
  Simplify table bookings and manage reservations directly from the POS.

- 🤖 **Hybrid AI Chatbot**   
  Intelligent chatbot combining rule-based matching + OpenAI API for smart customer support
  - Real-time chat interface for customers and staff
  - Rule-based responses for common queries (instant, free)
  - AI fallback for complex queries (smart, affordable)
  - Database queries for order & table status
  - Three-tier fallback system for reliability

- 🔐 **Authentication**  
  Secure login and role-based access control for admins, staff, and users.

- 💸 **Payment Integration**  
  Integrated with **VNPay** for seamless online payments.

- 🧾 **Billing & Invoicing**  
  Automatically generate detailed bills and invoices for every order.


## 🏗️ **Tech Stack**

| **Category**             | **Technology**                |
|--------------------------|-------------------------------|
| 🖥️ **Frontend**          | React.js, Redux, Tailwind CSS  |
| 🔙 **Backend**           | Node.js, Express.js           |
| 🗄️ **Database**          | MongoDB                       |
| 🔐 **Authentication**    | JWT, bcrypt                   |
| 💳 **Payment Integration**| VNPay                         |
| 📊 **State Management**   | Redux Toolkit                 |
| ⚡ **Data Fetching & Caching** | React Query            |
| 🔗 **APIs**              | RESTful APIs                   |
| 🤖 **AI Integration**    | OpenAI (gpt-3.5-turbo)        |
| 💬 **Real-time Chat**    | Socket.IO                     |

---

## 🤖 **Hybrid AI Chatbot System**

The system features an intelligent **hybrid chatbot** that combines:
- **Rule-Based Matching** (Tier 1) - Fast, free, for common queries
- **OpenAI Integration** (Tier 2) - Smart, affordable, for complex queries  
- **Human Handoff** (Tier 3) - Safe fallback to staff

### Chatbot Capabilities
- ✅ Answer opening hours, menu, pricing questions
- ✅ Provide order status using AI intent classification
- ✅ Check table availability in real-time
- ✅ Extract parameters (orderId, table number) from natural language
- ✅ Query MongoDB for accurate order & table data
- ✅ Automatic error handling with fallback to human support

### Documentation
- 📘 **[Hybrid Chatbot Setup Guide](./HYBRID_CHATBOT_QUICKSTART.md)** - 5-minute quick start
- 📗 **[Complete Implementation Guide](./HYBRID_CHATBOT_GUIDE.md)** - Detailed documentation
- 📙 **[Technical Details](./HYBRID_CHATBOT_IMPLEMENTATION.md)** - Architecture & code overview

---

## 📁 **Project Assets**

- 📦 **Project Assets:** [Google Drive](https://drive.google.com/drive/folders/1feOEJccwQ8FICEpRQjS-ltuWCuxCeG2u?usp=drive_link)
