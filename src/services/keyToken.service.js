const { Types } = require('mongoose')
const keyTokenModel = require('../models/keyToken.model')

class KeyTokenService {
  static createKeyToken = async ({
    userId,
    publicKey,
    privateKey,
    refreshToken,
  }) => {
    try {
      const filter = { user: userId }
      const update = {
        publicKey,
        privateKey,
        refreshTokensUsed: [],
        refreshToken,
      }
      const options = { upsert: true, new: true }
      const tokens = await keyTokenModel.findOneAndUpdate(
        filter,
        update,
        options
      )

      return tokens ? tokens.publicKey : null
    } catch (err) {
      return err
    }
  }

  static findByUserId = async (userId) => {
    return await keyTokenModel
      .findOne({ user: new Types.ObjectId(userId) })
      .lean()
  }

  static removeKeyById = async (id) => {
    return await keyTokenModel.deleteOne(id)
  }

  static findByRefreshTokenUsed = async (refreshToken) => {
    return await keyTokenModel
      .findOne({ refreshTokensUsed: refreshToken })
      .lean()
  }

  static findByRefreshToken = async (refreshToken) => {
    console.log('refreshToken', refreshToken);
    return await keyTokenModel.findOne({ refreshToken })
  }

  static deleteKeyById = async (userId) => {
    return await keyTokenModel.deleteOne({
      user: new Types.ObjectId(userId),
    })
  }
}

module.exports = KeyTokenService
