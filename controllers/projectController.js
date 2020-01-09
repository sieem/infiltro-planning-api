const mongoose = require('mongoose')
const Project = require('../models/project')
const Company = require('../models/company')
const axios = require('axios')
const moment = require('moment')
const mailService = require('../services/mailService')
const calendarService = require('../services/calendarService')
const projectService = require('../services/projectService')
const calendar = new calendarService()

exports.generateProjectId = (req,res) => {
    res.status(200).send(mongoose.Types.ObjectId())
}

exports.saveProject = async (req, res) => {
    if ((req.body.company === req.user.company && req.user.role === 'company') || req.user.role === 'admin') {
        let project = new Project(req.body)

        // combine date and hour to have a better sorting
        project.datePlanned = calendar.combineDateHour(project.datePlanned, project.hourPlanned)

        // check if address changed or lat or lng is not filled in yet
        try {
            const foundProject = await Project.findById(project._id).exec()

            if (!foundProject || (foundProject && (project.street !== foundProject.street || project.city !== foundProject.city || project.postalCode !== foundProject.postalCode || !foundProject.lng || !foundProject.lat))) {
                const {data} = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
                    params: {
                        key: process.env.GMAPSAPIKEY,
                        address: `${project.street.replace(/ /, "+")}+${project.postalCode}+${project.city}`
                    }
                })

                if (data.status == "OK") {
                    project.lat = data.results[0].geometry.location.lat
                    project.lng = data.results[0].geometry.location.lng
                }
                    
            }

            if (project.datePlanned && project.hourPlanned && project.status == 'planned' && project.executor) {
                const companyQuery = await Company.findById(project.company).exec()
                const event = {
                    summary: `${companyQuery.name}: ${project.projectName} / ${projectService.projectTypeName(project.projectType) } / ${project.houseAmount}`,
                    location: `${project.street} ${project.postalCode} ${project.city}`,
                    description: `Bijkomenda aanwijzigingen adres: ${project.extraInfoAddress}\nContactgegevens: ${project.name} ${project.tel} ${project.email}\n${project.extraInfoContact}\nA-Test: ${project.ATest || 'onbekend'} m²\nv50-waarde: ${project.v50Value || 'onbekend'}m³/h.m²\nBeschermd volume: ${project.protectedVolume || 'onbekend'}m³\nEPB nr: ${project.EpbNumber || 'onbekend'}\nOpmerkingen: ${project.comments}`,
                    start: {
                        dateTime: project.datePlanned,
                        timeZone: 'Europe/Brussels',
                    },
                    end: {
                        dateTime: calendar.addHours(project.datePlanned, '1:30'),
                        timeZone: 'Europe/Brussels',
                    }
                }
                if (!foundProject || (!foundProject.eventId && !foundProject.calendarId)) {

                    const { eventId, calendarId, calendarLink } = await calendar.addEvent(project.executor, event)
                    project.eventId = eventId
                    project.calendarId = calendarId
                    project.calendarLink = calendarLink
                } else {
                    const excistingCalendarEvent = await calendar.findEvent(foundProject.calendarId, foundProject.eventId)
                    event.start.dateTime = excistingCalendarEvent.data.start.dateTime
                    event.end.dateTime = excistingCalendarEvent.data.end.dateTime

                    try {
                        const { eventId, calendarId, calendarLink } = await calendar.updateEvent(foundProject.calendarId, foundProject.eventId, project.executor, event);
                        project.datePlanned = moment(excistingCalendarEvent.data.start.dateTime).format("YYYY-MM-DD")
                        project.hourPlanned = moment(excistingCalendarEvent.data.start.dateTime).format("HH:mm")
                        project.eventId = eventId
                        project.calendarId = calendarId
                        project.calendarLink = calendarLink
                    } catch (error) {
                        project.eventId = ''
                        project.calendarId = ''
                        project.calendarLink = ''
                    }
                }
            }
            
            // save the project
            const oldProject = await Project.findById(project._id).exec()
            project.mails = (oldProject) ? oldProject.mails : [];
            const savedProject = await Project.findByIdAndUpdate(project._id, project, { upsert: true }).exec()
            
            // check if I have to send mails
            const idDavid = '5d4c733e65469039e2dd5acf'
            if (!savedProject && req.user.id !== idDavid) {
                let mail = new mailService({
                    from: '"Infiltro" <planning@infiltro.be>',
                    to: '"David Lasseel" <david.lasseel@gmail.com>',
                    subject: `Nieuw project: ${req.user.name} ${project.status} '${project.projectName}'`,
                    text: `Project '${project.projectName}' is toegevoegd door ${req.user.name} met status ${project.status}. Projecturl: ${process.env.BASE_URL}/project/${project._id}`,
                    html: `Project '${project.projectName}' is toegevoegd door ${req.user.name} met status ${project.status}. Projecturl: <a href="${process.env.BASE_URL}/project/${project._id}">${process.env.BASE_URL}/project/${project._id}</a>`
                })
                mail.send()
            }
            if (savedProject && project.status !== savedProject.status && req.user.id !== idDavid) {
                let mail = new mailService({
                    from: '"Infiltro" <planning@infiltro.be>',
                    to: '"David Lasseel" <david.lasseel@gmail.com>',
                    subject: `Projectstatuswijziging: ${req.user.name} ${project.status} '${project.projectName}'`,
                    text: `Status van project '${project.projectName}' is gewijzigd naar ${project.status} door ${req.user.name}. Projecturl: ${process.env.BASE_URL}/project/${savedProject._id}`,
                    html: `Status van project '${project.projectName}' is gewijzigd naar ${project.status} door ${req.user.name}. Projecturl: <a href="${process.env.BASE_URL}/project/${savedProject._id}">${process.env.BASE_URL}/project/${savedProject._id}</a>`
                })
                mail.send()
            }

            res.status(200).json(project)
        } catch (error) {
            console.log(error)
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

exports.removeProject = async (req, res) => {
    if (req.user.role === 'admin') {
        const foundProject = await Project.findById(req.params.projectId).exec()
        if (foundProject.calendarId && foundProject.eventId) {
            calendar.deleteEvent(foundProject.calendarId, foundProject.eventId)
        }
        Project.updateOne({ _id: req.params.projectId }, {
            status: "deleted"
        }, function (err, affected, resp) {            
            res.json(resp)
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
        res.json({ projectId: foundProject._id})

    } catch (error) {
        console.log(error)
        return res.status(400).send(error)
    }
}

exports.batchProjects = async (req, res) => {
    if (req.user.role === 'admin') {
        const statusToChange = req.body.status
        const projectsToChange = req.body.projects

        for (const projectToChange of projectsToChange) {
            await Project.updateOne({ _id: projectToChange._id }, {
                status: statusToChange
            }, function (err, affected, resp) {
                if (err) console.log(err)
            })
        }
        res.json({})
    } else {
        return res.status(401).send('Unauthorized request')
    }
}


exports.sendProjectMail = async (req, res) => {
    if (req.user.role === 'admin') {
        const mailForm = req.body
        const htmlMailBody = mailForm.body.replace(/\n/g, "<br>")
        const foundProject = await Project.findById(mailForm._id).exec()

        const mailDetails = {
            david: {
                name: "David Lasseel",
                email: "david@infiltro.be"
            },
            roel: {
                name: "Roel Berghman",
                email: "roel@infiltro.be"
            },
            default: {
                name: "Infiltro",
                email: "info@infiltro.be"
            }
        }

        let replyTo = '';

        try {
            replyTo = `"${mailDetails[foundProject.executor].name}" <${mailDetails[foundProject.executor].email}>`
        } catch (error) {
            replyTo = `"${mailDetails['default'].name}" <${mailDetails['default'].email}>`
        }

        //send mail
        const mail = new mailService({
            from: '"Infiltro" <planning@infiltro.be>',
            replyTo,
            bcc: 'info@infiltro.be',
            to: mailForm.to,
            cc: mailForm.cc,
            subject: mailForm.subject,
            text: mailForm.body,
            html: htmlMailBody,
            personalSignature: true,
            user: foundProject.executor
        })
        await mail.send()

        const mailObject = {
            sender: req.user._id,
            receiver: mailForm.to,
            dateSent: new Date(),
            body: mail.getHtml()
        }

        // save mail intro database
        Project.updateOne({ _id: mailForm._id }, {
            $push: { mails: mailObject }
        }, function (err, affected, resp) {
            if (err) console.log(err)
            else res.json({})
        })
        
    } else {
        return res.status(401).send('Unauthorized request')
    }
}
