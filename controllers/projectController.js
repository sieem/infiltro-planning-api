const mongoose = require('mongoose')
const Project = require('../models/project')
const calendarService = require('../services/calendarService')
const projectService = require('../services/projectService')
const archiveService = require('../services/archiveService')
const calendar = new calendarService()

exports.generateProjectId = (req,res) => {
    return res.status(200).send(mongoose.Types.ObjectId())
}

exports.saveProject = async (req, res) => {
    if ((req.body.company === req.user.company && req.user.role === 'company') || req.user.role === 'admin') {
        let project = new Project(req.body)

        // combine date and hour to have a better sorting
        project.datePlanned = calendar.combineDateHour(project.datePlanned, project.hourPlanned)

        try {
            const oldProject = await Project.findById(project._id).exec();

            project = await projectService.getCoordinates(project);
            project = projectService.addCommentsAndEmails(project, oldProject);
            project = await projectService.saveCalendarItem(project, oldProject);

            archiveService.saveProjectArchive(project, req.userId);

            // save the project
            const savedProject = await Project.findByIdAndUpdate(project._id, project, { upsert: true }).exec();

            projectService.sendMails(project, savedProject, req);
            return res.status(200).json(project);
        } catch (error) {
            console.log(error);
            return res.status(500).send('Something went wrong');
        }   
    } else {
        return res.status(401).send('Unauthorized request')
    }
}

exports.getProjects = (req, res) => {
    let findParameters = (req.user.role === 'admin') ? {} : { company: req.user.company }
    if(req.user.role === 'admin') {
        findParameters = {}
    }
    Project.find(findParameters, (err, projects) => {
        if (err) {
            console.error(err)
            return res.status(400).json(err.message)
        }
        else {
            return res.status(200).json(projects)
        }
    })
    
}

exports.getProject = (req, res) => {
    Project.findById(req.params.projectId, (err, project) => {
        if (err) {
            console.error(err)
            return res.status(400).json(err.message)
        }
        if (!project) {
            return res.status(404).send('Project not found')
        }
        if (project.company === req.user.company || req.user.role === 'admin') {
            return res.status(200).json(project)
        }

        return res.status(401).send('Unauthorized request')
    })
}

exports.removeProject = async (req, res) => {
    if (req.user.role === 'admin') {
        const foundProject = await Project.findById(req.params.projectId).exec()
        if (foundProject.calendarId && foundProject.eventId) {
            calendar.deleteEvent(foundProject.calendarId, foundProject.eventId)
        }
        Project.updateOne({ _id: req.params.projectId }, {
            status: "deleted"
        }, function (err, affected, resp) {            
            return res.json(resp)
        })
    } else {
        return res.status(401).send('Unauthorized request')
    }
}

exports.duplicateProject = async (req, res) => {
    try {
        const foundProject = await Project.findById(req.body.projectId).exec()
        foundProject._id = mongoose.Types.ObjectId()
        foundProject.projectName = foundProject.projectName + ' (kopie)'
        foundProject.eventId = ''
        foundProject.calendarId = ''
        foundProject.calendarLink = ''
        foundProject.status = 'toPlan'
        foundProject.datePlanned = ''
        foundProject.hourPlanned = ''

        await Project.findByIdAndUpdate(foundProject._id, foundProject, { upsert: true }).exec()
        archiveService.saveProjectArchive(project, req.userId);
        return res.json({ projectId: foundProject._id})

    } catch (error) {
        console.error(error)
        return res.status(400).send(error)
    }
}

exports.batchProjects = async (req, res) => {
    if (req.user.role === 'admin') {
        const statusToChange = req.body.status
        const projectsToChange = req.body.projects

        for (const projectToChange of projectsToChange) {
            try {
                await Project.updateOne({ _id: projectToChange._id }, { status: statusToChange }).exec();
                const projectToArchive = await Project.findById(projectToChange._id).exec();
                archiveService.saveProjectArchive(projectToArchive, req.userId);
            } catch (error) {
                console.error(error)
                return res.status(400).json(error.message)
            }
        }
        return res.json({})
    } else {
        return res.status(401).send('Unauthorized request')
    }
}