const nodemailer = require("nodemailer");

interface Signature {
    text: String,
    html: String,
}

export default class Mail {
    private mailData: any;
    private personalSignatures: {
        david: Signature,
        roel: Signature,
        default: Signature,
    }
    private transporter: any;

    constructor(mailData) {
        this.mailData = mailData
        
        this.personalSignatures = {
            david: {
                text: "\nDavid Lasseel\nM: +32 (0) 498 92 49 42\nwww.infiltro.be",
                html: `
                    <p>David Lasseel<br>
                    M: +32 (0) 498 92 49 42<br>
                    <img src="${process.env.BASE_URL}/assets/images/infiltro_mail.png" alt="infiltro logo" width="200" height="48" /><br>
                    <a href="https://www.infiltro.be">www.infiltro.be</a>
                    </p>
                `
            },
            roel: {
                text: "\nRoel Berghman\nM: +32 (0) 474 950 713\nwww.infiltro.be",
                html: `
                    <p>Roel Berghman<br>
                    M: +32 (0) 474 950 713<br>
                    <img src="${process.env.BASE_URL}/assets/images/infiltro_mail.png" alt="infiltro logo" width="200" height="48" /><br>
                    <a href="https://www.infiltro.be">www.infiltro.be</a>
                    </p>
                `
            },
            default: {
                text: "\nInfiltro\nM: +32 (0) 498 92 49 42\nwww.infiltro.be",
                html: `
                    <p>Infiltro<br>
                    M: +32 (0) 498 92 49 42<br>
                    <img src="${process.env.BASE_URL}/assets/images/infiltro_mail.png" alt="infiltro logo" width="200" height="48" /><br>
                    <a href="https://www.infiltro.be">www.infiltro.be</a>
                    </p>
                `
            }
        }
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
        
        if (this.mailData.personalSignature) {
            try {
                this.mailData.text += this.personalSignatures[this.mailData.user].text
                this.mailData.html += this.personalSignatures[this.mailData.user].html
            } catch {
                this.mailData.text += this.personalSignatures['default'].text
                this.mailData.html += this.personalSignatures['default'].html
            }
        }

        let info = await this.transporter.sendMail(this.mailData)

        console.log("Message sent: %s", info.messageId)

        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info))

        return nodemailer.getTestMessageUrl(info)
    }

    getHtml() {
        return this.mailData.html
    }
}