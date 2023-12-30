const bcrypt = require('bcrypt')
const crypto = require('node:crypto')
const shopModel = require('../models/shop.model')
const KeyTokenService = require('./keyToken.service')
const { createTokenPair } = require('../auth/authUtils')
const { getInfoData } = require('../utils')
const { BadRequestError, AuthFailureError } = require('../core/error.response')
const { error } = require('node:console')
const { findByEmail } = require('./shop.service')

const roleShop = {
  SHOP: 'SHOP',
  WRITTER: 'WRITTER',
  EDITOR: 'EDITOR',
  ADMIN: 'ADMIN',
}

class AccessService {

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
