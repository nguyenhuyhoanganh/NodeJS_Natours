const Tour = require('./../models/tourModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');

// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// );

exports.aliasTopTours = (req, _, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

exports.getAllTours = catchAsync(async (req, res, next) => {
  // EXCUTE QUERY
  const features = new APIFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const tours = await features.query;

  // SEND RESPONSE
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: { tours }
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.id);
  //Tour.findOne({ _id: req.params.id })
  res.status(200).json({
    status: 'success',
    data: { tour }
  });
});

// catchAsync nhận vào 1 funtion trả về 1 function: promise.catch() , function này sẽ được gán cho exports.createTour
exports.createTour = catchAsync(async (req, res, next) => {
  // const newTour = new Tour({});
  // newTour.save();
  const newTour = await Tour.create(req.body);

  res.status(201).json({
    status: 'success',
    data: { newTour }
  });
});

exports.updateTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  // new : true là 1 options thêm vào để sau khi update trả về 1 document mới được thêm vào
  // runValidators: true để bật xác thực khi update
  res.status(200).json({
    status: 'success',
    data: { tour }
  });
});

exports.deleteTour = catchAsync(async (req, res, next) => {
  await Tour.findByIdAndDelete(req.params.id);
  res.status(204).json({
    status: 'success',
    data: null
  });
});

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
