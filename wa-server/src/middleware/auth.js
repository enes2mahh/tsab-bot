const { WA_SECRET } = require('../config')

function authMiddleware(req, res, next) {
  const auth = req.headers['authorization']
  if (!auth || auth !== `Bearer ${WA_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
}

module.exports = { authMiddleware }
