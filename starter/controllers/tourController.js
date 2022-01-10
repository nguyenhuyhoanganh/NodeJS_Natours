const Tour = require('./../models/tourModel');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');

exports.aliasTopTours = (req, _, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } }
      // lọc qua các tour có ratingsAverage >= 4,5
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' }, // nhóm theo tên độ khó, đặt id của từng group = ký tự viết hoa tên đọ khó
        // tính toán thông tin của từng group
        numTours: { $sum: 1 }, // +1 khi lọc qua mỗi document => lấy ra số lượng
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    },
    {
      $sort: { avgPrice: 1 } // sắp xếp theo tên field tính toán được trong $group, 1 là tăng dần
    }
    // {
    //   $match: { _id: { $ne: 'EASY' } } // lọc _id khác EASY
    // }
    // lọc qua 1 lần nữa các  field trong group mới
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats
    }
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = +req.params.year; // 2021

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates'
      // phân giải cấu trúc 1 fiels kiểu array trong từng document
      // lọc qua từng document tương ứng với từng phần tử của array  : mảng các startDates của document
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
        // lọc ngày bắt đầu và ngày bắt đầu và nggayf kết thúc năm trong năm hiện tại
      }
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        // nhóm theo từng tháng, $month: lấy ra tháng của ngày đưa vào
        numTourStarts: { $sum: 1 }, // đếm số lượng tour theo tháng
        tours: { $push: '$name' } // lấy ra tên tour đẩy vào mảng tours
      }
    },
    {
      $addFields: { month: '$_id' } // thêm fields month: theo _id
    },
    {
      $project: {
        _id: 0 // không hiển thị fields _id, mặc định hiển thị là 1
      }
    },
    {
      $sort: { numTourStarts: -1 } // sắp xếp giảm dần theo số lượng tour trong 1 tháng
    },
    {
      $limit: 12 // giới hạn 12 document
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      plan
    }
  });
});
