const express = require('express');
const reviewController = require('./../controllers/reviewController');
const authController = require('./../controllers/authController');

const router = express.Router({ mergeParams: true });
// đưa option { mergeParams: true } vào trong .Router() giúp reviewRoutes có quyền truy cập vào params trong url ở tourRouter :tourId
// theo mặc định mỗi bộ định tuyến chỉ có quyền truy cập đến param trong url cụ thể của nó

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.protect,
    authController.restrictTo('user'),
    reviewController.createReview
  );

module.exports = router;
