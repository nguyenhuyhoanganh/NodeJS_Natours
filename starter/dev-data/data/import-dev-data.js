const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });

const fs = require('fs');
const Tour = require('./../../models/tourModel');

// chỉ cần config path 1 lần của thể dùng các evironment variable ở mọi nơi

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

// READ JSON FILE
const tours = JSON.parse(
  // sesion 1->10
  // fs.readFileSync(`${__dirname}/tours-simple.json`, 'utf-8')
  // session 11
  fs.readFileSync(`${__dirname}/tours.json`, 'utf-8')
);

// IMPORT DATA INTO DB
const importData = async () => {
  try {
    await Tour.create(tours);
    console.log('Data successfully loaded!');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

// DELETE ALL DATA DROM DB
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    console.log('Data successfully deleted!');
  } catch (err) {
    console.log(err);
  }
  process.exit();
  // ngừng thực thi ctrinh
};

// process.argv trả về 1 mảng
// phần tử đầu là node tên đường dẫn đến file
// phần tử thứ 2 là tên đường dẫn trực tiếp đến file
// phần tửu thứu 3 là hậu tố truyền vào đuôi như --import
if (process.argv[2] === '--import') {
  // node .\dev-data\data\import-dev-data.js --import
  importData();
} else if (process.argv[2] === '--delete') {
  // node .\dev-data\data\import-dev-data.js --delete
  deleteData();
}

// node
