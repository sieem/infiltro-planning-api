const nodemailer = require("nodemailer");

module.exports = class Mail {
    constructor(mailData) {
        this.mailData = mailData
    }

    async init() {
        let testAccount = await nodemailer.createTestAccount()

        this.transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass
            }
        })
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