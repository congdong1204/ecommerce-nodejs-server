const JWT = require('jsonwebtoken')
const asyncHandler = require('../helpers/asyncHandler')
const { AuthFailureError, NotFoundError } = require('../core/error.response')
const { findByUserId } = require('../services/keyToken.service')

const HEADER = {
  API_KEY: 'x-api-key',
  CLIENT_ID: 'x-client-id',
  AUTHORIZATION: 'authorization',
}

const createTokenPair = async (payload, publicKey, privateKey) => {
  try {
    // accessToken
    const accessToken = await JWT.sign(payload, publicKey, {
      expiresIn: '2 days',
    })

    // refreshToken
    const refreshToken = await JWT.sign(payload, privateKey, {
      expiresIn: '7 days',
    })

    JWT.verify(accessToken, publicKey, (err, decode) => {
      if (err) {
        console.error('error verify: ', err)
      } else {
        console.log('decode verify: ', decode)
      }
    })

    return { accessToken, refreshToken }
  } catch (err) {}
}

const authentication = asyncHandler(async (req, res, next) => {
  /**
   * 1. check userId missing?
   * 2. get accessToken
   * 3. verify token
   * 4. check user in database
   * 5. check keyStore with this user
   * 6. Ok? => return next()
   */
  const userId = req.headers[HEADER.CLIENT_ID]
  if (!userId) throw new AuthFailureError('Invalid request')

  const keyStore = await findByUserId(userId)
  if (!keyStore) throw new NotFoundError('Not found keyStore')

  const accessToken = req.headers[HEADER.AUTHORIZATION]
  if (!accessToken) throw new AuthFailureError('Invalid request')

  try {
    const decodeUser = JWT.verify(accessToken, keyStore.publicKey)
    if (userId !== decodeUser.userId)
      throw new AuthFailureError('Invalid userId')

    req.keyStore = keyStore
    return next()
  } catch (err) {
    throw err
  }
})

const verifyJWT = async (token, keySecret) => {
  return await JWT.verify(token, keySecret)
}

module.exports = { createTokenPair, authentication, verifyJWT }
