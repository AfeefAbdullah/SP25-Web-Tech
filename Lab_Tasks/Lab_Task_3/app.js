const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');

// Import models
const User = require('./models/User');
const Order = require('./models/Order');

// Import middleware
const { ensureAuthenticated, ensureNotAuthenticated, setUserData } = require('./middleware/auth');

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
    ttl: 60 // 1 minute
  }),
  cookie: {
    maxAge: 60 * 1000 // 1 minute in milliseconds
  }
}));

// Set user data for all views
app.use(setUserData);

// Dummy product data
const productList = [
    {
        name: 'Accessories',
        image: '/images/Accessories.jpg',
        price: '£100'
    },
    {
        name: 'Car1',
        image: '/images/Car1.jpg',
        price: '£200'
    },
    {
        name: 'Car2',
        image: '/images/Car2.jpg',
        price: '£300'
    },
    {
        name: 'Check Hoodie',
        image: '/images/Check Hoodie.jpg',
        price: '£400'
    },
    {
        name: 'Check Polo',
        image: '/images/Check Polo.jpg',
        price: '£500'
    },
    {
        name: 'Check Shirt',
        image: '/images/Check Shirt.jpg',
        price: '£600'
    },
    {
        name: 'Check Skirt',
        image: '/images/Check Skirt.jpg',
        price: '£700'
    },
    {
        name: 'Check bikini',
        image: '/images/Check bikini.jpg',
        price: '£800'
    },
    {
        name: 'Leather Bag',
        image: '/images/LeatherBag.jpg',
        price: '£900'
    },
    {
        name: 'Men',
        image: '/images/Men.jpg',
        price: '£1000'
    },
    {
        name: 'Scarf',
        image: '/images/Scarf.jpg',
        price: '£1100'
    },
    {
        name: 'Trench Coat',
        image: '/images/Trench Coat.jpg',
        price: '£1200'
    },
    {
        name: 'Women',
        image: '/images/Women.jpg',
        price: '£1300'
    }
];

// Home route with dynamic products
app.get('/', (req, res) => {
    res.render('index', {
        title: 'Burberry - Home',
        products: productList
    });
});

// Products route with dynamic products
app.get('/products', (req, res) => {
    res.render('products', {
        title: 'Burberry - Products',
        products: productList
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

// Cart route (protected)
app.get('/cart', ensureAuthenticated, (req, res) => {
    res.render('cart', {
        title: 'My Cart',
        cartItems: [] // Placeholder for cart items
    });
});
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

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});