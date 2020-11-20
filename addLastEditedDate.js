(async () => {
    require('dotenv').config()
    const mongoose = require('mongoose')
    const Project = require('./models/project')
    const Archive = require('./models/archive')
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

    console.log('start converting', new Date)

    for (const project of projects) {
        try {
            const { savedDateTime } = await Archive.findOne({ projectId: project._id }).sort({ savedDateTime: -1 });
            project.dateEdited = savedDateTime;
            console.log('modified', project._id, project.dateEdited);
            new Project(project).save();
        }
         catch (error) {
            console.log(error);
        }
        
    }

    console.log("done converting", new Date)
})()