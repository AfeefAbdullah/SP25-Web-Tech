const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();

// Set EJS as templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Use express-ejs-layouts
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// Session configuration
app.use(session({
    secret: 'burberry-secret-key-2025',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // Set to true in production with HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

// Middleware to pass user session to all views
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.isAuthenticated = !!req.session.user;
    next();
});

// In-memory user storage (use database in production)
const users = [];

// Dummy product data
const productList = [
    {
        name: 'Classic Trench Coat',
        image: '/images/Trench Coat.jpg',
        price: '£1,790'
    },
    {
        name: 'Classic Check Scarf',
        image: '/images/Scarf.jpg',
        price: '£450'
    },
    {
        name: 'TB Leather Bag',
        image: '/images/LeatherBag.jpg',
        price: '£1,290'
    }
];

// Authentication middleware
const requireAuth = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/login');
    }
};

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
app.get('/login', (req, res) => {
    if (req.session.user) {
        return res.redirect('/');
    }
    res.render('login', { 
        title: 'Burberry - Login',
        error: null 
    });
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.render('login', { 
            title: 'Burberry - Login',
            error: 'Please provide both email and password' 
        });
    }
    
    const user = users.find(u => u.email === email);
    
    if (user && await bcrypt.compare(password, user.password)) {
        req.session.user = {
            id: user.id,
            name: user.name,
            email: user.email
        };
        res.redirect('/');
    } else {
        res.render('login', { 
            title: 'Burberry - Login',
            error: 'Invalid email or password' 
        });
    }
});

// Register routes
app.get('/register', (req, res) => {
    if (req.session.user) {
        return res.redirect('/');
    }
    res.render('register', { 
        title: 'Burberry - Register',
        error: null 
    });
});

app.post('/register', async (req, res) => {
    const { name, email, password, confirmPassword } = req.body;
    
    // Basic validation
    if (!name || !email || !password || !confirmPassword) {
        return res.render('register', { 
            title: 'Burberry - Register',
            error: 'All fields are required' 
        });
    }
    
    if (password !== confirmPassword) {
        return res.render('register', { 
            title: 'Burberry - Register',
            error: 'Passwords do not match' 
        });
    }
    
    if (password.length < 8) {
        return res.render('register', { 
            title: 'Burberry - Register',
            error: 'Password must be at least 8 characters long' 
        });
    }
    
    // Check if user already exists
    if (users.find(u => u.email === email)) {
        return res.render('register', { 
            title: 'Burberry - Register',
            error: 'User with this email already exists' 
        });
    }
    
    // Hash password and save user
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
        id: users.length + 1,
        name,
        email,
        password: hashedPassword
    };
    
    users.push(newUser);
    
    // Auto-login after registration
    req.session.user = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email
    };
    
    res.redirect('/');
});

// Logout route
app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Session destruction error:', err);
        }
        res.redirect('/');
    });
});

// Protected dashboard route (example)
app.get('/dashboard', requireAuth, (req, res) => {
    res.render('dashboard', {
        title: 'Burberry - Dashboard'
    });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Visit: http://localhost:${PORT}`);
});