const mongoose = require('mongoose')
const os = require('os')
const process = require('process')

const _SECOND = 5000

// count connect
const countConnect = () => {
  const numberOfConnection = mongoose.connections.length
  console.log(`Number of connections: ${numberOfConnection}`)
}

// check over load
const checkOverLoad = () => {
  setInterval(() => {
    const numberOfConnection = mongoose.connections.length
    const numCores = os.cpus().length
    const memoryUsage = process.memoryUsage().rss
    // example maximun number of connection based on number of cores
    const maxConnections = numCores * 5

    console.log(`Active connections: ${numberOfConnection}`)
    console.log(`Memory usage: ${memoryUsage / 1024 / 1024} MB`)

    if (numberOfConnection > maxConnections) {
      console.log('Connection overload!')
      // notify.send(...)
    }
  }, _SECOND) //Monitor every 5 seconds
}

module.exports = { countConnect, checkOverLoad }
