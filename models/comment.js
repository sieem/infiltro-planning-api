const mongoose = require('mongoose')

const schema = {
    user: mongoose.ObjectId,
    createdDateTime: Date,
    modifiedDateTime: Date,
    content: String,
}

module.exports = mongoose.model('comment', schema)