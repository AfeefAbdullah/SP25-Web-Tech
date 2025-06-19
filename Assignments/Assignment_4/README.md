# Burberry Express Application with Authentication

## Overview
This is an Express.js application for a Burberry-inspired e-commerce website with user authentication, session management, and protected routes.

## Features
- User authentication (login/register/logout)
- Session management with express-session
- Protected routes for authenticated users
- MongoDB integration for user and order data
- Responsive UI with EJS templates

## Prerequisites
- Node.js (v14 or higher)
- MongoDB (running locally on port 27017)

## Installation

1. Clone the repository

2. Install dependencies
```
npm install
```

3. Make sure MongoDB is running on your local machine

4. Seed the database with sample data (optional)
```
node seed.js
```

5. Start the application
```
npm start
```

6. Access the application at http://localhost:3000

## Sample User Credentials
After running the seed script, you can log in with these credentials:

- Email: john@example.com
  Password: password123

- Email: jane@example.com
  Password: password123

## Project Structure
- `app.js` - Main application file
- `models/` - MongoDB models
- `middleware/` - Custom middleware functions
- `views/` - EJS templates
- `public/` - Static files (CSS, images)
- `seed.js` - Database seeding script

## Authentication Flow
1. User registers or logs in
2. Session is created and user info is stored
3. Protected routes check for valid session
4. Logout destroys the session

## Protected Routes
- `/my-orders` - Displays the logged-in user's orders