const mongoose = require('mongoose')

const schema = {
    email: String,
    password: String,
    company: String,
}

module.exports = mongoose.model('user', schema, 'users')