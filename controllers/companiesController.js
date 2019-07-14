const Company = require('../models/company')

exports.getCompanies = (req, res) => {
    if (req.user.role === 'admin') {
        Company.find({}, (err, companies) => {
            res.json(companies)
        })
    } else {
        return res.status(401).send('Unauthorized request')
    }
}

exports.saveCompany = (req, res) => {
    if (req.user.role === 'admin') {
        let company = new Company(req.body)
        Company.findByIdAndUpdate(company._id, company, { upsert: true }, function (err, savedCompany) {
            if (err) console.log(err)
            else res.status(200).json(company)
        })
    } else {
        return res.status(401).send('Unauthorized request')
    }
}

exports.removeCompany = (req, res) => {
    if (req.user.role === 'admin') {
        Company.deleteOne({ _id: req.params.companyId }, (err, company) => {
            if (err) console.log(err)
            else {
                res.json(company)
            }
        })
    } else {
        return res.status(401).send('Unauthorized request')
    }
}