import Archive from '../models/archive';

export const saveProjectArchive = (project, userId) => {
    const projectToArchive = {
        user: userId,
        projectId: project,
        savedDateTime: new Date(),
        projectData: project,
    };

    new Archive(projectToArchive).save();
}