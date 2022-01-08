const nodemailer = require('nodemailer');
//> npm i nodemailer

const sendEmail = async options => {
  // 1) Create a transporter
  // tạo đơn vị vận chuyển
  // có thể truyền vào 1 số option:
  /** 
  service: 'Gmail', // sử dụng gmail chỉ cho phép send tối đa 500 email mỗi ngày
  // dễ bị đánh dấu thư rác
  auth: {
   user: process.env.EMAIL_USERNAME,
   pass: process.env.EMAIL_PASSWORD
  }
  // activate in gmaill "less secure app" option
  */

  // ở đây sê sử dụng 1 dịch vụ depvelopment service, fake giử email: Mailtrap
  // fake giửu email đến client, tuy nhiên email sẽ mắc kẹp trên mailtrap để dev kiểm trâ
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  // 2) Define the email options
  const mailOptions = {
    from: 'Hoàng Anh <hoanganh@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message
    // html:
  };

  // 3) Actually send the email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
