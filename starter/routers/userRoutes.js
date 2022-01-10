const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

const router = express.Router();

//authController.protect : bắt buộc người dùng phải đăng nhập để có quyền truy cập route
//authController.restrictTo('admin') : giới hạn role: admin mới có quyền truy cập

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// Protect all routes after this middleware
router.use(authController.protect);

router.patch('/updateMyPassword', authController.updatePassword);
router.get('/me', userController.getMe, userController.getUser);
router.patch('/updateMe', userController.updateMe);
router.delete('/deleteMe', userController.deleteMe);
// set active: false

router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(userController.getAllUsers)
  // admin sẽ được lấy ra thông tin từng người dùng thay vì /me
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  // chưa hạn chế admin có thể sửa mật khẩu user
  .delete(userController.deleteUser);
// xóa hẳn user thay vì set active: false

module.exports = router;
