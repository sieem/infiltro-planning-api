const Project = require('../models/project')

exports.saveProject = (req, res) => {
    let project = new Project(req.body)

    Project.findByIdAndUpdate(project._id, project, { upsert: true }, function (err, savedProject) {
        if (err) console.log(err)
        else {
            res.status(200).json(savedProject)
        }
    });
}

exports.getProjects = (req, res) => {
    Project.find({}, (err, projects) => {
        if (err) console.log(err)
        else {
            res.status(200).json(projects)
        }
    })
    
}

exports.getProject = (req, res) => {
    Project.findById(req.params.projectId, (err, project) => {
        if (err) console.log(err)
        else {
            res.status(200).json(project)
        }
    })
}