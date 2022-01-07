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
