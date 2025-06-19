/**
 * Authentication middleware
 * Checks if user is logged in and redirects to login page if not
 */
module.exports = {
  // Middleware to check if user is authenticated
  ensureAuthenticated: (req, res, next) => {
    // If the session has expired and the expired flag is set by setUserData,
    // allow the request to proceed so the popup can be displayed.
    if (res.locals.expired) {
      return next();
    }

    if (req.session && req.session.user) {
      return next();
    }
    
    // Store the requested URL to redirect back after login
    req.session.returnTo = req.originalUrl;
    res.redirect('/login');
  },
  
  // Middleware to check if user is NOT authenticated (for login/register pages)
  ensureNotAuthenticated: (req, res, next) => {
    if (!req.session || !req.session.user) {
      return next();
    }
    
    res.redirect('/');
  },
  
  // Middleware to set user data for all views
  setUserData: (req, res, next) => {
    if (req.session && req.session.user && req.session.cookie.expires && req.session.cookie.expires < new Date()) {
      // Session has expired
      req.session.destroy((err) => {
        if (err) console.error('Error destroying session:', err);
      });
      res.locals.user = null;
      res.locals.expired = true; // Set flag for EJS to display popup
      next();
    } else {
      res.locals.user = req.session && req.session.user ? req.session.user : null;
      res.locals.expired = false;
      next();
    }
  },
  
  // Middleware to check if user is admin
  ensureAdmin: (req, res, next) => {
    if (req.session && req.session.user && req.session.user.isAdmin) {
      return next();
    }
    res.status(403).send('Access denied. Admins only.');
  }
};