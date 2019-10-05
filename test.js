require('dotenv').config()
const calendarService = require('./services/calendarService')

const calendar = new calendarService()
var event = {
    'summary': 'projectName',
    'location': 'projectLocatipn',
    'description': '\n\nDavid 0473/526473 Nele 0472/916325\ndavid.aerts@ge.com\n\n473,39m²',
    'start': {
        'dateTime': '2019-10-13T09:00:00',
        'timeZone': 'Europe/Brussels',
    },
    'end': {
        'dateTime': '2019-10-13T17:00:00',
        'timeZone': 'Europe/Brussels',
    }
};

(async ()=>{
    const {eventId, calendarId} = await calendar.addEvent(event);
    console.log(eventId, calendarId);
})();