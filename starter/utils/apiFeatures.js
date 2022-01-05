class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  // 1)FILTER QUERY
  // request.query
  // ?duration=5&difficulty=easy : { duration: '5', difficulty: 'easy' }
  // ?duration[gte]=5&difficulty=easy : { duration: { gte: '5' }, difficulty: 'easy' }

  // 2) SORTING
  // &sort=price : sắp xếp theo giá tăng dần
  // &sort=-price : sắp xếp theo giá giảm dần
  // &sort=price,ratingsAverage : sắp xếp theo giá, rồi theo rating

  // 3) FIELD LIMITING
  // lọc chọn các fields để hiển thị : &fields=name,price,duration,ratingsAverage

  // 4) PAGINATION
  // &page=2&limit=10 : 11 -> 21, skip = 10

  filter() {
    // 1) Filtering
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(el => delete queryObj[el]);
    // 2) Advanced filtering
    let queryStr = JSON.stringify(queryObj); // chuyển object về thành chuỗi string
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
    // gte => $gte, lte => $lte, lt => $lt
    this.query = this.query.find(JSON.parse(queryStr));

    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      // "price,ratingsAverage" => "price ratingsAverage"
      // sort('price ratingsAverage') : sort theo nhiều tiêu chí
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-creatAt');
    }

    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }

    return this;
  }

  paginate() {
    const page = +this.queryString.page || 1;
    const limit = +this.queryString.limit || 100;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

module.exports = APIFeatures;

// 1) mongodb query
// const tours = await Tour.find({
//   duration: 5,
//   difficulty: 'easy'
// });
// 2) mongoose method
// const tours = await Tour.find()
//   .where('duration')
//   .lt(5)
//   .where('difficulty')
//   .equals('easy');
