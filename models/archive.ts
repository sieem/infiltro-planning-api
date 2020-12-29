import { Schema, model } from 'mongoose';

class Archive extends Schema {
    constructor() {
        super({
            user: Schema.Types.ObjectId,
            projectId: Schema.Types.ObjectId,
            savedDateTime: Date,
            projectData: Schema.Types.Mixed,
        })
    }
}

export default model('archive', new Archive());

