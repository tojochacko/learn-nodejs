const mongoose = require('mongoose');
const User = mongoose.model('User');
const Store = mongoose.model('Store');
const promisify = require('es6-promisify');

exports.loginForm = (req, res) => {
  res.render('login', {
    title: 'Login'
  })
};

exports.registerForm = (req, res) => {
  res.render('register', {
    title: 'Register'
  })  ;
};

exports.validateRegister = (req, res, next) => {
  req.sanitizeBody('name');
  req.checkBody('name', 'You must supply a name!').notEmpty();
  req.checkBody('email', 'That Email is not valid!').isEmail();
  req.sanitizeBody('email').normalizeEmail({
    remove_dots: false,
    remove_extension: false,
    gmail_remove_subaddress: false
  });
  req.checkBody('password', 'Password cannot be blank').notEmpty();
  req.checkBody('password-confirm', 'Confirm Password cannot be blank')
  .notEmpty();
  req.checkBody('password-confirm', 'Oops! Your passwords do not match')
  .equals(req.body.password);

  const errors = req.validationErrors();
  if(errors) {
    req.flash('error', errors.map(err => err.msg));
    res.render('register', {
      title: 'Register',
      body: req.body,
      flashes: req.flash()
    });
    return; // stop the function from running
  }
  next();
};

exports.addUser = async (req, res, next) => {
  const user = new User({ email: req.body.email, name: req.body.name });
  const register = promisify(User.register, User);
  await register(user, req.body.password);
  next();
};

exports.account = (req, res) => {
  res.render('account', {
    title: 'Edit Your Account'
  });
};

exports.updateAccount = async (req, res) => {
  const updates = {
    email: req.body.email,
    name: req.body.name
  };
  const user = await User.findOneAndUpdate(
    { _id: req.user._id },
    { $set: updates },
    { new: true, runValidators: true, context: 'query' }
  );

  req.flash('success', 'Your account is successfully updated!');
  res.redirect('/account');
};

exports.getHearts = async (req, res) => {
  const stores = await Store.find({
    _id: { $in: req.user.hearts }
  });
  res.render('stores', {
    title: 'Liked Stores',
    stores
  });
};