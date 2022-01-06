// handle async err:
// 1. async fn trả về 1 promise bị reject khi có err
// 2. bắt err bằng cách promise.catch()

module.exports = fn => {
  return (req, res, next) => {
    // fn(req, res, next).catch(err => next(err));
    fn(req, res, next).catch(next);
    // catch chuyển err vào next() để lan truyền err kết thúc ở globalErroeHandling middleware
  };
};

/*
 //err do validation trả về: được đưa vào next()
 "errors": {
  "name": {
      "name": "ValidatorError",
      "message": "A tour name must have more or equal then 10 characters",
      "properties": {
          "message": "A tour name must have more or equal then 10 characters",
          "type": "minlength",
          "minlength": 10,
          "path": "name",
          "value": "Test"
      },
      "kind": "minlength",
      "path": "name",
      "value": "Test"
  }
},
"_message": "Tour validation failed",
"name": "ValidationError",
"message": "Tour validation failed: name: A tour name must have more or equal then 10 characters"
*/
