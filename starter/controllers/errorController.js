const AppError = require('./../utils/appError');

// 3 loại err của mongoose
const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = err => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  console.log(value);

  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};
const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);

  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

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
    console.error('ERROR 💥', err);

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
    let error = { ...err };

    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);

    sendErrorProd(error, res);
  }
};
