import { Schema, model } from 'mongoose';


class MailTemplate extends Schema {
    constructor() {
        super({
            name: String,
            subject: String,
            body: String,
        })
    }
}

export default model('mailTemplate', new MailTemplate());

