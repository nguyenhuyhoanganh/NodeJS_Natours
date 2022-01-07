const { promisify } = require('util');
const jwt = require('jsonwebtoken');

const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
  // đưa _id vào token giử cho người dùng
};

exports.signup = catchAsync(async (req, res, next) => {
  // const newUser = await User.create(req.body);
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm
  });

  const token = signToken(newUser._id);

  res.status(201).json({
    status: 'success',
    token,
    data: { user: newUser }
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
    // phải return để tránh nhận được 2 response
  }
  // 2) Check if user exists && password is correct
  const user = await User.findOne({ email }).select('+password');
  // password set select: false =>  .select('+password') để láy thêm field password
  // đưa (await user.correctPassword(password, user.password)) vào if để tránh khi không tồn tại user sẽ tự động bỏ qua kiểm tra password
  if (!user || !(await user.correctPassword(password, user.password))) {
    // gọi instance của userModel để so sánh password
    // nếu không có user hay password không khớp, trả về lỗi
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3) If everything ok, send token to client
  const token = signToken(user._id);

  res.status(201).json({
    status: 'success',
    token
  });
});

exports.protect = catchAsync(async (req, res, next) => {
  // 1) GETTING TOKEN AND CHECK OF IT'S THERE: kiểm tra xem có token hay không
  let token;
  // token giử vào header để truy cập route
  // có dạng authorization : Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ij...
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
    // cắt chuỗi theo khoảng trắng lấy mã jwt gán vào token
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401)
    );
  }

  // 2) VERIFICATION TOKEN : kiểm tra xem có ai thay đổi token không
  // jwt.verify((token, process.env.JWT_SECRET, callbackfn(){})
  // jwt.verify nhận vào token, jwt-secret, sau khi xác minh mã token sẽ thực thi callbackfn()
  // => cần promisify để function trả về 1 promise, kết hợp async, await
  // node hỗ trợ promisify bằng module nội trang util
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // chỉ láy phương thức promisify của module util, phương thức trả về 1 promise: promisify(jwt.verify)(_tham_số_truyền _vào)
  // decoded trả về 1 object chứa:
  // id: được đưa vào token
  // iat: thời gian tạo token
  // exp: thời gian hết hạn token

  // 3) CHECK IF USER STILL EXISTS
  // kiểm tra xem đã xóa người dùng sau khi phát hành token hay không
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        'The user belonging to this token does no longer exist.',
        401
      )
    );
  }

  // 4) CHECK IF USER CHANGED PASSWORD AFTER THE TOKEN WAS ISSUED
  // kiểm tra xem người dùng thay đổi mật khẩu sau khi phát hành token hay không
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    // so sánh thời gian đổi mật khẩu với thời gian tạo token
    return next(
      new AppError('User recently changed password! Please log in again.', 401)
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE: cấp quyền truy cập cho user vào từng route
  req.user = currentUser;
  next();
});
