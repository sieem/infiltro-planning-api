const mongoose = require('mongoose')

const schema = {
    name: String,
    email: String,
    pricePageVisible: Boolean,

}

module.exports = mongoose.model('company', schema)