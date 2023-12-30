const bcrypt = require('bcrypt')
const crypto = require('node:crypto')
const shopModel = require('../models/shop.model')
const KeyTokenService = require('./keyToken.service')
const { createTokenPair, verifyJWT } = require('../auth/authUtils')
const { getInfoData } = require('../utils')
const {
  BadRequestError,
  AuthFailureError,
  ForbiddenError,
} = require('../core/error.response')
const { error } = require('node:console')
const { findByEmail } = require('./shop.service')

const roleShop = {
  SHOP: 'SHOP',
  WRITTER: 'WRITTER',
  EDITOR: 'EDITOR',
  ADMIN: 'ADMIN',
}

class AccessService {
  static handleRefreshToken = async (refreshToken) => {
    // check to know this refreshToken is used or not
    const foundToken = await KeyTokenService.findByRefreshTokenUsed(
      refreshToken
    )
    if (foundToken) {
      const { userId, email } = await verifyJWT(
        refreshToken,
        foundToken.privateKey
      )
      // delete all token in keyStore
      await KeyTokenService.deleteKeyById(userId)
      throw new ForbiddenError('Something went wrong. Please login!')
    }

    const holdToken = await KeyTokenService.findByRefreshToken(refreshToken)
    if (!holdToken) throw new AuthFailureError('Shop not registered 1')

    const { userId, email } = await verifyJWT(
      refreshToken,
      holdToken.privateKey
    )

    const foundShop = await findByEmail({ email })
    if (!foundShop) throw new AuthFailureError('Shop not registered 2')

    // create new pair token
    const tokens = await createTokenPair(
      { userId: foundShop._id, email },
      holdToken.publicKey,
      holdToken.privateKey
    )

    // update token
    await holdToken.updateOne({
      $set: {
        refreshToken: tokens.refreshToken,
      },
      $addToSet: {
        refreshTokensUsed: refreshToken,
      },
    })

    return {
      user: { userId, email },
      tokens,
    }
  }

  static logout = async (keyStore) => {
    const delKey = await KeyTokenService.removeKeyById(keyStore._id)
    return delKey
  }

  /**
   * 1. check email in database
   * 2. match password
   * 3. create AT and RT, save
   * 4. generate tokens
   * 5. get data return login
   */
  static login = async ({ email, password, refreshToken = null }) => {
    const foundShop = await findByEmail({ email })
    if (!foundShop) throw new BadRequestError('Shop not registed')

    const matchPassword = bcrypt.compare(password, foundShop.password)
    if (!matchPassword) throw new AuthFailureError('Authentication error')

    const privateKey = crypto.randomBytes(64).toString('hex')
    const publicKey = crypto.randomBytes(64).toString('hex')
    const tokens = await createTokenPair(
      { userId: foundShop._id, email },
      publicKey,
      privateKey
    )

    await KeyTokenService.createKeyToken({
      privateKey,
      publicKey,
      refreshToken: tokens.refreshToken,
      userId: foundShop._id,
    })

    return {
      shop: getInfoData({
        fields: ['_id', 'name', 'email'],
        object: foundShop,
      }),
      tokens,
    }
  }

  static signup = async ({ name, email, password }) => {
    try {
      // step 1: check email exists
      const holderShop = await shopModel.findOne({ email }).lean()
      if (holderShop) {
        throw new BadRequestError('Error: Shop already registed!')
      }
      const passwordHash = await bcrypt.hash(password, 10)
      const newShop = await shopModel.create({
        name,
        email,
        password: passwordHash,
        roles: [roleShop.SHOP],
      })
      if (newShop) {
        // create privateKey and publicKey
        const privateKey = crypto.randomBytes(64).toString('hex')
        const publicKey = crypto.randomBytes(64).toString('hex')

        const keyStore = await KeyTokenService.createKeyToken({
          userId: newShop._id,
          publicKey,
          privateKey,
        })

        if (!keyStore) {
          return {
            code: 'xxx',
            message: 'keyStore error',
          }
        }

        // create token pair
        const tokens = await createTokenPair(
          { userId: newShop._id, email },
          publicKey,
          privateKey
        )

        return {
          shop: getInfoData({
            fields: ['_id', 'name', 'email'],
            object: newShop,
          }),
          tokens,
        }
      }
      return {
        code: 200,
        metadata: null,
      }
    } catch (err) {
      return {
        code: err.status,
        message: err.message,
        status: 'error1111',
      }
    }
  }
}

module.exports = AccessService
