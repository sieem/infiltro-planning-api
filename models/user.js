const mongoose = require('mongoose')

const schema = {
    name: String,
    email: String,
    password: String,
    company: String,
    role: String,
    resetToken: String
}

module.exports = mongoose.model('user', schema)