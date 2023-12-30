const mongoose = require('mongoose')
const { countConnect } = require('../helpers/check.connect')
const {db: {host, port, name}} = require('../configs/config.mongodb')

const connectString = `mongodb://${host}:${port}/${name}`

class Database {
  constructor() {
    this.connect()
  }

  // connect
  connect() {
    if (1 === 1) {
      mongoose.set('debug', true)
      mongoose.set('debug', { color: true })
    }

    mongoose
      .connect(connectString, { maxPoolSize: 50 })
      .then(() => {
        console.log('Connected Mongodb Successfully', connectString)
        countConnect()
      })
      .catch((err) => console.log('Error connect!', err))
  }

  static getInstance() {
    if (!Database.instance) {
      Database.instance = new Database()
    }
    return Database.instance
  }
}

const instanceMonggodb = Database.getInstance()
module.exports = instanceMonggodb
