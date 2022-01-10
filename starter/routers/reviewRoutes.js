const express = require('express');
const reviewController = require('./../controllers/reviewController');
const authController = require('./../controllers/authController');

const router = express.Router({ mergeParams: true });
// đưa option { mergeParams: true } vào trong .Router() giúp reviewRoutes có quyền truy cập vào params trong url ở tourRouter :tourId
// theo mặc định mỗi bộ định tuyến chỉ có quyền truy cập đến param trong url cụ thể của nó

router.use(authController.protect);

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictTo('user'),
    reviewController.setTourUserIds,
    reviewController.createReview
  );

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewController.updateReview
  )
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewController.deleteReview
  );
// user vẫn có thể xóa, sửa review của người khác
module.exports = router;
