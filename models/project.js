const mongoose = require('mongoose')

const schema = {
    company: String,
    dateCreated: Date,
    projectType: String,
    houseAmount: String,
    projectName: String,
    client: String,
    street: String,
    city: String,
    postalCode: String,
    extraInfoAddress: String,
    lng: Number,
    lat: Number,
    name: String,
    tel: String,
    email: String,
    extraInfoContact: String,
    EpbReporter: String,
    ATest: String,
    v50Value: String,
    protectedVolume: String,
    EpbNumber: String,
    executor: String,
    datePlanned: Date,
    hourPlanned: String,
    status: String,
    comments: String,
    invoiced: Boolean,
    mails: Array,
    calendarId: String,
    eventId: String
}

module.exports = mongoose.model('project', schema)

