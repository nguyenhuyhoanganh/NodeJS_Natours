const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');

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
exports.getUser = factory.getOne(User);
exports.getAllUsers = factory.getAll(User);
// Do NOT update passwords with updateUser!
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined! Please use /signup instead.'
  });
};
/////////////////////////////////////////////////////////////////////////////////////////////////////
//USER
// middleware cho phép người dùng truy vấn thông tin của chính mình
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

// chức năng cho người dùng cập nhật name, email
exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword instead.',
        400
      )
    );
  }
  // ** CÒN THIẾU CHẶN TỰ UPDATE ROLE, ...: giải quyết bằng filteredBody

  // 2) Filtered out unwanted fields names that are not allowed to be updated
  const filteredBody = filterObj(req.body, 'name', 'email');
  // có thể thêm fields muốn thay đổi: image, ...
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

// chức năng cho người dùng tự xóa tài khoản
// không thực sự xóa người dùng khỏi csdl thay vào đó đặt active: false
exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null
  });
});
