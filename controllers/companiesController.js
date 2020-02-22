const Company = require('../models/company')

exports.getCompanies = (req, res) => {
    let findParameters = (req.user.role === 'admin')? {}: { _id: req.user.company }

    Company.find(findParameters, (err, companies) => {
        if (err) {
            console.error(err)
            return res.status(400).json(err.message)
        }
        else res.status(200).json(companies)
    })
}

exports.saveCompany = (req, res) => {
    if (req.user.role === 'admin') {
        let company = new Company(req.body)
        Company.findByIdAndUpdate(company._id, company, { upsert: true }, function (err, savedCompany) {
            if (err) {
                console.error(err)
                return res.status(400).json(err.message)
            }
            else res.status(200).json(company)
        })
    } else {
        return res.status(401).send('Unauthorized request')
    }
}

exports.removeCompany = (req, res) => {
    if (req.user.role === 'admin') {
        Company.deleteOne({ _id: req.params.companyId }, (err, company) => {
            if (err) {
                console.error(err)
                return res.status(400).json(err.message)
            }

            return res.json(company)
        })
    } else {
        return res.status(401).send('Unauthorized request')
    }
}