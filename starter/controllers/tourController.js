const Tour = require('./../models/tourModel');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');
const AppError = require('./../utils/appError');

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
        _id: { $toUpper: '$difficulty' }, // nhóm theo tên độ khó, đặt id của từng group = ký tự viết hoa tên độ khó
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

// /tours-within/:distance/center/:latlng/unit/:unit
// /tours-within/233/center/34.111745,-118.113491/unit/mi
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
  // đơn vị là dặm thì bán kính trái đất là 3963.2
  // đơn vị là km thì bán kính là 6378.1

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitutr and longitude in the format lat,lng.',
        400
      )
    );
  }

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
  });
  // $geoWithin: là tìm kiếm document trong 1 hình học nhất đinh
  // $centerSphere: xác định trung tâm hình cầu, với tâm là tọa độ [lng, lat], bán kình là radius
  // phải đưa vào longitude trước latitude sau, ngược lại với google map
  // radius có đơn vị đo radian là khoảng cách / bán kính trái đất

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours
    }
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;
  // áp dụng chuyển đổi metter sang mi hoặc km

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitutr and longitude in the format lat,lng.',
        400
      )
    );
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        // toán tử truy vấn địa lý duy nhất của aggregate, luôn được đặt đầu tiên
        // yêu cầu ít nhất trong các fields của Model phải chứa geospatial index
        // nếu chỉ có 1 field chứa geospatial index thì $geoNear sẽ tự động sử dụng index đó để tính toán
        // nếu có nhiều field chứa geospatial index thì phải sử dụng keys parameter để xác định index muốn tính toán
        // ở đây Tour chỉ có startLocation => tự động sửu dụng startLocation
        near: {
          // so sánh startLocation với [lat, lng] trong url
          type: 'Point',
          coordinates: [+lng, +lat]
        },
        distanceField: 'distance',
        // xác định tên khoảng cách tính toán được lưu vào field distance
        distanceMultiplier: multiplier
        // chỉ định số sẽ nhân với khoảng cách tính được để cho ra kết quả cuối cùng
        // multiplier ở đây là tỷ lệ chuyển đổi từ metter sang mi hoặc km
      }
    },
    {
      $project: {
        // giới hạn các fields muốn hiển thị thay vì hiển thị tất cả thông tin của tour
        distance: 1,
        name: 1
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distances
    }
  });
});
