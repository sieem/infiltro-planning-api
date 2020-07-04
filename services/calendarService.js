const fs = require('fs-extra');
const { google } = require('googleapis');
const CREDENTIALS_PATH = './credentials.json';
const TOKEN_PATH = './token.json';

module.exports = class Calendar {
    constructor(calendarData) {
        this.calendarData = calendarData
        
    }

    init() {
        this.authorize(fs.readJSONSync(CREDENTIALS_PATH));
    }

    /**
     * Create an OAuth2 client with the given credentials, and then execute the
     * given callback function.
     * @param {Object} credentials The authorization client credentials.
     * @param {function} callback The callback to call with the authorized client.
     */
    authorize(credentials, callback) {
        const { client_secret, client_id, redirect_uris } = credentials.installed;
        this.oAuth2Client = new google.auth.OAuth2(
            client_id, client_secret, redirect_uris[0]);

        // Check if we have previously stored a token.
        try {
            const token = fs.readJSONSync(TOKEN_PATH);
            this.oAuth2Client.setCredentials(token);
        } catch (error) {
            console.log('no token yet')
        }
        
    }

    findEvent(calendarId, eventId) {
        if (!this.oAuth2Client) {
            this.init();
        }
        return new Promise((resolve, reject) => {
            const calendar = google.calendar({ version: 'v3', auth: this.oAuth2Client });
            calendar.events.get({
                auth: this.oAuth2Client,
                calendarId,
                eventId
            }, (err, res) => {
                if (err) reject('There was an error contacting the Calendar service: ' + err);
                resolve(res);
            });
        })
    }

    addEvent(executor,event) {
        if (!this.oAuth2Client) {
            this.init();
        }
        return new Promise((resolve, reject) => {
            const calendar = google.calendar({ version: 'v3', auth: this.oAuth2Client });
            calendar.events.insert({
                auth: this.oAuth2Client,
                calendarId: process.env['CALENDAR_' + executor.toUpperCase()],
                resource: event,
            }, (err, res) => {
                if (err) reject('Couldn\'t insert event: ' + err);
                resolve({ eventId: res.data.id, calendarId: process.env['CALENDAR_' + executor.toUpperCase()], calendarLink: res.data.htmlLink});
            });
        }) 
    }

    updateEvent(calendarId, eventId, executor, event) {
        if (!this.oAuth2Client) {
            this.init();
        }
        return new Promise((resolve, reject) => {
            const calendar = google.calendar({ version: 'v3', auth: this.oAuth2Client });
            if (calendarId == process.env['CALENDAR_' + executor.toUpperCase()]) {
                calendar.events.update({
                    auth: this.oAuth2Client,
                    resource: event,
                    eventId,
                    calendarId
                }, (err, res) => {
                    if (err) reject('Couldn\'t update event: ' + err);
                    resolve({ eventId: res.data.id, calendarId, calendarLink: res.data.htmlLink });
                });
            } else {
                calendar.events.delete({
                    auth: this.oAuth2Client,
                    eventId,
                    calendarId
                }, (err, res) => {
                    if (err) reject('Couldn\'t delete event: ' + err);
                    calendar.events.insert({
                        auth: this.oAuth2Client,
                        calendarId: process.env['CALENDAR_' + executor.toUpperCase()],
                        resource: event,
                    }, (err, res) => {
                        if (err) reject('Couldn\'t insert event after deletion: ' + err);
                        resolve({ eventId: res.data.id, calendarId: process.env['CALENDAR_' + executor.toUpperCase()], calendarLink: res.data.htmlLink });
                    });
                });
            }
            
        })
    }

    deleteEvent(calendarId, eventId) {
        if (!this.oAuth2Client) {
            this.init();
        }
        return new Promise((resolve, reject) => {
            const calendar = google.calendar({ version: 'v3', auth: this.oAuth2Client });
            calendar.events.delete({
                auth: this.oAuth2Client,
                eventId,
                calendarId
            }, (err, res) => {
                if (err) reject('Couldn\'t delete event: ' + err);
                resolve(res);
            });

        })
    }

    synchroniseCalendar(calendarId, latestSyncToken, nextPageToken) {
        if (!this.oAuth2Client) {
            this.init();
        }

        let params = { calendarId };

        if (latestSyncToken) {
            params = { ...params, latestSyncToken }
        }

        if (nextPageToken) {
            params = { ...params, pageToken: nextPageToken }
        }
        return new Promise((resolve, reject) => {
            const calendar = google.calendar({ version: 'v3', auth: this.oAuth2Client });
            calendar.events.list(params, (err, res) => {
                if (err) reject('There was an error contacting the Calendar service: ' + err);
                resolve(res);
            });
        })
    }

    combineDateHour(date, hour) {
        if (!hour || !date) {
            return date
        }
        const dateWithHours = new Date(date.setHours(hour.split(':')[0]))
        const dateWithHoursAndMinutes = new Date(dateWithHours.setMinutes(hour.split(':')[1]))
        return dateWithHoursAndMinutes
    }

    addHours(date, time) {
        if (typeof time === 'string') {
            const hours = time.split(':')[0]
            const minutes = time.split(':')[1]
            return new Date(date.getTime() + (hours * 60 * 60 * 1000) + (minutes * 60 * 1000))
        } else {
            return new Date(date.getTime() + time)
        }
    }

}