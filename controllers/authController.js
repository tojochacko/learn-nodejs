const passport = require('passport');
const mongoose = require('mongoose');
const User = mongoose.model('User');
const crypto = require('crypto');
const promisify = require('es6-promisify');
const mail = require('../handlers/mailer');

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

exports.isLoggedIn = (req, res, next) => {
  if(req.isAuthenticated()) {
    next();
    return;
  }
  req.flash('error', 'You must be logged in to do that!');
  res.redirect('/login');
};

exports.forgot = async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if(!user) { //if user not found 
    req.flash('error', 'No user found with this email address');
    res.redirect('/login');
    return;
  }

  user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour from now
  await user.save();

  //create the reset url
  //back ticks not respecting multi-line had to use concatenation here
  const resetURL = `http://${req.headers.host}/account/reset/`+
                    user.resetPasswordToken;
  await mail.send({
    user,
    subject: 'Password Reset',
    filename: 'password-reset',
    resetURL
  });
  req.flash('success', 'You have been emailed the change password link.');
  res.redirect('/login');
};

//middleware
exports.getUserFromToken = async (req, res, next) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() }
  });

  if(!user) { //if no user found
    req.flash('error', 'Password reset token is invalid or expired.');
    res.redirect('/login');
  }

  res.locals.passwordchangefor = user;
  next();
};

exports.reset = async (req, res) => {
  res.render('reset', {
    title: 'Reset your Password'
  });
};

//middleware
exports.confirmPassword = (req, res, next) => {
  //password-confirm contains hyphen, so using bracket syntax below
  if (req.body.password !== req.body['password-confirm']) {
    req.flash('error', 'Passwords and Confirm Password don\'t match.');
    res.redirect('back');
  }
  else {
    next();
  }
};

exports.updatePassword = async (req, res) => {
  const user = res.locals.passwordchangefor; // get the user from the middleware
  if(!user) { //check if we did indeed get the user
    req.flash('Something went wrong! Please try again.');
    res.redirect('/login');
  }

  //update the password now using passport
  const setPassword = promisify(user.setPassword, user);
  await setPassword(req.body.password);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  const updatedUser = await user.save();
  if(!updatedUser) {
    req.flash('error', 'There was some error while updating your Password.'+
    'Please try again.');
    res.redirect('back');
  }

  //login the user
  await req.login(updatedUser);
  req.flash('success', 'Wohoo!! Your password has been updated successfully.');
  res.redirect('/');
};