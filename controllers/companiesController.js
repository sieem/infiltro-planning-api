const Company = require('../models/company')

exports.getCompanies = (req, res) => {
    Company.find({}, (err, companies) => {
        res.json(companies)
    })
}

exports.saveCompany = (req, res) => {
    let company = new Company(req.body)
    Company.findByIdAndUpdate(company._id, company, { upsert: true }, function (err, savedCompany) {
        if (err) console.log(err)
        else res.status(200).json(company)
    })
}

exports.removeCompany = (req, res) => {
    Company.deleteOne({ _id: req.params.companyId }, (err,company) => {
        if (err) console.log(err)
        else {
            res.json(company)
        }
    })
}