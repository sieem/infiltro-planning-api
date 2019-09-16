const User = require('../models/user')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const mailService = require('../services/mailService')
const authService = require('../services/authService')
const secretKey = process.env.SECRET_KEY
const saltRounds = 10

exports.getUsers = (req, res) => {
    const findParameters = (req.user.role === 'admin') ? {} : { company: req.user.company }

    User.find(findParameters, (err, users) => {
        if (err) console.log(err)
        else res.status(200).json(users)
    })
}

//unused for now
exports.getUser = (req, res) => {
    User.findById(req.params.userId, (err, user) => {
        if (err) console.log(err)
        else {
            if (!user.password) {
                res.status(200).json(user)
            } else {
                return res.status(401).send('Unauthorized request')
            }
        }
    })
}

exports.getUserByResetToken = (req, res) => {
    User.findOne({ resetToken: req.params.resetToken}, (err, user) => {
        if (err) console.log(err)
        else {
            res.status(200).json(user._id)
        }
    })
}

exports.loginUser = (req, res) => {
    User.findOne({ email: req.body.email }, (err, user) => {
        if (err) console.log(err)
        else {
            if (!user)
                res.status(401).send('Invalid Email')
            else {
                bcrypt.compare(req.body.password, user.password, (err, compareValid) => {
                    if (err) console.log(err)
                    else if (!compareValid) {
                        res.status(401).send('Invalid Password')
                    } else {
                        let payload = { id: user._id, role: user.role, company: user.company }
                        let token = jwt.sign(payload, secretKey)
                        res.status(200).send({ token })
                    }
                });
            }
        }
    })
}

exports.addUser = (req, res) => {
    if (req.user.role === 'admin') {
        User.findOne({ email: req.body.email }, async (err, user) => {
            if (err) console.log(err)
            else {
                if (user)
                    res.status(401).send('Email already exists')
                else {
                    let user = new User(req.body)
                    user.resetToken = await authService.generateToken()

                    user.save((err, user) => {
                        if (err) console.log(err)
                        else {
                            const mail = new mailService({
                                from: '"Infiltro" <planning@infiltro.be>',
                                to: user.email,
                                subject: "Je bent toegevoegd op planning.infiltro.be",
                                text: `Gelieve je registratie af te ronden op ${process.env.BASE_URL}/registreer/${user.resetToken}`,
                                html: `Gelieve je registratie af te ronden op <a href="${process.env.BASE_URL}/registreer/${user.resetToken}">${process.env.BASE_URL}/registreer/${user.resetToken}</a>`
                            })
                            mail.send()
                            
                            res.status(200).send(user)
                        }
                    })
                }
            }
        })
    } else {
        return res.status(401).send('Unauthorized request')
    }
}

exports.registerUser = (req, res) => {
    User.findById(req.body._id, (err, user) => {
        if (err) console.log(err)
        else {
            user.password = req.body.password

            bcrypt.hash(user.password, saltRounds, (err, hash) => {
                if (err) console.log(err)
                user.password = hash;
                user.resetToken = '';

                user.save((err, user) => {
                    if (err) console.log(err)
                    else {
                        let payload = { id: user._id, role: user.role, company: user.company }
                        let token = jwt.sign(payload, secretKey)
                        res.status(200).send({ token })
                    }
                })
            })
        }
    })
}



exports.resetPassword = (req, res) => {
    User.findOne({ email: req.body.email }, async (err, user) => {
        if (err) console.log(err)
        else {
            if (!user) return res.status(401).send('Unauthorized request: no user found with given email')
            else {
                user.resetToken = await authService.generateToken()

                user.save((err, user) => {
                    if (err) console.log(err)
                    else {
                        let mail = new mailService({
                            from: '"Infiltro" <planning@infiltro.be>',
                            to: user.email,
                            subject: "Wachtwoord reset aangevraagd",
                            text: `Gelieve je wachtwoord te herstellen door naar volgende url te surfen: ${process.env.BASE_URL}/herstel-wachtwoord/${user.resetToken}`,
                            html: `Gelieve je wachtwoord te herstellen door naar volgende url te surfen: <a href="${process.env.BASE_URL}/herstel-wachtwoord/${user.resetToken}">${process.env.BASE_URL}/herstel-wachtwoord/${user.resetToken}</a>`
                        })
                        mail.send()

                        res.status(200).json("")
                    }
                })
            }            
        }
    })
}

exports.editUser = (req, res) => {
    if (req.user.role === 'admin') {
        let user = new User(req.body)
        User.findByIdAndUpdate(user._id, user, { upsert: true }, function (err, savedUser) {
            if (err) console.log(err)
            else res.status(200).json(user)
        })
    } else {
        return res.status(401).send('Unauthorized request')
    }
}

exports.removeUser = (req, res) => {
    if (req.user.role === 'admin') {
        User.deleteOne({ _id: req.params.userId }, (err, user) => {
            if (err) console.log(err)
            else {
                res.json(user)
            }
        })
    } else {
        return res.status(401).send('Unauthorized request')
    }
}