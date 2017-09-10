const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const slug = require('slugs');

const storeSchema = new mongoose.Schema({
  name: {
    type: String,
    trime: true,
    required: 'Please enter a store name!'
  },
  slug: String,
  description: {
    type: String,
    trim: true
  },
  tags: [String],
  created: {
    type: Date,
    default: Date.now
  },
  picture: {
    type: String,
    default: ''
  },
  location: {
    type: {
      type: String,
      default: 'Point'
    },
    coordinates: [{
      type: Number,
      required: 'You must supply co-ordinates!'
    }],
    address: {
      type: String,
      required: 'You must supply an address!'
    }
  },
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: 'You must supply an author'
  }
},{
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Define our indexes
storeSchema.index({
  name: 'text',
  description: 'text'
});

storeSchema.index({
  location: '2dsphere'
});
// Indexes end

storeSchema.pre('save', async function (next) {
  if (this.isNew || this.isModified(this.name)) {
    this.slug = slug(this.name);
  }

  //find store with the same slug name if any
  const storeRegex = new RegExp(`^(${this.slug})(-([0-9])*)?$`,'i');
  const storesWithSlug = await this.constructor.find({ slug: storeRegex });

  if(storesWithSlug.length > 0) {
    this.slug = `${this.slug}-${(storesWithSlug.length+1)}`;
  }
  next();
});

storeSchema.statics.getTagsList = function() {
  const tagsList = this.aggregate([
    { $unwind : "$tags"},
    { $group : { _id : "$tags", count : {$sum : 1} } },
    { $sort : { count : -1 } }
  ]);

  return tagsList;
};

storeSchema.statics.getTopStores = function() {
  // Lookup Stores and populate their reviews
  // filter for only items that have 2 or more reviews
  // Add the average reviews field
  // sort it by our new field, highest reviews first
  // limit to at most 10

  return this.aggregate(
    {$lookup: {
      from: 'reviews', 
      localField: '_id', 
      foreignField: 'store', 
      as: 'reviews'
     }
    },
    {$match: { 'reviews.1': {$exists: true} }},
    {$project: {
      photo: '$$ROOT.picture',
      name: '$$ROOT.name',
      reviews: '$$ROOT.reviews',
      slug: '$$ROOT.slug',
      averageRating: { $avg: '$reviews.rating' }
    }},
    {$sort: { averageRating: -1 }}
  ).limit(10);
};

storeSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'store'
});

function autopopulate(next) {
  this.populate('reviews');
  next();
}

storeSchema.pre('find', autopopulate);
storeSchema.pre('findOne', autopopulate);

module.exports = mongoose.model('Store', storeSchema);