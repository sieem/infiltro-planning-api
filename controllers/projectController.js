const Project = require('../models/project')
const axios = require('axios')

exports.saveProject = async (req, res) => {
    if ((req.body.company === req.user.company && req.user.role === 'company') || req.user.role === 'admin') {
        let project = new Project(req.body)

        // check if address changed or lat or lng is not filled in yet
        await Project.findById(project._id, (err, foundProject) => {
            if (err) console.log(err)
            else {
                if (foundProject && (project.street !== foundProject.street || project.city !== foundProject.city || project.postalCode !== foundProject.postalCode || !foundProject.lng || !foundProject.lat)) {
                    axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
                        params: {
                            key: process.env.GMAPSAPIKEY,
                            address: `${project.street.replace(/ /,"+")}+${project.postalCode}`
                        }
                    })
                    .then(function ({data}) {
                        // console.log(response)
                        if (data.status == "OK") {
                            project.lat = data.results[0].geometry.location.lat
                            project.lng = data.results[0].geometry.location.lng
                        }
                        
                    })
                    .catch(function (error) {
                        console.log(error)
                    })
                }
            }
        })        

        await Project.findByIdAndUpdate(project._id, project, { upsert: true }, function (err, savedProject) {
            if (err) console.log(err)
            else res.status(200).json({ projectId: project._id})
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