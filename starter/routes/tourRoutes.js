const express = require('express');
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');
const reviewRouter = require('./../routes/reviewRoutes');

// const reviewController = require('./../controllers/reviewController');

const router = express.Router();

//param middleware : chỉ thực thi khi url có id
// router.param('id', tourController.checkID);

/*
router
  .route('/:tourId/reviews')
  .post(
    authController.protect,
    authController.restrictTo('user'),
    reviewController.createReview
  );
*/
// POST /tours/532jsdfy349/reviews
// GET /tours/532jsdfy349/reviews
router.use('/:tourId/reviews', reviewRouter);
// match url trong tourRouter tới reviewRouter để sử dụng chung chức năng với url trong reviewRouter

router
  .route('/top-5-tours')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);

router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan);

router
  .route('/')
  .get(authController.protect, tourController.getAllTours)
  .post(tourController.createTour);

router
  .route('/:id')
  .get(authController.protect, tourController.getTour)
  .patch(tourController.updateTour)
  .delete(tourController.deleteTour);

module.exports = router;
