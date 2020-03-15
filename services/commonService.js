const User = require('../models/user')
const moment = require('moment')

const usersIdCache = {}

exports.commentsToString = async (comments) => {
    let returnString = ''
    
    for (const comment of comments) {
        returnString += `${await this.userIdToName(comment.user)} (${moment(comment.modifiedDateTime).format("YYYY-MM-DD HH:mm")}):${comment.content}\n`
    }

    return returnString;
}

exports.userIdToName = async (userId) => {
    if (usersIdCache[userId]) {
        return usersIdCache[userId]
    }
    try {
        const user = await User.findById(userId).select({ name: 1 }).exec()
        usersIdCache[userId] = user.name
        return user.name
    } catch (error) {
        console.error(error);
        return 'Gebruiker niet gevonden';
    }
}