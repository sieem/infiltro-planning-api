const mongoose = require('mongoose')
const Project = require('../models/project')

exports.getComments = (req, res) => {
    Project.findById(req.params.projectId, (err, project) => {
        if (err) {
            console.error(err)
            return res.status(400).json(err.message)
        }

        if (project) return res.status(200).json(project.comments)
        return res.status(200).send([])
    })
}

exports.saveComment = async (req, res) => {
    const commentForm = req.body
    let commentObject = {}

    if (!commentForm._id) {
        commentObject = {
            _id: mongoose.Types.ObjectId(),
            user: commentForm.user,
            createdDateTime: new Date,
            modifiedDateTime: new Date,
            content: commentForm.content,
        }

        try {
            await Project.updateOne({ _id: req.params.projectId }, { $push: { comments: commentObject } }).exec()
        } catch (error) {
            console.log(error)
        }

        try {
            const project = await Project.findById(req.params.projectId).exec()
            return res.json(project.comments)
        } catch (error) {
            console.log(error)
        }
    } else {
        if (req.user.role !== 'admin' && req.user.id !== commentForm.user) {
            return res.status(401).send('Unauthorized request')
        }

        commentObject = {
            _id: commentForm._id,
            user: commentForm.user,
            createdDateTime: commentForm.createdDateTime,
            modifiedDateTime: new Date,
            content: commentForm.content,
        }

        const project = await Project.findById(req.params.projectId).exec()

        project.comments = updateElementInArray(project.comments, commentObject)
        await Project.findByIdAndUpdate(req.params.projectId, project, { upsert: true }).exec()
        return res.status(200).json(project.comments)
    }
}

exports.removeComment = (req, res) => {
    Project.findById(req.params.projectId, async (err, project) => {
        if (err) {
            console.error(err)
            return res.status(400).json(err.message)
        }
        if (req.user.role !== 'admin' && getComment(project.comments, req.params.commentId).user !== req.user.id) {
            return res.status(401).send('Unauthorized request');
        }
        project.comments = removeElementInArray(project.comments, req.params.commentId)
        await Project.findByIdAndUpdate(req.params.projectId, project, { upsert: true }).exec()
        return res.status(200).json(project.comments)
    })
}

function removeElementInArray(array, id) {
    return array.filter(el => el._id != id)
}

function updateElementInArray(array, element) {
    for (const key in array) {
        if (array[key]._id == element._id) {
            array[key] = element
            return array
        }
    }
    return array
}

function getComment(array, id) {
    return array.filter(el => el._id == id)[0]
}