const mongoose = require('mongoose')

const schema = {
    email: String,
    password: String
}

module.exports = mongoose.model('user', schema, 'users')