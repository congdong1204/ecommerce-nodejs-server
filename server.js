const app = require('./src/app')

const {app: {port}} = require('./src/configs/config.mongodb')

const server = app.listen(port, () => {
  console.log(`WSV eCommerce starts with port ${port}`)
})

// process.on('SIGINT', () => {
//   server.close(() => console.log('Exit Server Express'))
// })
