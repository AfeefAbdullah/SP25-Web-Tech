# Burberry Express Application with Authentication

## Overview
This is an Express.js application for a Burberry-inspired e-commerce website. It features user authentication, session management, admin and user dashboards, and a modern, responsive UI built with EJS templates.

## Features
- User authentication (register, login, logout)
- Admin authentication and management
- Product management (CRUD for admins)
- Order management (users can place orders, admins can update status)
- Session management with express-session
- MongoDB integration for all data
- Responsive UI with EJS templates
- Protected routes for users and admins


## Prerequisites
- Node.js (v14 or higher)
- MongoDB (running locally on port 27017 or provide your own URI)

## Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd Lab_Task_4
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure MongoDB:**
   - Make sure MongoDB is running locally (default: mongodb://localhost:27017/burberry-express)
   - Or, update the MongoDB URI in your `app.js` if using a remote database

4. **Seed the database with sample data (optional):**
   ```bash
   node seed.js
   ```
   This will create sample users, products, and (optionally) an admin.

5. **Start the application:**
   ```bash
   npm start
   ```
   The app will run at [http://localhost:3000](http://localhost:3000)

## Usage
- Visit `/register` to create a new user account
- Visit `/login` to log in as a user
- Visit `/admin-login` to log in as an admin
- Admins can manage products and orders from the admin dashboard
- Users can browse products, add to cart, and place orders

## Sample User Credentials
After running the seed script, you can log in with:
- Email: john@example.com | Password: password123
- Email: jane@example.com | Password: password123

## Sample Admin Credentials
- Email: admin@example.com | Password: iamadmin (if seeded)

## Project Structure
- `app.js` - Main application file
- `models/` - Mongoose schemas for MongoDB collections
- `middleware/` - Custom middleware functions a user not logged in cannot see his cart or his orders
- `views/` - EJS templates for all pages
- `public/` - Static files (CSS, images)
- `seed.js` - Database seeding script

## Database Schemas

### User
```
title: String (enum: ['Mr', 'Ms', 'Mrs', 'Miss'], required)
firstName: String (required)
lastName: String (required)
email: String (required, unique)
phoneNumber: String (required)
password: String (required)
createdAt: Date (default: now)
isAdmin: Boolean (default: false)
```

### Product
```
title: String (required)
price: Number (required)
description: String (required)
imageUrl: String (required)
createdAt: Date (default: now)
```

### Order
```
user: ObjectId (ref: User, required)
products: [
  {
    name: String (required),
    price: String (required),
    quantity: Number (required, default: 1)
  }
]
totalAmount: String (required)
orderDate: Date (default: now)
status: String (enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'], default: 'pending')
customerDetails: {
  name: String,
  phone: String,
  address: String
}
```

### Admin
```
username: String (required, unique)
email: String (required, unique)
password: String (required)
isSuperAdmin: Boolean (default: false)
createdAt: Date (default: now)
```

## Authentication Flow
1. User or admin logs in
2. Session is created and user/admin info is stored
3. Protected routes check for valid session and role
4. Logout destroys the session

## Protected Routes
- `/my-orders` - Displays the logged-in user's orders
- `/admin/products` - Admin product management
- `/admin/orders` - Admin order management

## Customization
- Update styles in `public/styles.css` or EJS files for branding
- Add more fields to schemas as needed
- Extend admin/user roles as required

## Troubleshooting
- Ensure MongoDB is running before starting the app
- Check the terminal for errors if the app doesn't start
- For password issues, check if passwords are hashed or plaintext in your seed data

---

For any questions or issues feel free to reach out!