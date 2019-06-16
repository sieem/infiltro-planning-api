const nodemailer = require("nodemailer");

module.exports = class Mail {
    constructor(mailData) {
        this.mailData = mailData
    }

    async init() {

        let mailConfig;
        if (process.env.NODE_ENV === 'production') {
            // all emails are delivered to destination
            mailConfig = {
                host: 'mail.infiltro.be',
                port: 465,
                auth: {
                    user: process.env.MAILSERVER_USER,
                    pass: process.env.MAILSERVER_PASS
                },
                tls: {
                    rejectUnauthorized: false
                }
            }
        } else {
            // all emails are catched by ethereal.email

            let testAccount = await nodemailer.createTestAccount()

            mailConfig = {
                host: 'smtp.ethereal.email',
                port: 587,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass
                }
            }
        }

        this.transporter = await nodemailer.createTransport(mailConfig)
    }

    async send() {
        if(!this.transporter) {
            await this.init()
        }

        let info = await this.transporter.sendMail(this.mailData)

        console.log("Message sent: %s", info.messageId)

        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info))

        return nodemailer.getTestMessageUrl(info)
    }
}