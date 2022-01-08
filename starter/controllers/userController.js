const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

/////////////////////////////////////////////////////////////////////////////////////////////////////
// Lọc req.body lấy ra các fields cho phép giử vào update
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  // lặp qua từng key name của object
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

/////////////////////////////////////////////////////////////////////////////////////////////////////
//ADMIN
exports.getAllUsers = catchAsync(async (req, res, next) => {
  // EXCUTE QUERY
  const users = await User.find();

  // SEND RESPONSE
  res.status(200).json({
    status: 'success',
    results: users.length,
    data: { users }
  });
});

exports.getUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'this route is not yet defined!'
  });
};

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'this route is not yet defined!'
  });
};

exports.updateUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'this route is not yet defined!'
  });
};

exports.deleteUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'this route is not yet defined!'
  });
};
/////////////////////////////////////////////////////////////////////////////////////////////////////
//USER
exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword.',
        400
      )
    );
  }
  // ** CÒN THIẾU CHẶN TỰ UPDATE ROLE, ...: giải quyết bằng filteredBody

  // 2) Filtered out unwanted fields names that are not allowed to be updated
  const filteredBody = filterObj(req.body, 'name', 'email');
  // lọc không cho cập nhật role, ...

  // 3) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  });
  // xem chi tiết hàm .findByIdAndUpdate() ở tourController
  // đưa vào filteredBody để lọc những field chỉ cho phép update thay vì đưa cả req.body

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
});
