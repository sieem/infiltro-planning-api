import User from '../models/user';
import moment from 'moment';

const usersIdCache = {}

const projectTypes = [
    {
        type: "house",
        name: "Woning"
    },
    {
        type: "stairs",
        name: "Traphal"
    },
    {
        type: "apartment",
        name: "Appartement"
    },
    {
        type: "mixed",
        name: "Gemengd"
    },
    {
        type: "other",
        name: "Andere"
    }
];

const executors = [
    {
        type: "roel",
        name: "Roel"
    },
    {
        type: "david",
        name: "David"
    },
    {
        type: "together",
        name: "Samen"
    }
];

export const commentsToString = async (comments) => {
    let returnString = '';
    
    for (const comment of comments) {
        returnString += `${await userIdToName(comment.user)} (${moment(comment.modifiedDateTime).format("YYYY-MM-DD HH:mm")}):${comment.content}\n`
    }

    return returnString;
}

export const userIdToName = async (userId) => {
    if (usersIdCache[userId]) {
        return usersIdCache[userId];
    }
    try {
        const user: any = await User.findById(userId).select({ name: 1 }).exec();
        usersIdCache[userId] = user.name;
        return user.name;
    } catch (error) {
        console.error(error);
        return 'Gebruiker niet gevonden';
    }
}

export const projectTypeName = (type) => {
    let name;
    projectTypes.forEach(projectType => {
        if (projectType.type === type) {
            name = projectType.name;
        }
    })
    return name || 'Onbekend';
};

export const executorName = (type) => {
    let name;
    executors.forEach(executor => {
        if (executor.type === type) {
            name = executor.name;
        }
    })
    return name || 'Onbeslist';
};