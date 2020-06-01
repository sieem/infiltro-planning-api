const Archive = require('../models/archive');

exports.saveProjectArchive = (project, userId) => {
    const projectToArchive = {
        user: userId,
        projectId: project,
        savedDateTime: new Date(),
        projectData: project,
    };

    new Archive(projectToArchive).save();
}