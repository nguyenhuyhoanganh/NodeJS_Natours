class AppError extends Error {
  constructor(message, statusCode) {
    super(message); // message truyền vòa khởi tạo của lớp cha : Error

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    // nếu statusCode bắt đầu bằng 4 thì trả về status là fail, bắt đầu bàng 5 thì trả về status là error
    this.isOperational = true;

    // ngăn việc khởi tạo AppError chèn vào stack trace khi gọi error.stack() : hiển thị lỗi bắt nguồn từ đâu và đi qua đâu
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
