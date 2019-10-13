const mongoose = require('mongoose')
const Project = require('../models/project')
const Company = require('../models/company')
const axios = require('axios')
const moment = require('moment')
const mailService = require('../services/mailService')
const calendarService = require('../services/calendarService')
const calendar = new calendarService()

exports.generateProjectId = (req,res) => {
    res.status(200).send(mongoose.Types.ObjectId())
}

exports.saveProject = (req, res) => {
    if ((req.body.company === req.user.company && req.user.role === 'company') || req.user.role === 'admin') {
        let project = new Project(req.body)

        // check if address changed or lat or lng is not filled in yet
        Project.findById(project._id, async (err, foundProject) => {
            if (err) console.log(err)
            else {
                if (foundProject && (project.street !== foundProject.street || project.city !== foundProject.city || project.postalCode !== foundProject.postalCode || !foundProject.lng || !foundProject.lat)) {
                    axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
                        params: {
                            key: process.env.GMAPSAPIKEY,
                            address: `${project.street.replace(/ /,"+")}+${project.postalCode}+${project.city}`
                        }
                    })
                    .then(function ({data}) {
                        if (data.status == "OK") {
                            project.lat = data.results[0].geometry.location.lat
                            project.lng = data.results[0].geometry.location.lng
                        }
                        Project.findByIdAndUpdate(project._id, project, { upsert: true }, function (err, savedProject) {
                            if (err) console.log(err)
                            // else res.status(200).json({ projectId: project._id })
                        });
                    })
                    .catch(function (error) {
                        console.log(error)
                    })
                }
                if (project.datePlanned && project.hourPlanned && project.status == 'planned') {
                    const startDateTime = calendar.combineDateHour(project.datePlanned, project.hourPlanned)
                    const companyQuery = await Company.findById(project.company).exec()
                    const event = {
                        summary: `${companyQuery.name} ${project.projectName}`,
                        location: `${project.street} ${project.postalCode} ${project.city}`,
                        description: `${project.name} ${project.tel}\nA-Test: ${project.ATest || 'onbekend'} m²\nEPB nr: ${project.EpbNumber || 'onbekend'}`,
                        start: {
                            dateTime: startDateTime,
                            timeZone: 'Europe/Brussels',
                        },
                        end: {
                            dateTime: calendar.addHours(startDateTime, '1:30'),
                            timeZone: 'Europe/Brussels',
                        }
                    }
                    if (!foundProject || (!foundProject.eventId && !foundProject.calendarId)) {

                        const { eventId, calendarId } = await calendar.addEvent(project.executor, event)
                        project.eventId = eventId
                        project.calendarId = calendarId
                    } else {
                        const excistingCalendarEvent = await calendar.findEvent(foundProject.calendarId, foundProject.eventId)
                        event.start.dateTime = excistingCalendarEvent.data.start.dateTime
                        event.end.dateTime = excistingCalendarEvent.data.end.dateTime

                        try {
                            const { eventId, calendarId } = await calendar.updateEvent(foundProject.calendarId, foundProject.eventId, project.executor, event);
                            project.datePlanned = new Date(new Date(excistingCalendarEvent.data.start.dateTime).setHours(0)).setMinutes(0)
                            project.hourPlanned = moment(excistingCalendarEvent.data.start.dateTime).format("HH:mm")
                            project.eventId = eventId
                            project.calendarId = calendarId
                        } catch (error) {
                            project.eventId = ''
                            project.calendarId = ''
                        }
                    }

                    
                }
                
                await Project.findByIdAndUpdate(project._id, project, { upsert: true }, function (err, savedProject) {
                    if (err) console.log(err)
                    else {
                        const idDavid = '5d4c733e65469039e2dd5acf'
                        if (!foundProject && req.user.id !== idDavid) {
                            let mail = new mailService({
                                from: '"Infiltro" <planning@infiltro.be>',
                                to: '"David Lasseel" <david.lasseel@gmail.com>',
                                subject: `Nieuw project aangemaakt: ${project.projectName}`,
                                text: `Project '${project.projectName}' is toegevoegd door ${req.user.name} met status ${project.status}. Projecturl: ${process.env.BASE_URL}/project/${project._id}`,
                                html: `Project '${project.projectName}' is toegevoegd door ${req.user.name} met status ${project.status}. Projecturl: <a href="${process.env.BASE_URL}/project/${project._id}">${process.env.BASE_URL}/project/${project._id}</a>`
                            })
                            mail.send()
                        }
                        if (foundProject && project.status !== foundProject.status && req.user.id !== idDavid) {
                            let mail = new mailService({
                                from: '"Infiltro" <planning@infiltro.be>',
                                to: '"David Lasseel" <david.lasseel@gmail.com>',
                                subject: `Projectstatus gewijzigd: ${project.projectName}`,
                                text: `Status van project '${project.projectName}' is gewijzigd naar ${project.status} door ${req.user.name}. Projecturl: ${process.env.BASE_URL}/project/${savedProject._id}`,
                                html: `Status van project '${project.projectName}' is gewijzigd naar ${project.status} door ${req.user.name}. Projecturl: <a href="${process.env.BASE_URL}/project/${savedProject._id}">${process.env.BASE_URL}/project/${savedProject._id}</a>`
                            })
                            mail.send()
                        }

                        res.status(200).json({ projectId: project._id })
                    }
                })
            }
        })        

        
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

        //send mail
        const mail = new mailService({
            from: '"Infiltro" <planning@infiltro.be>',
            replyTo: `"${req.user.name}" <${req.user.email}>`,
            bcc: 'info@infiltro.be',
            to: mailForm.to,
            subject: mailForm.subject,
            text: mailForm.body,
            html: htmlMailBody,
            personalSignature: true
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