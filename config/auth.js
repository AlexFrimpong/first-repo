module.exports = {
  isClient: function (req, res, next) {
    if (req.isAuthenticated() && req.user.role === 'basic') {
      return next();
    }
    req.flash('error_msg', 'Please you are not authorized to view this resource');
    res.redirect('/dashboard');
  },
  isAdmin: function (req, res, next) {
    if (req.isAuthenticated() && req.user.role === 'admin') {
      return next();
    }
    req.flash('error_msg', 'Please you are not authorized to view this resource')
    res.redirect('/dashboard');
  }
};
