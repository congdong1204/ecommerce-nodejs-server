require('dotenv').config()
const express = require('express')
const compression = require('compression')
const { default: helmet } = require('helmet')
const morgan = require('morgan')

const app = express()

// init middleware
app.use(morgan('dev')) // Used to log when a request comes
app.use(helmet()) // secure private information of the server
app.use(compression()) // downsize of payload, ex. 141kb => 1.4kb
app.use(express.json())
// app.use(express.urlencoded({ extended: true }))

// init database
require('./dbs/init.mongodb')

// init routes
app.use('', require('./routes'))

// handle error
app.use((req, res, next) => {
  const error = new Error('Not Found')
  error.status = 404
  next(error)
})

app.use((error, req, res, next) => {
  const statusCode = error.status || 500
  return res.status(statusCode).json({
    status: 'error',
    code: statusCode,
    message: error.message || 'Internal Server Error',
  })
})

module.exports = app
