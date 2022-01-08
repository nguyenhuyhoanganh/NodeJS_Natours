const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name!']
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  photo: String,
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user'
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false
  },
  // password để select là false
  // khi .save(), cần lấy ra tất cả fields của user bằng .findById() rồi mới update
  // nhưng .findById() không thể lấy ra trường password => cần .select('+password') để bổ sung field này vào user
  // nếu chỉ đổi mật khẩu thì không cần .select('+password')
  passwordConfirm: {
    type: String,
    required: [true, 'Please comfirm your password'],
    validate: {
      // This only works on CREATE and SAVE!!!
      validator: function(el) {
        return el === this.password;
      },
      message: 'Passwords are not the same!'
    }
  },
  passwordChangedAt: Date,
  // thời gian thay đổi password, dùng để so sánh với thời gian tạo token
  passwordResetToken: String,
  // token dùng để reset lại mật khẩu
  passwordResetExpires: Date,
  // thời gian token để reset mật khẩu có hiệu lực
  active: {
    type: Boolean,
    default: true,
    select: false
  }
  // dùng để đánh dấu user xóa tài khoản
});
/////////////////////////////////////////////////////////////////////////////////////////////////////
// QUERY MIDDLEWARE
// MÃ HÓA MẬT KHẨU KHI TRƯỚC SAVE, TỰ ĐỘNG THÊM FIELD passwordChangedAt KHI UPDATE MẬT KHẨU BẲNG SAVE

userSchema.pre('save', async function(next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // Delete passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();
  // nếu mật khẩu chưa được thay đổi hoặc đang tạo mới object thì chuyển sang middleware sau

  this.passwordChangedAt = Date.now() - 1000;
  // thời gian - 1s để tránh khả năng phát hành mã jwt đăng nhập trước khi tạo field trong csdl
  next();
});

// CHẶN TÌM KIẾM NGƯỜI DÙNG ĐÃ XÓA TÀI KHOẢN => VÔ HIỆU HÓA LUÔN GETALL(), GETONE(), LOGIN()
userSchema.pre(/^find/, function(next) {
  // this points to the current query
  this.find({ active: { $ne: false } });
  next();
});

/////////////////////////////////////////////////////////////////////////////////////////////////////
// METHODS
// 1) SO SÁNH MÂT KHẨU ĐỂ ĐĂNG NHẬP
// 2) SO SÁNH THỜI GIAN ĐỔI MẬT KHẨU VỚI THỜI GIAN TẠO TOKEN JWT ĐĂNG NHẬP
// 3) TẠO TOKEN CRYTO GIỬ CHO KHÁCH HÀNG ĐỂ ĐỔI MẬT KHẨU

// instace method, tồn tại trên toàn bộ documents của collection
// so sánh password người dùng nhập vào với password trên document
userSchema.methods.correctPassword = async function(
  cadidatePassword,
  userPassword
) {
  // this keyword trỏ đến document hiện tại
  // tuy nhiên do set select password = false => this.password không lấy ra được
  return await bcrypt.compare(cadidatePassword, userPassword);
};

// so sánh thời gian đổi mật khẩu với thời gian tạo token
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    // .getTime() convert ngày thành miliseconds
    // JWTTimestamp được trả về ở seconds => cần /1000 để chuyển từ miliseconds về seconds vầ so sánh
    // parseInt(_số_cần_làm_tròn, 10) : chuyển số về số nguyên ở cơ số 10

    return JWTTimestamp < changedTimestamp;
  }

  // False means NOT changed
  return false;
};

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  // token này sẽ giửu đi cho user

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  // mã hóa token giử đi thành 1 field trong csdl để so sánh với token nhận về
  console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  // đặt thời gian hết hạn token là 10 phút

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
