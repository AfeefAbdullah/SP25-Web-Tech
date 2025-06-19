const mongoose = require('mongoose');
const User = require('./models/User');
const Order = require('./models/Order');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/burberry', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected for seeding'))
.catch(err => console.log('MongoDB connection error:', err));

// Sample user data
const users = [
  {
    title: 'Mr',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phoneNumber: '1234567890',
    password: 'password123'
  },
  {
    title: 'Ms',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
    phoneNumber: '9876543210',
    password: 'password123'
  }
];

// Sample order data
const createOrders = async (userId) => {
  const orders = [
    {
      user: userId,
      products: [
        {
          name: 'Classic Trench Coat',
          price: '£1,790',
          quantity: 1
        },
        {
          name: 'Classic Check Scarf',
          price: '£450',
          quantity: 1
        }
      ],
      totalAmount: '£2,240',
      status: 'delivered'
    },
    {
      user: userId,
      products: [
        {
          name: 'TB Leather Bag',
          price: '£1,290',
          quantity: 1
        }
      ],
      totalAmount: '£1,290',
      status: 'processing'
    }
  ];

  await Order.insertMany(orders);
  console.log(`Created orders for user ${userId}`);
};

// Seed database
const seedDatabase = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Order.deleteMany({});
    console.log('Cleared existing data');

    // Create users
    for (const userData of users) {
      const user = new User(userData);
      await user.save();
      console.log(`Created user: ${user.email}`);
      
      // Create orders for this user
      await createOrders(user._id);
    }

    console.log('Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();