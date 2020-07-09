(async () => {
    require('dotenv').config();
    const mongoose = require('mongoose')
    const fs = require('fs-extra');
    const moment = require('moment');
    const schedule = require('node-schedule');
    const Project = require('../models/project');
    const CalendarService = require('../services/calendarService');
    const calendarService = new CalendarService();
    let latestSyncTokens = {};
    try {
        latestSyncTokens = fs.readJsonSync('./calendarSync/latestSyncTokens.json', 'utf8')
    } catch (e) {}

    const db = `mongodb://${process.env.MONGODB_USER}:${process.env.MONGODB_PASS}@localhost:27017/${process.env.MONGODB_DB}`

    await mongoose.connect(db, { useNewUrlParser: true })

    const calendars = [
        {
            id: process.env.CALENDAR_ROEL,
            name: 'roel',
        },
        {
            id: process.env.CALENDAR_DAVID,
            name: 'david',
        },
        {
            id: process.env.CALENDAR_TOGETHER,
            name: 'together',
        },
    ];

    schedule.scheduleJob('0 4 * * *', async (fireDate) => {
        console.log('Sync at', moment(fireDate).format("YYYY-MM-DD HH:mm"));

        const projects = await Project.find({}).select({ eventId: 1 }).exec();

        const projectEventIds = projects.reduce((acc, cur) => [...acc, cur.eventId], []);

        try {
            for (const calendar of calendars) {
                const newSyncToken = await processCalendar(calendar, projectEventIds, latestSyncTokens[calendar.name]);
                latestSyncTokens[calendar.name] = newSyncToken;
                fs.writeJsonSync('./calendarSync/latestSyncTokens.json', latestSyncTokens, 'utf8');
            }
        } catch (error) {
            console.log(error);
        }


    });

    async function processCalendar(calendar, projectEventIds, latestSyncToken, nextPageToken) {
        const { data: calendarResult } = await calendarService.synchroniseCalendar(calendar.id, latestSyncToken, nextPageToken);
        const { items, nextPageToken: newNextPageToken, nextSyncToken } = calendarResult;

        console.log(calendar.name, items.length, latestSyncToken == nextSyncToken);

        for (const item of items) {
            const { id, start, end } = item;

            if (!id || !start || !start.dateTime || !end || !end.dateTime) {
                continue;
            }

            if (projectEventIds.indexOf(id) === -1) {
                continue;
            }

            console.log('update', id);

            Project.updateOne(
                { eventId: id },
                { datePlanned: moment(start.dateTime).format("YYYY-MM-DD HH:mm"), hourPlanned: moment(start.dateTime).format("HH:mm") }
            ).exec();
        }

        return (newNextPageToken) ? await processCalendar(calendar, projectEventIds, latestSyncToken, newNextPageToken) : nextSyncToken;
    }
})()
