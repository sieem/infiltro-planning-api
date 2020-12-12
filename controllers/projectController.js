const mongoose = require('mongoose')
const Project = require('../models/project')
const projectService = require('../services/projectService')

exports.generateProjectId = (req,res) => {
    return res.status(200).send(mongoose.Types.ObjectId())
}

exports.saveProject = async (req, res) => {
    try {
        const project = await projectService.saveProject(req.body, req.user);
        res.status(200).json(project);
    }
     catch (error) {
        return res.status(error.status).send(error.message);
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
        if (project.status === 'deleted' && req.user.role !== 'admin') {
            return res.status(401).send('Unauthorized request');
        }
        if (project.company === req.user.company || req.user.role === 'admin') {
            return res.status(200).json(project)
        }

        return res.status(401).send('Unauthorized request')
    })
}

exports.removeProject = async (req, res) => {
    const foundProject = await Project.findById(req.params.projectId).exec();
    foundProject.status = 'deleted';
    req.body = foundProject;

    try {
        await projectService.saveProject(req.body, req.user);
        return res.json({ status: 'success' });
    }
    catch (error) {
        return res.status(error.status).send(error.message);
    }
}

exports.duplicateProject = async (req, res) => {
    try {
        const foundProject = await Project.findById(req.body.projectId).exec();
        foundProject._id = mongoose.Types.ObjectId();
        foundProject.projectName = foundProject.projectName + ' (kopie)';
        foundProject.eventId = '';
        foundProject.calendarId = '';
        foundProject.calendarLink = '';
        foundProject.status = 'toPlan';
        foundProject.datePlanned = '';
        foundProject.hourPlanned = '';

        try {
            await projectService.saveProject(foundProject, req.user);
            return res.json({ projectId: foundProject._id })
        }
        catch (error) {
            return res.status(error.status).send(error.message);
        }
    } catch (error) {
        console.error(error)
        return res.status(500).send(error)
    }
}

exports.batchProjects = async (req, res) => {
    if (req.user.role === 'admin') {
        const statusToChange = req.body.status
        const projectsToChange = req.body.projects

        for (const projectToChange of projectsToChange) {
            try {
                const foundProject = await Project.findById(projectToChange._id).exec();
                foundProject.status = statusToChange;
                await projectService.saveProject(foundProject, req.user);
                
            }
            catch (error) {
                return res.status(error.status).send(error.message);
            }
        }
        return res.json({ status: 'success' });
    } else {
        return res.status(401).send('Unauthorized request')
    }
}