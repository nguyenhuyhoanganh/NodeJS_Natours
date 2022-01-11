const mongoose = require('mongoose');
const slugify = require('slugify');

// const User = require('./userModel');

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
      max: [5, 'Rating must be below 5.0'],
      // thực thi set mỗi khi có 1 giá trị mới được đặt
      // ở đây sẽ thực hiện làm tròn
      set: val => Math.round(val * 10) / 10
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
      // Date nhập vào định dạng yyyy-MM-dd
      default: Date.now(),
      select: false // không cho phép select
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false
    },
    startLocation: {
      // GeoJSON: Mongo sử dụng GeoJSON để định dạng dữ liệu không gian địa lý
      // ít nhất phải có 2 fields chỉ định type (gồm 1 số option với định dạnh point, ...) và coordinates chỉ định tọa độ
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
        // định dạng type cho GeoJSON, có thể là point, polygons, lines
        // ở đây sẽ dùng point
      },
      coordinates: [Number],
      // 1 mảng định dạng tọa độ của GeoJSON: kinh độ:  longitude và vĩ độ: latitude
      // khác với định dạng của google map là latitude trước, longitude sau

      address: String,
      description: String
    },
    // Nhúng data set location vào tour là 1 mảng các point
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
      }
    ],
    // tham chiếu Child Referencing tới user
    // đưa 1 mảng _id vào guides, khi save trong mongodb sẽ là kiểu ObjectId
    guides: [
      {
        // kiểu ObjectId
        type: mongoose.Schema.ObjectId,
        // chỉ định tham chiếu tới User
        ref: 'User'
      }
    ]
  },
  {
    toJSON: { virtuals: true }, // virtual properties xuất ra dưới dạng JSON
    toObject: { virtuals: true } // dữ liệu được xuất như 1 Object
  }
  // thêm option thứ 2 vào mongoose.Schema() để hiển thị ra virtual properties
);
/////////////////////////////////////////////////////////////////////////////////////////////////////
//INDEXES
tourSchema.index({ slug: 1 });
// đánh chỉ mục cho slug, giúp truy vấn với slug nhanh hơn nhưng tốn bộ nhớ hơn

/////////////////////////////////////////////////////////////////////////////////////////////////////
// VIRTUAL PROPERTIES
tourSchema.virtual('durationWeek').get(function() {
  return this.duration / 7;
}); // virtual properties sẽ được thêm mỗi khi dùng phương thức GET

// Virtual populate
// mục đích không muốn thêm 1 mảng id reviews phát tiền vô hạn trong tour trên db
tourSchema.virtual('reviews', {
  // chỉ định bảng tham chiếu
  ref: 'Review',
  // chỉ định field tham chiếu tới trong bảng được tham chiếu
  // ở Review sẽ là field: tour
  foreignField: 'tour',
  // field được tham chiếu trong model hiện tại
  // ở Tour là: _id
  localField: '_id'
});
/////////////////////////////////////////////////////////////////////////////////////////////////////
// DOCUMENT MIDDLEWARE: runs before .save() and .create(), not insertMany
tourSchema.pre('save', function(next) {
  this.slug = slugify(this.name, { lower: true });
  next(); // cần được gọi ra nếu có 2 middlewares chèn vào trc 1 event
});

/*
// CÁCH NHÚNG CẢ USER VÀO TOUR
guides: Array, // Thêm ở schema tour, là 1 mảng object
// khi đưa vào body chỉ 1 mảng các _id của user, trước khi save sẽ đưa cả user vào tour
tourSchema.pre('save', async function(next) {
  // findById là hàm bất đồng bộ => phải sử dụng promise.all()
  const guidesPromise = this.guides.map(async id => await User.findById(id));
  this.guides = Promise.all(guidesPromise);
  next();
});
*/
/////////////////////////////////////////////////////////////////////////////////////////////////////
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

tourSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'guides',
    // chỉ định field tham chiếu dữ liệu
    select: '-__v -passwordChangedAt'
    // loại bỏ field của bảng tham chiếu không muốn xuất hiện
  });
  // .populate('guides') lấp đầy field guides bằng dữ liệu được tham chiếu tới
  // .populate vẫn sẽ tạo 1 query mới => ảnh hưởng đến hiệu suất
  next();
});

tourSchema.post(/^find/, function(docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds!`);
  // tính thời gian query
  next();
});

/////////////////////////////////////////////////////////////////////////////////////////////////////
// AGGREGATION MIDDLEWARE
tourSchema.pre('aggregate', function(next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  // ẩn secretTour = true
  // this.pipeline() trả về array truyền vào aggregate function
  // .unshift() // thêm 1 phần tử vào đầu array
  console.log(this.pipeline());
  next();
});
/////////////////////////////////////////////////////////////////////////////////////////////////////
const Tour = mongoose.model('Tour', tourSchema);
//'Tour' sẽ đổ thành collection tours trong db
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
