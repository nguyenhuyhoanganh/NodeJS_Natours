const mongoose = require('mongoose');
const slugify = require('slugify');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true
    },
    slug: String,
    price: {
      type: Number,
      required: [true, 'A tour must have a price']
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration']
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size']
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty']
    },
    ratingsAverage: {
      type: Number,
      default: 4.5
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    priceDiscount: Number,
    summary: {
      type: String,
      trim: true, // cắt bỏ khoảng trắng đầu và cuối chuỗi
      required: [true, 'A tour must have a summary']
    },
    description: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image']
    },
    images: [String],
    creatAt: {
      type: Date,
      default: Date.now(),
      select: false // không cho phép select
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false
    }
  },
  {
    toJSON: { virtuals: true }, // virtual properties xuất ra dưới dạng JSON
    toObject: { virtuals: true } // dữ liệu được xuất như 1 Object
  }
);
// thêm option thứ 2 vào mongoose.Schema() để hiển thị ra

tourSchema.virtual('durationWeek').get(function() {
  return this.duration / 7;
}); // virtual properties sẽ được thêm mỗi khi dùng phương thức GET

// DOCUMENT MIDDLEWARE: runs before .save() and .create(), not insertMany
tourSchema.pre('save', function(next) {
  this.slug = slugify(this.name, { lower: true });
  next(); // cần được gọi ra nếu có 2 middlewares chèn vào trc 1 event
});

// QUERY MIDDLEWARE
// tourSchema.pre('find', function(next) {
tourSchema.pre(/^find/, function(next) {
  this.find({ secretTour: { $ne: true } });
  // this trỏ đến truy vấn hiện tại, không phải document
  this.start = Date.now();
  next();
});

tourSchema.post(/^find/, function(docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds!`);
  next();
});

// AGGREGATION MIDDLEWARE
tourSchema.pre('aggregate', function(next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });

  console.log(this.pipeline());
  next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;

/*
// tạo 1 object instance model như tạo 1 instance của 1 class
const testTour = new Tour({
  name: 'The Forest Hiker',
  price: 497,
  rating: 4.7
});

// lưu vào database, trả về 1 promise có quyền truy cập đến document vừa save
// bắt lỗi tại catch, object trả về thêm trường _id và _v
testTour
  .save()
  .then(doc => {
    console.log(doc);
  })
  .catch(err => console.error(err));
  */
