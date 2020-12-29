import { config } from 'dotenv';
import express from 'express';
import { connect, set } from 'mongoose';
import cors from 'cors';
import compression from 'compression';
import * as path from 'path';
import * as http from 'http';
import * as https from 'https';
import * as fs from 'fs';
import cookieParser from 'cookie-parser';
import { router } from './routes';

config();

const app = express()
const db = process.env.NODE_ENV === 'development'
    ? `mongodb://localhost/${process.env.MONGODB_DB}`
    : `mongodb://${process.env.MONGODB_USER}:${process.env.MONGODB_PASS}@localhost:27017/${process.env.MONGODB_DB}`;
const staticRoot = '../infiltro-planning/dist/'

app.use(express.json())
app.use(cors())
app.use(cookieParser())
app.use(compression())

connect(db, { useNewUrlParser: true }, err => {
    if (err) console.log(err)
    else {
        console.log('connected to mongodb')
    }
})

set('useFindAndModify', false)

app.use('/api', router);

app.use(function (req, res, next) {
    //if the request is not html then move along
    var accept = req.accepts('html', 'json', 'xml');
    if (accept !== 'html') {
        return next();
    }

    // if the request has a '.' assume that it's for a file, move along
    var ext = path.extname(req.path);
    if (ext !== '') {
        return next();
    }

    fs.createReadStream(staticRoot + 'index.html').pipe(res);

});

app.use(express.static(staticRoot, { dotfiles: 'allow' } ));

//starting up the server
if (process.env.NODE_ENV == "production") {
    // Certificate
    const privateKey = fs.readFileSync('/etc/letsencrypt/live/planning.infiltro.be/privkey.pem', 'utf8');
    const certificate = fs.readFileSync('/etc/letsencrypt/live/planning.infiltro.be/cert.pem', 'utf8');
    const ca = fs.readFileSync('/etc/letsencrypt/live/planning.infiltro.be/chain.pem', 'utf8');

    const credentials = {
        key: privateKey,
        cert: certificate,
        ca: ca
    };

    const httpsServer = https.createServer(credentials, app);
    try {
        httpsServer.listen(process.env.PORT, () => {
            console.log(`App listening on port ${httpsServer.address()} SSL`);
        });
    } catch (error) {
        console.error(error);
    }

    // setting redirect for non http traffic
    http.createServer(function (req, res) {
        res.writeHead(301, { Location: `https://${req.headers.host}${req.url}` });
        res.end();
    }).listen(80);
}
else if (process.env.NODE_ENV == "development") {
    const httpServer = http.createServer(app);
    try {
        httpServer.listen(process.env.PORT || 3000, () => {
            console.log(`App listening on port ${httpServer.address()} Non-SSL`);
        });
    } catch (error) {
        console.error(error);
    }
}
else {
    throw new Error("No NODE_ENV defined, perhaps run npm start of npm run dev?");
}