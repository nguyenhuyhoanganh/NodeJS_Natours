const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const sendEmail = require('./../utils/email');

/////////////////////////////////////////////////////////////////////////////////////////////////////
// TẠO TOKEN KHI ĐĂNG NHẬP
const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
  // đưa _id vào token giử cho người dùng
};

// GIỬ TOKEN KHI LOGIN, SIGNUP, RESETPASSWORD, UPDATEPASSWORD
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  // tạo token dựa trên id
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};
/////////////////////////////////////////////////////////////////////////////////////////////////////
// ĐĂNG KÝ, ĐĂNG NHẬP, CUNG CẤP TOKEN JWT ĐỂ DUY TRÌ ĐÂNG NHẬP
exports.signup = catchAsync(async (req, res, next) => {
  // const newUser = await User.create(req.body);
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm
  });
  // loại bỏ khi thêm các thông tin về role, ...

  createSendToken(newUser, 201, res);
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
  createSendToken(user, 200, res);
});
/////////////////////////////////////////////////////////////////////////////////////////////////////
//YÊU CẦU ĐĂNG NHẬP VÀ PHÂN QUYỀN
exports.protect = catchAsync(async (req, res, next) => {
  // 1) GETTING TOKEN AND CHECK OF IT'S THERE: kiểm tra xem có token hay không
  let token;
  // token giử vào header để truy cập route
  // có dạng Authorization : Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ij...
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

// Cách truyền đối số vào 1 middleware fn
// Tạo ra 1 wrapper fn trả về 1 middleware fn
// nhận vào mảng roles cho phép truy cập vào route
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles ['admin', 'lead-guide']. role='user'
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }

    next();
  };
};
/////////////////////////////////////////////////////////////////////////////////////////////////////
// QUÊN MẬT KHẨU, GIỬ EMAIL KÈM TOKEN ĐÊ CHO PHÉP ĐỔI MẬT KHẨU

//B1: tìm user khớp vơi email trong csdl
//B2A: tạo ra 1 token random giử cho người dùng
//B2B: sử dụng token random đó thực hiện mã hóa và gán vào field passwordResetToken trong csdl
//B2C: đặt thời gian hết hạn toke là 10 phút
//B3: giử token đó cho user thiết lập ở ./../utils/email.js
// (khi user nhận được token random, giử lại token đó về hệ thống, hệ thống tiến hành mã hóa lần nữa và so sánh với field passwordResetToken trong csdl
//  nếu token khớp nhau sẽ cho phép user đổi mật khẩu)
exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  // tìm user theo email cung cấp
  if (!user) {
    // nếu không có user trả về error
    return next(new AppError('There is no user with email address.', 404));
  }

  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  // save bỏ qua validate, không cần đưa đầy đủ user để save
  // trong user.createPasswordResetToken() đã gán thuộc tính passwordResetToken và passwordResetExpires cho user
  // save() ở controller để lưu passwordResetToken và passwordResetExpires vào csdl
  await user.save({ validateBeforeSave: false });

  // 3) Send it to user's email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 min)',
      message
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!'
    });
  } catch (err) {
    // bắt trường hợp senEmail thất bại, hủy trường passwordResetToken và passwordResetExpires của user
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email. Try again later!'),
      500
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  // lấy token trong url ra mã hóa và so sánh với database
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  // tìm kiếm user chung mã token đã mã hóa nhưng thời gian hạn dài hơn hiện tại
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  // 2) If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  // lưu user với mật khẩu mới, không được dùng upadate về sẽ bỏ qua validate
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3) Update changedPasswordAt property for the user
  // tự động bằng middleware ở userModel

  // 4) Log the user in, send JWT
  // giử lại token JWT cho user có thể đăng nhập
  createSendToken(user, 200, res);
});
/////////////////////////////////////////////////////////////////////////////////////////////////////
//THAY ĐỔI MẬT KHẨU

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  // lấy ra user cùng password
  const user = await User.findById(req.user.id).select('+password');

  // 2) Check if POSTed current password is correct
  // so sánh password hiện tại với passwordCurrent lấy ở request
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong.', 401));
  }

  // 3) If so, update password
  // update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // không được sửu dụng bất cứ phương pháp update nào vì sẽ không nhận validate khai báo trong passwordConfirm
  // đồng thời sẽ không thực thi qua middlware save đã xây dựng trước đó
  // User.findByIdAndUpdate will NOT work as intended!

  // 4) Log user in, send JWT
  createSendToken(user, 200, res);
});
/////////////////////////////////////////////////////////////////////////////////////////////////////
