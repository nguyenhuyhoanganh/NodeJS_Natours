const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty!']
    },
    rating: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0']
    },
    createAt: {
      type: Date,
      // Date nhập vào định dạng yyyy-MM-dd
      default: Date.now()
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour!']
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user!']
    }
  },
  {
    toJSON: { virtuals: true }, // virtual properties xuất ra dưới dạng JSON
    toObject: { virtuals: true } // dữ liệu được xuất như 1 Object
  }
);
// INĐEXES
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });
// thêm option thứ 2 để đặt cặp key tour_user là duy nhất
// tránh cho 1 người dùng review về 1 tour 2 lần

// QUERY MIDDLEWARE
reviewSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'user',
    select: 'name photo'
  });
  // data về tour được lấy đi kèm với tour
  next();
});

// STATIC METHODS: gắn kèm với model không phải cho từng document
reviewSchema.statics.calcAverageRatings = async function(tourId) {
  // this trỏ đến model hiện tại
  const stats = await this.aggregate([
    {
      $match: { tour: tourId }
      // lọc qua tour cùng id
    },
    {
      $group: {
        _id: '$tour',
        // nhóm các review có cùng field tour
        nRating: { $sum: 1 },
        // tính tổng số lượt rating
        avgRating: { $avg: '$rating' }
        // tính trung bình rating
      }
    }
  ]);
  // console.log(stats);

  // cập nhật tour tương ứng
  if (stats.length > 0) {
    // chỉ thực thi nếu có review => stats là mảng không rỗng
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      // đặt về deafault nếu không có review nào
      ratingsQuantity: 0,
      ratingsAverage: 4.5
    });
  }
};
// cần thực hiện sau khi save, create, update, delete => sử dụng post hook

// DOCUMENT MIDDLEWARE
// gọi calcAverageRatings sau khi save, dùng post
reviewSchema.post('save', function() {
  // this points to current review
  // this trỏ đến chính document sắp được save
  // không thể gọi trực tiếp Review.calcAverageRatings(this.tour)
  // bới vì Review được khai báo sau, mà thứ tự thực thi các middleware ở schema là lần lượt
  // => sử dụng this.constructor để trỏ đến chính Model
  this.constructor.calcAverageRatings(this.tour);
});

// QUERY MIDDLEWARE
// findByIdAndUpdate : chính là findOneAndUpdate với Id hiện tại
// findByIdAndDelete : chính là findOneAndDelete với Id hiện tại
// với query middleware, this không trỏ đến documnet hay đến model mà trỏ đến query
reviewSchema.pre(/^findOneAnd/, async function(next) {
  // this.findOne() thực thi luôn truy vấn và trả về document đang được thực thi
  // lưu documnet này vào this.r, this.r vẫn là document trước khi update hoặc delete
  // nhưng chỉ cần quan tâm đến field tour lấy ra tourId để thực hiện calcAverageRatings
  // và việc update hay delete không ảnh hưởng đến field tourId
  this.r = await this.findOne();
  // console.log(this.r);
  next();
});

reviewSchema.post(/^findOneAnd/, async function(result) {
  // await this.findOne(); does NOT work here, query has already executed
  // this.r là document đã thực thi, => từ document này .contructor sẽ trỏ đến model và gọi được static method
  await this.r.constructor.calcAverageRatings(this.r.tour);

  // await result.constructor.calcAverageRatings(result.tour);
  // thực ra post của query middleware vẫn nhận vào tham số result là document trả về của findOne()
  // vẫn lấy ra model từ documnet đó bằng cách result.constructor, nhưng k hiểu sao Jonas không dùng ???
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
