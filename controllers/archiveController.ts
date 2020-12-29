import Archive from '../models/archive';

export const getProjectArchive = (req, res) => {
    Archive.find({ projectId: req.params.projectId }, { projectId: 0 }).sort({ savedDateTime: -1}).exec( (err, archive) => {
        if (err) {
            console.error(err)
            return res.status(400).json(err.message)
        }

        res.status(200).json(archive);
    });
}

