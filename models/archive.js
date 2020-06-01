const mongoose = require('mongoose');

const schema = {
    user: mongoose.Schema.Types.ObjectId,
    projectId: mongoose.Schema.Types.ObjectId,
    savedDateTime: Date,
    projectData: mongoose.Schema.Types.Mixed,
}

module.exports = mongoose.model('archive', schema)