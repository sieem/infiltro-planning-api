const mongoose = require('mongoose')

const schema = {
    email: String,
    password: String,
    company: String,
    role: String,
    resetToken: String
}

module.exports = mongoose.model('user', schema)