const mongoose = require('mongoose')

const userSchema = {
    email: String,
    password: String
}

module.exports = mongoose.model('user', userSchema, 'users')