import { Schema, model } from 'mongoose';


class Project extends Schema {
    constructor() {
        super({
            company: String,
            dateCreated: Date,
            dateEdited: Date,
            projectType: String,
            houseAmount: String,
            projectName: String,
            client: String,
            street: String,
            city: String,
            postalCode: String,
            extraInfoAddress: String,
            lng: Number,
            lat: Number,
            name: String,
            tel: String,
            email: String,
            extraInfoContact: String,
            EpbReporter: String,
            ATest: String,
            v50Value: String,
            protectedVolume: String,
            EpbNumber: String,
            executor: String,
            datePlanned: Date,
            hourPlanned: String,
            status: String,
            comments: Array,
            mails: Array,
            calendarId: String,
            eventId: String,
            calendarLink: String,
            dateActive: Date,
        })
    }
}

export default model('project', new Project());

