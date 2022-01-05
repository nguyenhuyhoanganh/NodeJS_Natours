const Tour = require('./../models/tourModel');

// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// );
exports.aliasTopTours = (req, _, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

// 1) mongodb query
// const tours = await Tour.find({
//   duration: 5,
//   difficulty: 'easy'
// });
// 2) mongoose method
// const tours = await Tour.find()
//   .where('duration')
//   .lt(5)
//   .where('difficulty')
//   .equals('easy');

exports.getAllTours = async (req, res) => {
  try {
    // FILTER QUERY
    // request.query
    // ?duration=5&difficulty=easy : { duration: '5', difficulty: 'easy' }
    // ?duration[gte]=5&difficulty=easy : { duration: { gte: '5' }, difficulty: 'easy' }
    // 1A) Filtering
    const queryObj = { ...req.query };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(el => delete queryObj[el]);
    // 1B) Advanced filtering
    let queryStr = JSON.stringify(queryObj); // chuyển object về thành chuỗi string
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
    // gte => $gte, lte => $lte, lt => $lt

    let query = Tour.find(JSON.parse(queryStr));

    // 2) SORTING
    // &sort=price : sắp xếp theo giá tăng dần
    // &sort=-price : sắp xếp theo giá giảm dần
    // &sort=price,ratingsAverage : sắp xếp theo giá, rồi theo rating
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      console.log(sortBy);
      // "price,ratingsAverage" => "price ratingsAverage"
      // sort('price ratingsAverage') : sort theo nhiều tiêu chí
      query = query.sort(sortBy);
    } else {
      query = query.sort('-creatAt');
    }

    // 3) FIELD LIMITING
    // lọc chọn các fields để hiển thị : &fields=name,price,duration,ratingsAverage
    if (req.query.fields) {
      const fields = req.query.fields.split(',').join(' ');
      query = query.select(fields);
    } else {
      query = query.select('-__v');
    }

    // 4) PAGINATION
    // &page=2&limit=10 : 11 -> 21, skip = 10
    const page = +req.query.page || 1;
    const limit = +req.query.limit || 100;
    const skip = (page - 1) * limit;

    query = query.skip(skip).limit(limit);

    if (req.query.page) {
      const numTours = Tour.countDocuments();
      if (skip >= numTours) throw new Error('This page dose not exist');
    }

    // 5) EXCUTE QUERY
    const tours = await query;

    res.status(200).json({
      status: 'success',
      results: tours.length,
      data: { tours }
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err
    });
  }
};

exports.getTour = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);
    //Tour.findOne({ _id: req.params.id })
    res.status(200).json({
      status: 'success',
      data: { tour }
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err
    });
  }
};

exports.createTour = async (req, res) => {
  try {
    // const newTour = new Tour({});
    // newTour.save();
    const newTour = await Tour.create(req.body);

    res.status(201).json({
      status: 'success',
      data: { newTour }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err
    });
  }
};

exports.updateTour = async (req, res) => {
  try {
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
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err
    });
  }
};

exports.deleteTour = async (req, res) => {
  try {
    await Tour.findByIdAndDelete(req.params.id);
    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err
    });
  }
};
