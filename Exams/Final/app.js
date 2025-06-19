const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const multer = require('multer');
const fs = require('fs');

// Import models
const User = require('./models/User');
const Order = require('./models/Order');
const Product = require('./models/Product');
const Admin = require('./models/Admin');
const Vehicle = require('./models/Vehicle');

// Import middleware
const { ensureAuthenticated, ensureNotAuthenticated, setUserData, ensureAdmin } = require('./middleware/auth');

const app = express();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/');
    },
    filename: function (req, file, cb) {
        // Generate unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'vehicle-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter to only allow images
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/burberry')
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
    ttl: 60*30 // 30 minutes
  }),
  cookie: {
    maxAge: 60*30 * 1000 // 30 minutes in milliseconds
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
    const deliveryFee = 500;
    const packagingFee = 100;
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
    const deliveryFee = 500;
    const packagingFee = 100;
    const total = subtotal + deliveryFee + packagingFee;
    // Save order
    try {
        await Order.create({
            user: req.session.user.id,
            products: req.session.cart,
            totalAmount: `Rs ${total.toFixed(2)}`,
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
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });
    
    if (!admin || admin.password !== password) {
      return res.render('admin-login', { title: 'Admin Login', error: 'Invalid email or password' });
    }
    
    req.session.user = {
      id: admin._id,
      email: admin.email,
      firstName: admin.username || 'Admin', // Use username as firstName for display
      isAdmin: true,
      isSuperAdmin: admin.isSuperAdmin || false
    };
    
    res.redirect('/admin-panel');
  } catch (error) {
    console.error('Admin login error:', error);
    res.render('admin-login', { title: 'Admin Login', error: 'An error occurred during login' });
  }
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

// Public: View all vehicles (read-only)
app.get('/vehicles', async (req, res) => {
    try {
        const vehicles = await Vehicle.find().sort({ createdAt: -1 });
        res.render('vehicles', {
            title: 'Vehicles',
            vehicles
        });
    } catch (error) {
        console.error('Error fetching vehicles:', error);
        res.render('vehicles', {
            title: 'Vehicles',
            vehicles: [],
            error: 'An error occurred while fetching vehicles'
        });
    }
});

// Admin: List Vehicles
app.get('/admin/vehicles', ensureAdmin, async (req, res) => {
    try {
        const vehicles = await Vehicle.find().sort({ createdAt: -1 });
        res.render('admin-vehicles', { 
            title: 'Admin - Vehicles', 
            vehicles, 
            user: req.session.user 
        });
    } catch (error) {
        console.error('Error fetching vehicles:', error);
        res.render('admin-vehicles', { 
            title: 'Admin - Vehicles', 
            vehicles: [], 
            user: req.session.user,
            error: 'An error occurred while fetching vehicles'
        });
    }
});

// Admin: Add Vehicle Form
app.get('/admin/vehicles/add', ensureAdmin, (req, res) => {
    res.render('admin-add-vehicle', { 
        title: 'Add Vehicle', 
        user: req.session.user 
    });
});

// Admin: Add Vehicle (POST) - Updated with better error handling
app.post('/admin/vehicles/add', ensureAdmin, (req, res) => {
    // Handle multer errors first
    upload.single('image')(req, res, async function (err) {
        if (err instanceof multer.MulterError) {
            console.error('Multer error:', err);
            return res.render('admin-add-vehicle', { 
                title: 'Add Vehicle', 
                user: req.session.user,
                error: `File upload error: ${err.message}`
            });
        } else if (err) {
            console.error('Other upload error:', err);
            return res.render('admin-add-vehicle', { 
                title: 'Add Vehicle', 
                user: req.session.user,
                error: err.message
            });
        }
        
        try {
            const { name, brand, price, type } = req.body;
            
            console.log('Form data received:', { name, brand, price, type });
            console.log('File received:', req.file);
            console.log('User session:', req.session.user);
            
            // Check if file was uploaded
            if (!req.file) {
                return res.render('admin-add-vehicle', { 
                    title: 'Add Vehicle', 
                    user: req.session.user,
                    error: 'Please select an image file'
                });
            }
            
            // Validate required fields
            if (!name || !brand || !price || !type) {
                // Delete uploaded file since validation failed
                if (req.file) {
                    const filePath = path.join(__dirname, 'public/uploads', req.file.filename);
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                }
                return res.render('admin-add-vehicle', { 
                    title: 'Add Vehicle', 
                    user: req.session.user,
                    error: 'All fields are required'
                });
            }
            
            // Create image path for database storage
            const imagePath = '/uploads/' + req.file.filename;
            
            console.log('Creating vehicle with data:', { name, brand, price, type, image: imagePath });
            
            const newVehicle = await Vehicle.create({ 
                name, 
                brand, 
                price: parseFloat(price),
                type, 
                image: imagePath 
            });
            
            console.log('Vehicle created successfully:', newVehicle);
            res.redirect('/admin/vehicles');
        } catch (error) {
            console.error('Detailed error adding vehicle:', error);
            
            // Delete uploaded file if database save fails
            if (req.file) {
                const filePath = path.join(__dirname, 'public/uploads', req.file.filename);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
            
            res.render('admin-add-vehicle', { 
                title: 'Add Vehicle', 
                user: req.session.user,
                error: `An error occurred while adding the vehicle: ${error.message}`
            });
        }
    });
});

// Admin: Edit Vehicle Form
app.get('/admin/vehicles/edit/:id', ensureAdmin, async (req, res) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id);
        if (!vehicle) {
            return res.redirect('/admin/vehicles');
        }
        res.render('admin-edit-vehicle', { 
            title: 'Edit Vehicle', 
            vehicle, 
            user: req.session.user 
        });
    } catch (error) {
        console.error('Error fetching vehicle:', error);
        res.redirect('/admin/vehicles');
    }
});

// Admin: Edit Vehicle (POST) - Updated to handle file upload
app.post('/admin/vehicles/edit/:id', ensureAdmin, upload.single('image'), async (req, res) => {
    try {
        const { name, brand, price, type } = req.body;
        const vehicleId = req.params.id;
        
        // Get current vehicle data
        const currentVehicle = await Vehicle.findById(vehicleId);
        if (!currentVehicle) {
            return res.redirect('/admin/vehicles');
        }
        
        let imagePath = currentVehicle.image; // Keep existing image if no new one uploaded
        
        // If new image is uploaded
        if (req.file) {
            // Delete old image file if it exists and is a local upload
            if (currentVehicle.image && currentVehicle.image.startsWith('/uploads/')) {
                const oldImagePath = path.join(__dirname, 'public', currentVehicle.image);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
            
            // Set new image path
            imagePath = '/uploads/' + req.file.filename;
        }
        
        await Vehicle.findByIdAndUpdate(vehicleId, { 
            name, 
            brand, 
            price, 
            type, 
            image: imagePath 
        });
        
        res.redirect('/admin/vehicles');
    } catch (error) {
        console.error('Error updating vehicle:', error);
        
        // Delete uploaded file if database update fails
        if (req.file) {
            const filePath = path.join(__dirname, 'public/uploads', req.file.filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        
        res.redirect('/admin/vehicles');
    }
});

// Admin: Delete Vehicle - Updated to delete associated image file
app.post('/admin/vehicles/delete/:id', ensureAdmin, async (req, res) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id);
        
        if (vehicle) {
            // Delete image file if it's a local upload
            if (vehicle.image && vehicle.image.startsWith('/uploads/')) {
                const imagePath = path.join(__dirname, 'public', vehicle.image);
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                }
            }
            
            await Vehicle.findByIdAndDelete(req.params.id);
        }
        
        res.redirect('/admin/vehicles');
    } catch (error) {
        console.error('Error deleting vehicle:', error);
        res.redirect('/admin/vehicles');
    }
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});