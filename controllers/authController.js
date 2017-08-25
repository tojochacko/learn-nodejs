const passport = require('passport');

exports.login = passport.authenticate('local', {
  successRedirect: '/',
  successFlash: 'Welcome!', 
  failureRedirect: '/login',
  failureFlash: 'Login Failed!'
});

exports.logout = (req, res) => {
  req.logout();
  req.flash('success', 'You are logged out successfully!');
  res.redirect('/');
};