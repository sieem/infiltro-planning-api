import { config } from 'dotenv';
import { connect, Types } from 'mongoose';
import Project from '../models/project';

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

    console.log('start converting', new Date)

    for (const project of projects) {
        if (typeof project.comments[0] === 'string' && project.comments[0] !== "") {
            const commentObject = {
                _id: Types.ObjectId(),
                user: "Onbekende gebruiker",
                createdDateTime: new Date,
                modifiedDateTime: new Date,
                content: project.comments[0],
            }

            project.comments = [commentObject]

            new Project(project).save()
            console.log('modified', project._id)
            continue
        }

        // hotfix for empty comments
        if (typeof project.comments[0] === 'object' && project.comments[0].content == "") {
            project.comments = []

            new Project(project).save()
            console.log('delete comments', project._id)
            continue
        }
    }

    console.log("done converting", new Date)
})()