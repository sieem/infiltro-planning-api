const mongoose = require('mongoose')

const schema = {
    company: String,
    dateCreated: Date,
    projectType: String,
    houseAmount: Number,
    projectName: String,
    client: String,
    street: String,
    city: String,
    postalCode: String,
    extraInfoAddress: String,
    name: String,
    tel: String,
    email: String,
    extraInfoContact: String,
    EpbReporter: String,
    ATest: String,
    v50Value: String,
    protectedVolume: String,
    executor: String,
    datePlanned: Date,
    hourPlanned: String,
    status: String,
    comments: String,
    invoiced: Boolean
}

module.exports = mongoose.model('project', schema)

