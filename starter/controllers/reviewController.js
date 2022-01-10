const Review = require('./../models/reviewModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
// const AppError = require('./../utils/appError');

exports.getAllReviews = catchAsync(async (req, res, next) => {
  // EXCUTE QUERY
  const features = new APIFeatures(Review.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const reviews = await features.query;

  // SEND RESPONSE
  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: reviews
  });
});

exports.createReview = catchAsync(async (req, res, next) => {
  const newReview = await Review.create(req.body);

  res.status(201).json({
    status: 'success',
    data: { review: newReview }
  });
});
