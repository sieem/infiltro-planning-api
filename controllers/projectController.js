const Project = require('../models/project')

exports.saveProject = (req, res) => {
    if ((req.body.company === req.user.company && req.user.role === 'company') || req.user.role === 'admin') {
        let project = new Project(req.body)

        Project.findByIdAndUpdate(project._id, project, { upsert: true }, function (err, savedProject) {
            if (err) console.log(err)
            else {
                res.status(200).json({ projectId: project._id})
            }
        });
    } else {
        return res.status(401).send('Unauthorized request')
    }
}

exports.getProjects = (req, res) => {
    let findParameters = { company: req.user.company }
    if(req.user.role === 'admin') {
        findParameters = {}
    }
    Project.find(findParameters, (err, projects) => {
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
            if (project.company === req.user.company || req.user.role === 'admin') {
                res.status(200).json(project)
            } else {
                return res.status(401).send('Unauthorized request')
            }
        }
    })
}

exports.removeProject = (req, res) => {
    Project.deleteOne({ _id: req.params.projectId }, (err, project) => {
        if (err) console.log(err)
        else {
            res.json(project)
        }
    })
}