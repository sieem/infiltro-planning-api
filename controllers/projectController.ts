import { Types } from 'mongoose';
import Project from '../models/project';
import * as projectService from '../services/projectService';

export const generateProjectId = (req,res) => {
    return res.status(200).send(Types.ObjectId())
}

export const saveProject = async (req, res) => {
    try {
        const project = await projectService.saveProject(req.body, req.user);
        res.status(200).json(project);
    }
     catch (error) {
        return res.status(error.status).send(error.message);
    }
}

export const getProjects = (req, res) => {
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

export const getProject = (req, res) => {
    Project.findById(req.params.projectId, (err, project: any) => {
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

export const removeProject = async (req, res) => {
    const foundProject: any = await Project.findById(req.params.projectId).exec();
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

export const duplicateProject = async (req, res) => {
    try {
        const foundProject: any = await Project.findById(req.body.projectId).exec();
        foundProject._id = Types.ObjectId();
        foundProject.projectName = foundProject.projectName + ' (kopie)';
        foundProject.eventId = '';
        foundProject.calendarId = '';
        foundProject.calendarLink = '';
        foundProject.status = 'toPlan';
        foundProject.datePlanned = '';
        foundProject.hourPlanned = '';
        foundProject.dateCreated = new Date();

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

export const batchProjects = async (req, res) => {
    if (req.user.role === 'admin') {
        const statusToChange = req.body.status
        const projectsToChange = req.body.projects

        for (const projectToChange of projectsToChange) {
            try {
                const foundProject: any = await Project.findById(projectToChange._id).exec();
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