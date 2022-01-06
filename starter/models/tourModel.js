const mongoose = require('mongoose');
const slugify = require('slugify');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour name must have less or equal then 40 characters'],
      minlength: [10, 'A tour name must have more or equal then 10 characters']
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
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium, difficult'
      }
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0']
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function(val) {
          // this only points to current doc on NEW document creation
          // không hoạt động với update
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below regular price'
      }
    },
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
  // /^find/ cho phép lọc qua .find(), .findById(), .findOneAndDelete ... tất cả query bắt đầu bằng find
  this.find({ secretTour: { $ne: true } });
  // this trỏ đến query hiện tại, không phải document
  // lọc những secretTour = true, không cho hiển thị trước khi trả về kết quả truy vấn
  this.start = Date.now();
  next();
});

tourSchema.post(/^find/, function(docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds!`);
  // tính thời gian query
  next();
});

// AGGREGATION MIDDLEWARE
tourSchema.pre('aggregate', function(next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  // ẩn secretTour = true
  // this.pipeline() trả về array truyền vào aggregate function
  // .unshift() // thêm 1 phần tử vào đầu array
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
