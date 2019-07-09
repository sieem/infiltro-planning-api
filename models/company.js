const mongoose = require('mongoose')

const schema = {
    name: String,
    email: String
}

module.exports = mongoose.model('company', schema)