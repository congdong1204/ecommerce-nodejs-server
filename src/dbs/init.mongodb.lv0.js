const mongoose = require('mongoose')

const connectString = 'mongodb://localhost:27017/shopDEV'
mongoose
  .connect(connectString)
  .then(() => console.log('Connected Mongodb Successfully'))
  .catch((err) => console.log('Error connect!'))

// dev
if (1 === 1) {
    mongoose.set('debug', true)
    mongoose.set('debug', { color: true })
  }

module.exports = mongoose
