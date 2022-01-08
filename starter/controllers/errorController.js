const AppError = require('./../utils/appError');

// 3 loại err của mongoose
const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  // path: là tên field , value là giá trị truyền vào route
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = err => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  // lấy ra chuỗi trùng trong cặp ngoặc kép
  //console.log(value);
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);
  // Object.value() để lặp qua các properties của object
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid token. Please log in again!', 401);

const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please log in again.', 401);

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  });
}; // giử tất cả error trong qua trình development

const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  // lỗi do vận hành: giử lỗi thân thiện cho client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });

    // Programming or other unknown error: don't leak error details
    // lỗi do bug của dev => giử lỗi chung chung cho clinet, log lỗi ra cho dev biết
  } else {
    // 1) Log error
    console.error('ERROR', err);

    // 2) Send generic message
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!'
    });
  }
}; // giử hạn chế lỗi thân thiện cho khách hàng trong quá trình product

module.exports = (err, req, res, next) => {
  // console.log(err.stack); // hiển thị stack trace
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    // nếu đang trong quá trình development
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    // nếu đang trong quá trình production
    // let error = { ...err };
    let error = Object.assign(err); // khắc phục tạm thời
    // mục tiêu của jonas là tạo 1 object err mới rồi thao tác, không ảnh hường đến object cũ
    // tuy nhiên vì lý do nào đó cách { ...err } không lấy ra được field name ở object err cũ như mong muốn
    // console.log(error.name, { ...err }.name);

    if (error.name === 'CastError') error = handleCastErrorDB(error);
    // khi có 1 value nào đó truyền vào router không thể cast qua được router tương ứng
    // findById(), findByIdAndUpdate(), findByIdAndDelete()
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    // khi khởi tạo 1 documnet có field bị trùng lặp với field được set unique: true
    // create(), save(),...
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);
    // khi xảy ra lỗi validation trong lúc create, update

    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    // khi không khớp json web token
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
    // khi token hết hạn

    sendErrorProd(error, res);
  }
};
