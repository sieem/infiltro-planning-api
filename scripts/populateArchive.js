(async () => {
    require('dotenv').config()
    const mongoose = require('mongoose')
    const Project = require('./models/project')
    const archiveService = require('./services/archiveService')
    let projects

    const db = `mongodb://${process.env.MONGODB_USER}:${process.env.MONGODB_PASS}@localhost:27017/${process.env.MONGODB_DB}`

    mongoose.connect(db, { useNewUrlParser: true }, err => {
        if (err) {
            console.log(err)
            return
        }
        else {
            console.log('connected to mongodb')
        }
    })

    try {
        projects = await Project.find({})
    } catch (error) {
        console.error(error)
        return
    }

    console.log('start populating', new Date)

    for (const project of projects) {
        archiveService.saveProjectArchive(project, null);
    }

    console.log("done populating", new Date)
})()