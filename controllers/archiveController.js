const mongoose = require('mongoose')
const Archive = require('../models/archive')

exports.getProjectArchive = (req, res) => {
    Archive.find( { projectId: req.params.projectId }, { projectData: 0, projectData: 0 }, (err, archive) => {
        if (err) {
            console.error(err)
            return res.status(400).json(err.message)
        }

        res.status(200).json(archive)
    });
}
