const User = require('../models/user')

exports.generateToken = () => {
    return new Promise((resolve, reject) => {
        let resetToken = require('crypto').randomBytes(8).toString('hex')
        User.findOne({ resetToken: resetToken }, (err, user) => {
            if (!user) {
                return resolve(resetToken)
            } else {
                resolve(this.generateToken())
            }
        })
    })
}