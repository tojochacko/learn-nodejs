const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const User = mongoose.model('User');
const Jimp = require('jimp');
const uuid = require('uuid');
const multer = require('multer');

exports.upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1000 * 1000
  },
  fileFilter: (req, file, next) => {
    if (!file.mimetype.startsWith('image/')) {
      next({ message: 'This is not a valid image file' }, false);
    }
    next(null, true);
  },
}).single('picture');

exports.resize = async (req, res, next) => {
  //check if there is no new file to resize
  if (!req.file) {
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
  req.body.author = req.user._id;
  const store = await (new Store(req.body)).save();
  req.flash('success', `Successfully created ${store.name}. Care to leave a review?`);
  res.redirect(`/store/${store.slug}`);
};

exports.getStores = async (req, res) => {
  const perPage = 3;
  const currPage = req.params.page || 1;
  const skip = (perPage*currPage) - perPage;

  if(currPage == 0 ) {
    req.flash('info', `Hey redirecting you to the first page.`);
    res.redirect('/stores');
    return;
  }

  //pagination handle
  const storePromise = Store
    .find()
    .skip(skip)
    .limit(perPage)
    .sort({ created: 'desc' });
  const countPromise = Store.count();

  const [stores, count] = await Promise.all([storePromise, countPromise]);
  const pages = Math.ceil(count / perPage);
  if (!stores.length && skip) {
    req.flash('info', `Hey, you asked for a page ${currPage} which does not exists. `+
    `So I put you on page ${pages}`);
    res.redirect(`/stores/page/${pages}`);
    return;
  }

  res.render('stores', {
    title: 'Stores',
    stores,
    page: currPage,
    pages,
    count
  });
};

const confirmOwner = (store, user) => {
  if (!store.author.equals(user._id)) {
    throw Error('You are not the Store Owner');
  }
};

exports.editStore = async (req, res) => {
  const store = await Store.findOne({ _id: req.params.id });
  confirmOwner(store, req.user);
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
                        <a href="/store/${store.slug}">View Store</a>`);
  res.redirect(`/stores/${store._id}/edit`);
};

exports.getStoreBySlug = async (req, res, next) => {
  const store = await Store.findOne({ slug: req.params.slug })
  .populate('author reviews');
  //if store does not exists
  if (!store) return next();
  res.render('store', {
    title: store.name,
    store
  });
};

exports.getStoresByTags = async (req, res) => {
  const tag = req.params.tag;
  const tagQuery = (tag) ? tag : { $exists: true };

  const tagsPromise = Store.getTagsList();
  const storesPromise = Store.find({ tags: tagQuery });
  const [tags, stores] = await Promise.all([tagsPromise, storesPromise]);

  res.render('tags', {
    title: 'Tags',
    tags,
    tag,
    stores
  });
};

exports.searchStores = async (req, res) => {
  const stores = await Store
    .find({
      $text: {
        $search: req.query.q
      }
    }, {
      score: { $meta: 'textScore' }
    })
    .sort({
      score: { $meta: 'textScore' }
    });
  res.json(stores);
};

exports.mapStores = async (req, res) => {
  const coordinates = [req.query.lng, req.query.lat].map(parseFloat);
  const q = {
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates
        },
        $maxDistance: 10000 // 10 kms
      }
    }
  };

  const stores = await Store
  .find(q)
  .select('picture name description location slug')
  .limit(10);
  res.json(stores);
};

exports.mapPage = (req, res) => {
  res.render('map', {
    title: 'Map'
  })
};

exports.heartStore = async (req, res) => {
  const hearts = req.user.hearts.map(obj => obj.toString());
  const operator = hearts.includes(req.params.store_id) ? '$pull' : '$addToSet';
  const user = await User
  .findByIdAndUpdate(req.user._id, 
    { [operator]: { hearts: req.params.store_id }},
    { new: true }
  );
  res.json(user);
};

exports.getTopStores = async (req, res) => {
  const stores = await Store.getTopStores();
  res.render('topStores', { 
    title: '★ Top Stores!',
    stores, 
  });
}