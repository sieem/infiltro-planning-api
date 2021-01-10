import Project from '../models/project';
import mailService from '../services/mailService';

export const sendProjectMail = async (req, res) => {
    if (req.user.role === 'admin') {
        const mailForm = req.body
        const htmlMailBody = mailForm.body.replace(/\n/g, "<br>")
        const foundProject: any = await Project.findById(mailForm._id).exec()

        const mailDetails = {
            david: {
                name: "David Lasseel",
                email: "david@infiltro.be"
            },
            roel: {
                name: "Roel Berghman",
                email: "roel@infiltro.be"
            },
            default: {
                name: "Infiltro",
                email: "info@infiltro.be"
            }
        }

        let replyTo = '';

        try {
            replyTo = `"${mailDetails[foundProject.executor].name}" <${mailDetails[foundProject.executor].email}>`
        } catch (error) {
            replyTo = `"${mailDetails['default'].name}" <${mailDetails['default'].email}>`
        }

        //send mail
        const mail = new mailService({
            from: '"Infiltro" <planning@infiltro.be>',
            replyTo,
            bcc: 'info@infiltro.be',
            to: mailForm.receiver,
            cc: mailForm.cc,
            subject: mailForm.subject,
            text: mailForm.body,
            html: htmlMailBody,
            personalSignature: true,
            user: foundProject.executor
        })
        await mail.send()

        const mailObject = {
            sender: req.user._id,
            receiver: mailForm.receiver,
            cc: mailForm.cc,
            subject: mailForm.subject,
            dateSent: new Date(),
            body: mail.getHtml()
        }

        // save mail intro database
        Project.updateOne({ _id: mailForm._id }, {
            $push: { mails: mailObject }
        }, function (err, affected, resp) {
            if (err) {
                console.error(err)
                return res.status(400).json(err.message)
            }
            else res.json({})
        })

    } else {
        return res.status(401).send('Unauthorized request')
    }
}