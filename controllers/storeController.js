const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const Jimp = require('jimp');
const uuid = require('uuid');
const multer  = require('multer');

exports.upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1000 * 1000
  },
  fileFilter: (req, file, next) => { 
    if(!file.mimetype.startsWith('image/')) {
      next({ message:'This is not a valid image file' }, false);
    }
    next(null, true);
  },
}).single('picture');

exports.resize = async (req, res, next) => {
  //check if there is no new file to resize
  if(!req.file) {
    next(); //skip to the next middleware
    return;
  }

  const imageExtension = req.file.mimetype.split('/')[1];
  const imageFileName = `${uuid.v4()}.${imageExtension}`;
  req.body.picture = imageFileName;
  //resize the image now
  const resizedImg = await Jimp.read(req.file.buffer);
  await resizedImg.resize(800, Jimp.AUTO);
  resizedImg.write(`./public/uploads/${req.body.picture}`);
  //done resizing now go the next step
  next();
};

exports.homePage = (req, res) => {
  res.render('home', {
    title: 'Home Page'
  });
};

exports.addStore = (req, res) => {
  res.render('editStore', {
    title: 'Add Store'
  });
};

exports.createStore = async (req, res) => {
  const store = await (new Store(req.body)).save();
  req.flash('success', `Successfully created ${store.name}. Care to leave a review?`);
  res.redirect(`/store/${store.slug}`);
};

exports.getStores = async (req, res) => {
  const stores = await Store.find();
  res.render('stores', {
    title: 'Stores',
    stores: stores
  });
};

exports.editStore = async (req, res) => {
  const store = await Store.findOne({ _id: req.params.id });
  //@TODO: check if the store owner is editing
  res.render('editStore', {
    title: 'Edit  ' + store.name,
    store: store
  });
};

exports.updateStore = async (req, res) => {
  //set the location type to be point
  req.body.location.type = 'Point';
  const store = await Store.findOneAndUpdate(
    { _id: req.params.id },
    req.body,
    { new: true, runValidators: true }
  ).exec();
  req.flash('success', `Successfully updated <strong>${store.name}</strong>. 
                        <a href="/stores/${store.slug}">View Store</a>`);
  res.redirect(`/store/${store._id}/edit`);
};

exports.getStoreBySlug = async (req, res, next) => {
  const store = await Store.findOne({ slug: req.params.slug });
  //if store does not exists
  if(!store) return next();
  
  res.render('store', {
    title: store.name,
    store
  });
};

exports.getStoresByTags = async (req, res) => {
  const tag = req.params.tag;
  const tagQuery = (tag) ? tag : { $exists: true }; 

  const tagsPromise = Store.getTagsList();
  const storesPromise = Store.find({ tags : tagQuery });
  const [tags, stores] = await Promise.all([tagsPromise, storesPromise]);

  res.render('tags', {
    title: 'Tags',
    tags,
    tag,
    stores
  });
};