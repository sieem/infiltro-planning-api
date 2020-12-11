const axios = require('axios');
const Project = require('../models/project');
const Company = require('../models/company');
const moment = require('moment');
const calendarService = require('../services/calendarService');
const mailService = require('../services/mailService');
const commonService = require('../services/commonService');
const calendar = new calendarService();


const projectTypes = [
    {
        type: "house",
        name: "Woning"
    },
    {
        type: "stairs",
        name: "Traphal"
    },
    {
        type: "apartment",
        name: "Appartement"
    },
    {
        type: "mixed",
        name: "Gemengd"
    },
    {
        type: "other",
        name: "Andere"
    }
]

const executors = [
    {
        type: "roel",
        name: "Roel"
    },
    {
        type: "david",
        name: "David"
    },
    {
        type: "together",
        name: "Samen"
    }
]

exports.executorName = (type) => {
    let name;
    executors.forEach(executor => {
        if (executor.type === type) {
            name = executor.name
        }
    })
    return name || 'Onbeslist'

}

exports.projectTypeName = (type) => {
    let name;
    projectTypes.forEach(projectType => {
        if (projectType.type === type) {
            name = projectType.name
        }
    })
    return name || 'Onbekend'
}

exports.getCoordinates = async (project, foundProject) => {
    if (foundProject && project.street === foundProject.street && project.city === foundProject.city && project.postalCode === foundProject.postalCode && foundProject.lng && foundProject.lat) {
        return project;
    }

    const { data } = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
        params: {
            key: process.env.GMAPSAPIKEY,
            address: `${project.street.replace(/ /, "+")}+${project.postalCode}+${project.city}`
        }
    })

    if (data.status == "OK") {
        project.lat = data.results[0].geometry.location.lat
        project.lng = data.results[0].geometry.location.lng
    }

    return project;
}
exports.addCommentsAndEmails = (project, oldProject) => {
    // add comments and emails to project object
    project.mails = (oldProject) ? oldProject.mails : [];
    project.comments = (oldProject) ? oldProject.comments : [];

    return project;
}

exports.saveCalendarItem = async (project, foundProject) => {
    if (project.datePlanned && project.hourPlanned && ['proposalSent', 'planned'].indexOf(project.status) > -1 && project.executor) {
        const companyQuery = await Company.findById(project.company).exec()
        const event = {
            summary: `${companyQuery.name}: ${project.projectName} / ${this.projectTypeName(project.projectType)} / ${project.houseAmount}`,
            location: `${project.street} ${project.postalCode} ${project.city}`,
            description: `Bijkomenda aanwijzigingen adres: ${project.extraInfoAddress}\nContactgegevens: ${project.name} ${project.tel} ${project.email}\n${project.extraInfoContact}\nA-Test: ${!!project.ATest ? project.ATest : 'onbekend'} m²\nv50-waarde: ${!!project.v50Value ? project.v50Value : 'onbekend'}m³/h.m²\nBeschermd volume: ${!!project.protectedVolume ? project.protectedVolume : 'onbekend'}m³\nEPB nr: ${!!project.EpbNumber ? project.EpbNumber : 'onbekend'}\nContactpersoon: ${!!project.EpbReporter ? await commonService.userIdToName(project.EpbReporter) : 'onbekend'}\nOpmerkingen: \n ${await commonService.commentsToString(project.comments)}`,
            start: {
                dateTime: project.datePlanned,
                timeZone: 'Europe/Brussels',
            },
            end: {
                dateTime: calendar.addHours(project.datePlanned, '1:30'),
                timeZone: 'Europe/Brussels',
            }
        }

        // use a different color to differenciate visually
        if (project.status === "proposalSent") {
            event.colorId = '2'; // https://lukeboyle.com/blog-posts/2016/04/google-calendar-api---color-id
        }

        if (!foundProject || (!foundProject.eventId && !foundProject.calendarId)) {
            // add calendarItem
            const { eventId, calendarId, calendarLink } = await calendar.addEvent(project.executor, event)
            project.eventId = eventId
            project.calendarId = calendarId
            project.calendarLink = calendarLink
        } else {
            // update calendarItem
            const excistingCalendarEvent = await calendar.findEvent(foundProject.calendarId, foundProject.eventId)
            event.start.dateTime = excistingCalendarEvent.data.start.dateTime
            event.end.dateTime = excistingCalendarEvent.data.end.dateTime

            try {
                const { eventId, calendarId, calendarLink } = await calendar.updateEvent(foundProject.calendarId, foundProject.eventId, project.executor, event);
                project.datePlanned = moment(excistingCalendarEvent.data.start.dateTime).format("YYYY-MM-DD HH:mm")
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


    // delete calendarItem
    if (foundProject && ['proposalSent', 'planned', 'executed', 'reportAvailable', 'conformityAvailable', 'completed'].indexOf(project.status) === -1 && foundProject.eventId && foundProject.calendarId) {
        calendar.deleteEvent(foundProject.calendarId, foundProject.eventId)
        project.eventId = ''
        project.calendarId = ''
        project.calendarLink = ''
    }

    return project;
}

exports.sendMails = (project, savedProject, req) => {
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
}