const express = require('express');
const morgan = require('morgan');
const tourRouter = require('./routers/tourRoutes');
const userRouter = require('./routers/userRoutes');
const AppError = require('./utils/appError');

const app = express();

// 1) MIDDLE WARE : res -> thực thi qua lần lượt middleware, trả về response
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
// logger

app.use(express.json());
//cho phép chỉnh sửa 1 request được giử đến

app.use(express.static(`${__dirname}/public`));
//cho phép truy cập đến những file static qua path trên browser
//khi truy cập url mà không tìm thấy router đã config trước sẽ tự động coi ${__dirname}/public là root,
//cho phép truy cập đến các file static bên trong public từ 127.0.0.1:3000

// sử dụng middleware app.use()
// app.use() cho truy cập 3 tham số: req, res và nextfunction(là fn middleware tiếp theo)

/*
app.use((req, res, next) => {
  console.log('Hello from middleware!');
  // tiếp theo phải gọi đến next không chu kỳ request-response sẽ bị mắc kẹt, không pahnr hồi lại client
  next();
});
*/

// 2) HANDLES ROUTES
/*
// put: update khi đưa về đầy đủ object
// patch: update khi đưa về nhừng trường cần update trong object
app.get('/api/v1/tours', getAllTours);
app.get('/api/v1/tours/:id', getTour);
app.post('/api/v1/tours', createTour);
app.patch('/api/v1/tours/:id', updateTour);
app.delete('/api/v1/tours/:id');
*/
// 3) ROUTES
//mounting the routers
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

// app.get('/', (req, res) => {
//   res.status(200).json({ mess: 'Hello from server side' });
// }); // bắt method get

app.all('*', (req, res, next) => {
  res.status(404).json({
    status: 'fail',
    message: `Can't find ${req.originalUrl} on this server!`
  });
}); // bắt tất cả method, url còn lại vào 1 middleware trả về 404

// Global Error Handling Middleware
app.all('*', (req, res, next) => {
  // const err = new Error(`Can't find ${req.originalUrl} on this server!`);
  // err.status = 'fail';
  // err.statusCode = 404;
  // next(err);

  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
  // đưa error vào next() để khi qua các middlerware khác đến khi tời được middleware handle error, sẽ giữ đc err truyền vào
});

app.use((err, req, res, next) => {
  console.log(err.stack); // hiển thị stack trace

  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message
  });
});

// 4) SERVER
module.exports = app;
