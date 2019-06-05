const Project = require('../models/project')

exports.saveProject = (req, res) => {
    let project = new Project(req.body)

    project.save((err, project) => {
        if (err) console.log(err)
        else {
            
            res.status(200).send({ project })
        }
    })
}