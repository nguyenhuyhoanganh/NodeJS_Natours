const mongoose = require('mongoose');

const tourSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A tour must have a name'],
    unique: true,
    trim: true
  },
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
  startDates: [Date]
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
