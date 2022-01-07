const mongoose = require('mongoose');
const dotenv = require('dotenv');

// bắt các lỗi đồng bộ, cần thực thi đầu
process.on('uncaughtException', err => {
  console.log('UNCAUGHT EXCEPTION! Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: './config.env' });
// chỉ cần config path 1 lần của thể dùng các evironment variable ở mọi nơi
// khai báo trc để đọc các biến global

const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  })
  .then(() => console.log('DB connection successful!'));

const port = process.env.PORT || 3000;
//start 1 server
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

// bắt tất cả promise bị reject
process.on('unhandledRejection', err => {
  console.log('UNHANDLED REJECTION! Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  }); // cho phép server xử lý hết các request bất đồng bộ dang dở và sau khi hoàn thành sẽ ngắt server
});

// những lỗi đồng bộ hay bất đồng bộ xảy ra tại middleware sẽ không bị bắt tại đây và được đưa vào errorController
