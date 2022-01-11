const express = require('express');
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');
const reviewRouter = require('./../routers/reviewRoutes');

// const reviewController = require('./../controllers/reviewController');

const router = express.Router();

//param middleware : chỉ thực thi khi url có id
// router.param('id', tourController.checkID);

// POST /tours/532jsdfy349/reviews
// GET /tours/532jsdfy349/reviews
router.use('/:tourId/reviews', reviewRouter);
// match url trong tourRouter tới reviewRouter để sử dụng chung chức năng với url trong reviewRouter

router
  .route('/top-5-tours')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);

router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan
  );

// cho biết cách tour trong vòng :distance (:unit) so với vị trí đang sống
router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);
// /tours-within?distance=233&center=-40,45&unit=mi
// /tours-within/233/center/-40,45/unit/mi : cách tọa độ -40,45 dưới 233 mi

// lấy ra tên tour, khoảng cách đến các tour
router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  );

router
  .route('/:id')
  .get(authController.protect, tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

module.exports = router;
