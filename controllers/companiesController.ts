import Company from '../models/company';

export const getCompanies = (req, res) => {
    const findParameters = (req.user.role === 'admin')? {}: { _id: req.user.company }

    Company.find(findParameters, (err, companies) => {
        if (err) {
            console.error(err)
            return res.status(400).json(err.message)
        }
        else res.status(200).json(companies)
    })
}

export const saveCompany = (req, res) => {
    if (req.user.role === 'admin') {
        const company = new Company(req.body)
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

export const removeCompany = async (req, res) => {
    if (req.user.role === 'admin') {
        try {
            Company.deleteOne({ _id: req.params.companyId }).exec();
            return res.json({ status: 'ok' });
        } catch (error) {
            console.error(error)
            return res.status(400).json(error.message)
        }
    } else {
        return res.status(401).send('Unauthorized request')
    }
}