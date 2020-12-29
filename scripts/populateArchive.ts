import { config } from 'dotenv';
import { connect } from 'mongoose';
import Project from '../models/project';
import { saveProjectArchive } from '../services/archiveService';

(async () => {
    config();

    let projects

    const db = `mongodb://${process.env.MONGODB_USER}:${process.env.MONGODB_PASS}@localhost:27017/${process.env.MONGODB_DB}`

    connect(db, { useNewUrlParser: true }, err => {
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
        saveProjectArchive(project, null);
    }

    console.log("done populating", new Date)
})()