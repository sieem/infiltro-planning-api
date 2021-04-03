import axios from 'axios';
import Project from '../models/project';
import Company from '../models/company';
import moment from 'moment';
import calendarService from '../services/calendarService';
import { saveProjectArchive } from '../services/archiveService';
import mailService from '../services/mailService';
import { commentsToString, userIdToName, projectTypeName } from '../services/commonService';
const calendar = new calendarService();

export const getCoordinates = async (project, foundProject) => {
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
export const addCommentsAndEmails = (project, oldProject) => {
    // add comments and emails to project object
    project.mails = (oldProject) ? oldProject.mails : [];
    project.comments = (oldProject) ? oldProject.comments : [];

    return project;
}

export const saveCalendarItem = async (project, foundProject) => {
    if (project.datePlanned && project.hourPlanned && ['proposalSent', 'planned'].indexOf(project.status) > -1 && project.executor) {
        const companyQuery: any = await Company.findById(project.company).exec()
        const event: any = {
            summary: `${companyQuery.name}: ${project.projectName} / ${projectTypeName(project.projectType)} / ${project.houseAmount}`,
            location: `${project.street} ${project.postalCode} ${project.city}`,
            description: `
                    <b><u><a href="${process.env.BASE_URL}/project/${project._id}">Open project</a></u></b>

                    <b>Bijkomenda aanwijzigingen adres:</b> ${project.extraInfoAddress}
                    <b>Contactgegevens:</b>${project.name} <a href="tel:${project.tel}">${project.tel}</a> ${project.email}
                    ${project.extraInfoContact}
                    <b>A-Test:</b> ${!!project.ATest ? project.ATest : 'onbekend'} m²
                    <b>v50-waarde:</b> ${!!project.v50Value ? project.v50Value : 'onbekend'}m³/h.m²
                    <b>Beschermd volume:</b> ${!!project.protectedVolume ? project.protectedVolume : 'onbekend'}m³
                    <b>EPB nr:</b> ${!!project.EpbNumber ? project.EpbNumber : 'onbekend'}
                    <b>Contactpersoon:</b> ${!!project.EpbReporter ? await userIdToName(project.EpbReporter) : 'onbekend'}
                    <b>Opmerkingen:</b>
                    ${await commentsToString(project.comments)}`.replace(/\n */g, '\n').trim(),
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
            const { eventId, calendarId, calendarLink } = await calendar.addEvent(project.executor, event) as any;
            project.eventId = eventId
            project.calendarId = calendarId
            project.calendarLink = calendarLink
        } else {
            // update calendarItem
            const excistingCalendarEvent: any = await calendar.findEvent(foundProject.calendarId, foundProject.eventId);
            event.start.dateTime = excistingCalendarEvent.data.start.dateTime
            event.end.dateTime = excistingCalendarEvent.data.end.dateTime

            try {
                const { eventId, calendarId, calendarLink } = await calendar.updateEvent(foundProject.calendarId, foundProject.eventId, project.executor, event) as any;
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

export const sendMails = (project, savedProject, user) => {
    // check if I have to send mails
    const idDavid = '5d4c733e65469039e2dd5acf'
    if (!savedProject && user.get('id') !== idDavid) {
        let mail = new mailService({
            from: '"Infiltro" <planning@infiltro.be>',
            to: '"David Lasseel" <david.lasseel@gmail.com>',
            subject: `Nieuw project: ${user.name} ${project.status} '${project.projectName}'`,
            text: `Project '${project.projectName}' is toegevoegd door ${user.name} met status ${project.status}. Projecturl: ${process.env.BASE_URL}/project/${project._id}`,
            html: `Project '${project.projectName}' is toegevoegd door ${user.name} met status ${project.status}. Projecturl: <a href="${process.env.BASE_URL}/project/${project._id}">${process.env.BASE_URL}/project/${project._id}</a>`
        })
        mail.send()
    }
    if (savedProject && project.status !== savedProject.status && user.get('id') !== idDavid) {
        let mail = new mailService({
            from: '"Infiltro" <planning@infiltro.be>',
            to: '"David Lasseel" <david.lasseel@gmail.com>',
            subject: `Projectstatuswijziging: ${user.name} ${project.status} '${project.projectName}'`,
            text: `Status van project '${project.projectName}' is gewijzigd naar ${project.status} door ${user.name}. Projecturl: ${process.env.BASE_URL}/project/${savedProject._id}`,
            html: `Status van project '${project.projectName}' is gewijzigd naar ${project.status} door ${user.name}. Projecturl: <a href="${process.env.BASE_URL}/project/${savedProject._id}">${process.env.BASE_URL}/project/${savedProject._id}</a>`
        })
        mail.send()
    }
}

export const saveProject = async (body, user) => {
    if ((body.company === user.company && user.role === 'company') || user.role === 'admin') {
        let project: any = new Project(body)

        // combine date and hour to have a better sorting
        project.datePlanned = calendar.combineDateHour(project.datePlanned, project.hourPlanned)

        try {
            const oldProject = await Project.findById(project._id).exec();

            project = await getCoordinates(project, oldProject);
            project = addCommentsAndEmails(project, oldProject);
            project = await saveCalendarItem(project, oldProject);
            project.dateEdited = new Date();

            saveProjectArchive(project, user.get('id'));

            // save the project
            const savedProject = await Project.findByIdAndUpdate(project._id, project, { upsert: true }).exec();

            sendMails(project, savedProject, user);
            return project;
        } catch (error) {
            console.log(error);
            throw { status: 500, message: 'Couldn\'t save project' };
        }
    } else {
        throw { status: 401, message: 'Unauthorized request' };
    }
}