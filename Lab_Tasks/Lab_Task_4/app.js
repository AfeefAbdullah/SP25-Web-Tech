const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');

// Import models
const User = require('./models/User');
const Order = require('./models/Order');
const Product = require('./models/Product');
const Admin = require('./models/Admin');

// Import middleware
const { ensureAuthenticated, ensureNotAuthenticated, setUserData, ensureAdmin } = require('./middleware/auth');

const app = express();

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/burberry', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log('MongoDB connection error:', err));

// Set EJS as templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Use express-ejs-layouts
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session configuration
app.use(session({
  secret: 'burberry-secret-key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ 
    mongoUrl: 'mongodb://localhost:27017/burberry',
    ttl: 60*30 // 1 minute
  }),
  cookie: {
    maxAge: 60*30 * 1000 // 1 minute in milliseconds
  }
}));

// Set user data for all views
app.use(setUserData);

// Home route with dynamic products from database
app.get('/', async (req, res) => {
    const products = await Product.find().sort({ createdAt: -1 });
    res.render('index', {
        title: 'Burberry - Home',
        products
    });
});

// Products route with dynamic products from database
app.get('/products', async (req, res) => {
    const success = req.session.success;
    delete req.session.success;
    const products = await Product.find().sort({ createdAt: -1 });
    res.render('products', {
        title: 'Burberry - Products',
        products,
        success
    });
});

// About route
app.get('/about', (req, res) => {
    res.render('about', {
        title: 'Burberry - About'
    });
});

// Login routes
app.get('/login', ensureNotAuthenticated, (req, res) => {
    res.render('login', { title: 'Login' });
});

app.post('/login', ensureNotAuthenticated, async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user by email
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.render('login', { 
                title: 'Login',
                error: 'Invalid email or password'
            });
        }
        
        // Check password
        const isMatch = await user.comparePassword(password);
        
        if (!isMatch) {
            return res.render('login', { 
                title: 'Login',
                error: 'Invalid email or password'
            });
        }
        
        // Set user session
        req.session.user = {
            id: user._id,
            title: user.title,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phoneNumber: user.phoneNumber
        };
        
        // Redirect to the originally requested URL or home
        const redirectUrl = req.session.returnTo || '/';
        delete req.session.returnTo;
        
        res.redirect(redirectUrl);
    } catch (error) {
        console.error('Login error:', error);
        res.render('login', { 
            title: 'Login',
            error: 'An error occurred during login'
        });
    }
});

// Register routes
app.get('/register', ensureNotAuthenticated, (req, res) => {
    res.render('register', { title: 'Register' });
});

app.post('/register', ensureNotAuthenticated, async (req, res) => {
    try {
        const { title, firstName, lastName, email, phoneNumber, password, confirmPassword } = req.body;
        
        // Check password length
        if (password.length < 8) {
            return res.render('register', {
                title: 'Register',
                error: 'Password must be at least 8 characters',
                title,
                firstName,
                lastName,
                email,
                phoneNumber
            });
        }
        
        // Check if passwords match
        if (password !== confirmPassword) {
            return res.render('register', {
                title: 'Register',
                error: 'Passwords do not match',
                title,
                firstName,
                lastName,
                email,
                phoneNumber
            });
        }
        
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        
        if (existingUser) {
            return res.render('register', {
                title: 'Register',
                error: 'Email already in use',
                title,
                firstName,
                lastName,
                phoneNumber
            });
        }
        
        // Create new user
        const newUser = new User({
            title,
            firstName,
            lastName,
            email,
            phoneNumber,
            password
        });
        
        await newUser.save();
        
        res.redirect('/login');
    } catch (error) {
        console.error('Registration error:', error);
        res.render('register', {
            title: 'Register',
            error: 'An error occurred during registration'
        });
    }
});

// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Logout error:', err);
            return res.redirect('/');
        }
        res.redirect('/login');
    });
});

// My Orders route (protected)
app.get('/my-orders', ensureAuthenticated, async (req, res) => {
    try {
        const userId = req.session.user.id;
        
        // Fetch user's orders
        const orders = await Order.find({ user: userId }).sort({ orderDate: -1 });
        
        res.render('my-orders', {
            title: 'My Orders',
            orders
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.render('my-orders', {
            title: 'My Orders',
            orders: [],
            error: 'An error occurred while fetching your orders'
        });
    }
});

// Cart route (protected)
app.get('/cart', ensureAuthenticated, (req, res) => {
    // Ensure cart exists in session
    if (!req.session.cart) {
        req.session.cart = [];
    }
    // Filter out items with no price
    req.session.cart = req.session.cart.filter(item => item.price && typeof item.price === 'string' && item.price.trim() !== '');
    res.render('cart', {
        title: 'My Cart',
        cartItems: req.session.cart
    });
});

// Add to Cart route (protected)
app.post('/cart/add', ensureAuthenticated, (req, res) => {
    const { name, image, price } = req.body;
    if (!req.session.cart) {
        req.session.cart = [];
    }
    // Check if product already in cart
    const existing = req.session.cart.find(item => item.name === name);
    if (existing) {
        existing.quantity = (existing.quantity || 1) + 1;
    } else {
        req.session.cart.push({ name, image, price, quantity: 1 });
    }
    req.session.success = `${name} added to cart!`;
    // Redirect back to the page the user came from
    res.redirect(req.get('referer') || '/products');
});

// Empty Cart route (protected)
app.post('/cart/empty', ensureAuthenticated, (req, res) => {
    req.session.cart = [];
    res.redirect('/cart');
});

// Remove from Cart route (protected)
app.post('/cart/remove', ensureAuthenticated, (req, res) => {
    const { name } = req.body;
    if (!req.session.cart) {
        req.session.cart = [];
    }
    const itemIndex = req.session.cart.findIndex(item => item.name === name);
    if (itemIndex !== -1) {
        if (req.session.cart[itemIndex].quantity > 1) {
            req.session.cart[itemIndex].quantity -= 1;
        } else {
            req.session.cart.splice(itemIndex, 1);
        }
    }
    res.redirect('/cart');
});

// Checkout routes (protected)
app.get('/checkout', ensureAuthenticated, (req, res) => {
    if (!req.session.cart || req.session.cart.length === 0) {
        return res.redirect('/cart');
    }
    // Calculate subtotal
    let subtotal = 0;
    req.session.cart.forEach(item => {
        const priceNum = item.price && typeof item.price === 'string' ? parseFloat(item.price.replace(/[^\d.]/g, '')) : 0;
        subtotal += priceNum * item.quantity;
    });
    const deliveryFee = 50;
    const packagingFee = 10;
    const total = subtotal + deliveryFee + packagingFee;
    res.render('checkout', {
        title: 'Checkout',
        cartItems: req.session.cart,
        subtotal: subtotal.toFixed(2),
        deliveryFee: deliveryFee.toFixed(2),
        packagingFee: packagingFee.toFixed(2),
        total: total.toFixed(2)
    });
});

app.post('/checkout', ensureAuthenticated, async (req, res) => {
    if (!req.session.cart || req.session.cart.length === 0) {
        return res.redirect('/cart');
    }
    const { name, phone, address } = req.body;
    // Calculate subtotal, fees, and total
    let subtotal = 0;
    req.session.cart.forEach(item => {
        const priceNum = item.price && typeof item.price === 'string' ? parseFloat(item.price.replace(/[^\d.]/g, '')) : 0;
        subtotal += priceNum * item.quantity;
    });
    const deliveryFee = 50;
    const packagingFee = 10;
    const total = subtotal + deliveryFee + packagingFee;
    // Save order
    try {
        await Order.create({
            user: req.session.user.id,
            products: req.session.cart,
            totalAmount: `£${total.toFixed(2)}`,
            orderDate: new Date(),
            status: 'pending',
            customerDetails: { name, phone, address }
        });
        req.session.cart = [];
        res.render('checkout-success', { title: 'Order Placed' });
    } catch (error) {
        console.error('Order placement error:', error);
        res.status(500).send('Error placing order. Please try again.');
    }
});

// Admin: List Products
app.get('/admin/products', ensureAdmin, async (req, res) => {
  const products = await Product.find().sort({ createdAt: -1 });
  res.render('admin-products', { title: 'Admin - Products', products, user: req.session.user });
});

// Admin: Add Product Form
app.get('/admin/products/add', ensureAdmin, (req, res) => {
  res.render('admin-add-product', { title: 'Add Product', user: req.session.user });
});

// Admin: Add Product (POST)
app.post('/admin/products/add', ensureAdmin, async (req, res) => {
  const { title, price, description, imageUrl } = req.body;
  await Product.create({ title, price, description, imageUrl });
  res.redirect('/admin/products');
});

// Admin: Edit Product Form
app.get('/admin/products/edit/:id', ensureAdmin, async (req, res) => {
  const product = await Product.findById(req.params.id);
  res.render('admin-edit-product', { title: 'Edit Product', product, user: req.session.user });
});

// Admin: Edit Product (POST)
app.post('/admin/products/edit/:id', ensureAdmin, async (req, res) => {
  const { title, price, description, imageUrl } = req.body;
  await Product.findByIdAndUpdate(req.params.id, { title, price, description, imageUrl });
  res.redirect('/admin/products');
});

// Admin: Delete Product
app.post('/admin/products/delete/:id', ensureAdmin, async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.redirect('/admin/products');
});

// Admin: View All Orders
app.get('/admin/orders', ensureAdmin, async (req, res) => {
  const orders = await Order.find().populate('user').sort({ orderDate: -1 });
  res.render('admin-orders', { title: 'Admin - Orders', orders, user: req.session.user });
});

// Admin Login Page
app.get('/admin-login', (req, res) => {
  res.render('admin-login', { title: 'Admin Login' });
});

// Admin Login POST
app.post('/admin-login', async (req, res) => {
  const { email, password } = req.body;
  const admin = await Admin.findOne({ email });
  if (!admin || admin.password !== password) {
    return res.render('admin-login', { title: 'Admin Login', error: 'Invalid email or password' });
  }
  req.session.user = {
    id: admin._id,
    email: admin.email,
    isAdmin: true,
    isSuperAdmin: admin.isSuperAdmin || false
  };
  res.redirect('/admin-panel');
});

// Admin Panel
app.get('/admin-panel', ensureAdmin, (req, res) => {
  res.render('admin-panel', { title: 'Admin Panel', user: req.session.user });
});

// Admin: Update Order Status
app.post('/admin/orders/:id/status', ensureAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.redirect('/admin/orders');
    }

    await Order.findByIdAndUpdate(id, { status });
    res.redirect('/admin/orders');
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).send('Error updating order status');
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});