const mongoose = require('mongoose');
const User = require('./models/User');
const Order = require('./models/Order');
const Admin = require('./models/Admin');
const Product = require('./models/Product');

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
  },
  // Admin user
  {
    title: 'Mr',
    firstName: 'admin123',
    lastName: 'admin',
    email: 'admin@example.com',
    phoneNumber: '0000000000',
    password: 'iamadmin',
    isAdmin: true
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

// Sample admin data
const admins = [
  {
    username: 'admin123',
    email: 'admin@example.com',
    password: 'iamadmin',
    isSuperAdmin: true
  }
];

const productList = [
    {
        title: 'Accessories',
        imageUrl: '/images/Accessories.jpg',
        price: 100,
        description: 'Luxury accessories collection'
    },
    {
        title: 'Formal Coats',
        imageUrl: '/images/Car1.jpg',
        price: 200,
        description: 'Elegant formal coats'
    },
    {
        title: 'Funky Coats',
        imageUrl: '/images/Car2.jpg',
        price: 300,
        description: 'Stylish funky coats collection'
    },
    {
        title: 'Plain Hoodie',
        imageUrl: '/images/Check Hoodie.jpg',
        price: 150,
        description: 'Comfortable plain hoodie'
    },
    {
        title: 'Check Polo',
        imageUrl: '/images/Check Polo.jpg',
        price: 200,
        description: 'Classic check polo shirt'
    },
    {
        title: 'Check Shirt',
        imageUrl: '/images/Check Shirt.jpg',
        price: 200,
        description: 'Signature check shirt'
    },
    {
        title: 'Check Skirt',
        imageUrl: '/images/Check Skirt.jpg',
        price: 400,
        description: 'Elegant check skirt'
    },
    {
        title: 'Leather Bag',
        imageUrl: '/images/LeatherBag.jpg',
        price: 900,
        description: 'Premium leather bag'
    },
    {
        title: 'Crinkled Scarf',
        imageUrl: '/images/Scarf.jpg',
        price: 100,
        description: 'Stylish crinkled scarf'
    },
    {
        title: 'Trench Coat',
        imageUrl: '/images/Trench Coat.jpg',
        price: 1200,
        description: 'Iconic trench coat'
    }
];

// Seed database
const seedDatabase = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Order.deleteMany({});
    await Admin.deleteMany({});
    await Product.deleteMany({});
    console.log('Cleared existing data');

    // Create users
    for (const userData of users) {
      const user = new User(userData);
      await user.save();
      console.log(`Created user: ${user.email}`);
      
      // Create orders for this user
      await createOrders(user._id);
    }

    // Create admins
    for (const adminData of admins) {
      const admin = new Admin(adminData);
      await admin.save();
      console.log(`Created admin: ${admin.email}`);
    }

    // Insert new products
    await Product.insertMany(productList);
    console.log('Products seeded successfully!');

    console.log('Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();