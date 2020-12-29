import { Schema, model } from 'mongoose';


class Comment extends Schema {
    constructor() {
        super({
            user: String,
            createdDateTime: Date,
            modifiedDateTime: Date,
            content: String,
        })
    }
}

export default model('comment', new Comment());

