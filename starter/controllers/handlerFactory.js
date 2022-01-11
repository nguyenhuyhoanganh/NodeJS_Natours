const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const APIFeatures = require('./../utils/apiFeatures');

// Building Handler Factory Functions: Delete, Upade, Create, Reading
// create a function, which will then return a function
// javascript closure: function can access to the variables of the outer function: Model

exports.deleteOne = Model =>
  // catchAsync nhận vào 1 funtion trả về 1 function: promise.catch() , function này sẽ được gán cho exports.createTour
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {
      return next(new AppError('No tour found with that ID', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  });

exports.updateOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    // new : true là 1 options thêm vào để sau khi update trả về 1 document mới được thêm vào
    // runValidators: true để bật xác thực khi update chỉ cho nhưng field thay đổi
    // tuy nhiên nếu là validate: {validator: fn()} thêm vào từng field, ở tourModel có priceDiscount thì sẽ bỏ qua validate này

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });

exports.createOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    // truy vấn thêm các bảng tham chiểu
    if (popOptions) query = query.populate(popOptions);
    const doc = await query;

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });

exports.getAll = Model =>
  catchAsync(async (req, res, next) => {
    // To allow for nested GET reviews on tour (hack)
    // chỉ dành cho reviews cần tourId
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    // dành cho tất cả model còn lại
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    // const doc = await features.query.explain();
    // cho phép thống kê lúc đọc dữ liệu
    const doc = await features.query;

    // SEND RESPONSE
    res.status(200).json({
      status: 'success',
      results: doc.length,
      data: {
        data: doc
      }
    });
  });
