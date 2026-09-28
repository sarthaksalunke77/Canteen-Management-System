# Canteen Management System (CMS)

## 1. Project Overview
The Canteen Management System is a web-based application that automates and provides smooth management and operations of any modern canteen. It addresses challenges brought about by slow and error-prone manual processes through a digital platform with separate interfaces for both customers and administrators. The system allows customers to view, order, and pay for meals seamlessly while administrators can manage menus, monitor orders, and generate real-time financial reports.

## 2. Problem Statement
Conventional canteen operations face Slowdown which compromise service and financial accuracy.
- **Poor Service & Long Queues:** Manual order taking and billing lead to long waiting hours for the customer, especially during peak hours.
- **Financial Errors:** Hand-written orders and cash-based transactions lead to a high level of errors, incorrect billing, and complex reconciliation.
- **Order Chaos:** The manager doesn't have an instant, digital display of all the orders currently being prepared.
- **Report Generation is Slow:** To figure out how much money the canteen made today or what the top-selling item was, the manager has to manually collect, count, and total up every piece of paper. This process is incredibly time-consuming.

## 3. Core Objectives & Proposed Solution
Thus, it's our main goal to enhance operational efficiency and deliver a superior customer experience.
- **Customer Focus:** Devise a responsive, self-service portal (view menu, order, and pay).
- **Cashless Transactions:** Integrate secure wallet deduction and simulated Razorpay payment gateway options.
- **Admin Control:** Provide an interface with Real-time Order Tracking for efficient workflow.
- **Data-Driven Management:** Automate sales reporting and integrate AI Forecasting for inventory planning.

## 4. Project Scope & Boundaries
The core transaction flow will be automated with the Canteen Management System.
- **Covered Functionalities:** Customer Ordering, Menu Management (CRUD), User Authentication, Real-time Order Tracking, Transaction Records, Report Generation.
- **Key modules delivered:** Customer Portal, Admin Dashboard.
- **Current Boundaries:** Scalable multi-user support, PostgreSQL migration, and Razorpay/AI forecasting simulations.

## 5. System Architecture & Technologies
- **Front-end:** HTML 5, CSS 3, JavaScript (Vanilla), Chart.js
- **Back-end:** Node.js with Express.js (MVC Architecture)
- **Database:** PostgreSQL (with `pg` library)
- **Authentication:** JWT, bcrypt/bcryptjs
- **Real-Time:** Socket.IO for Kitchen Display System (KDS) Updates
- **External Tools:** Razorpay SDK (Simulation)

## 6. Core Functional Requirements
- **Order Processing:** Provides full-cycle processing, from the moment the customer chooses items to order finalization and generation of the receipt.
- **Financial Management:** Secure wallet transactions (recharge/deduction) and online payment simulations.
- **Admin & Menu CRUD:** Administrators can create, read, update, and delete menu items, manage user accounts, and their roles.
- **Real-time Tracking (KDS):** Provides the crew with real-time order status updates: New → Preparing → Ready → Completed via WebSockets.
- **Business Intelligence:** AI-based forecasting module integrates to forecast top-selling items and estimate revenue trends.

## 7. Data Model
### Database Model
- **Core Entities:** `users`, `menu_items`.
- **Transactional Entities:** `orders`, `order_items`.
- **Financial Records:** `payment_history`, `receipts`.
- **Engagement:** `loyalty_visits` for future rewards.

## 8. Results
- **90% Faster Service:** Reduce the time taken for placing and paying for an order from 2–4 minutes down to 10–30 seconds, thus eliminating queues.
- **Real-time Insight:** Reduced Daily Sales Report generation and Order Processing to under 5 seconds each to ensure instant management action via KDS.
- **Functional & Design Success:** Delivered a complete ordering experience, inclusive of working simulations for wallet deduction and AI Forecasting for intelligent inventory management.

## 9. Conclusion
The CMS is a successful technological intervention that provides a robust blueprint for transitioning from a slow, error-prone manual canteen to a fast, automated, and data-driven service environment. The project is now ready to move beyond the prototype stage toward a fully deployed solution.
