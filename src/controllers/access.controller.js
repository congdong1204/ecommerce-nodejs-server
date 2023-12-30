const { CREATED, SuccessResponse } = require('../core/success.response')
const AccessService = require('../services/access.service')

class AccessController {
  handleRefreshToken = async (req, res, next) => {
    new SuccessResponse({
      message: 'Get token successfully',
      metadata: await AccessService.handleRefreshToken(req.body.refreshToken),
    }).send(res)
  }

  logout = async (req, res, next) => {
    new SuccessResponse({
      message: 'Logout successfully',
      metadata: await AccessService.logout(req.keyStore),
    }).send(res)
  }

  login = async (req, res, next) => {
    new SuccessResponse({ metadata: await AccessService.login(req.body) }).send(
      res
    )
  }

  signUp = async (req, res, next) => {
    new CREATED({
      message: 'Register Successfully!',
      metadata: await AccessService.signup(req.body),
    }).send(res)
  }
}

module.exports = new AccessController()
