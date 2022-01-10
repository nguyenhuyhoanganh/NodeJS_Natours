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
