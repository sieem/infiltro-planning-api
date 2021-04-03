import { config } from 'dotenv';;
import { execSync } from 'child_process';
import NodeSSH from 'node-ssh';

(async () => {
    const ssh = new NodeSSH();
    config();

    try {

        await ssh.connect({
            host: 'planning.infiltro.be',
            username: 'root',
            password: process.env.PASSWORD_SSH
        });


        if (process.argv.indexOf('frontend') !== -1 || process.argv.indexOf('f') !== -1) {
            console.log('deploying frontend')
            await frontendDeploy()
        }

        if (process.argv.indexOf('backend') !== -1 || process.argv.indexOf('b') !== -1) {
            console.log('deploying backend')
            await backendDeploy()
        }

        if (process.argv.indexOf('frontend') === -1 && process.argv.indexOf('backend') === -1 && process.argv.indexOf('f') === -1 && process.argv.indexOf('b') === -1) {
            console.log('deploying frontend and backend')
            await frontendDeploy()
            await backendDeploy()
        }
    } catch (error) {
        console.log(error)
    }

    process.exit();


    async function frontendDeploy() {
        // build angular
        const stdout = await execSync(`cd ${__dirname}/../../infiltro-planning && npm run build`);

        console.log(`ng build: ${stdout}`);

        console.log(await ssh.exec('rm *.js *.css', [], { cwd: '/root/infiltro-planning/dist', stream: 'stdout' }));

        // delay(5000);
        // return;

        const failed = [];
        const successful = [];

        const status = await ssh.putDirectory('../infiltro-planning/dist', '/root/infiltro-planning/dist', {
            recursive: true,
            concurrency: 10,
            tick: (localPath, remotePath, error) => (error) ? failed.push(localPath) : successful.push(localPath)
        })

        console.log('the directory transfer was', status ? 'successful' : 'unsuccessful');
        // console.log('successful transfers', successful);
        console.log('failed transfers', failed);
    }

    async function backendDeploy() {

        // build typescript
        const stdout = await execSync(`npm run build`);

        console.log(`build: ${stdout}`);

        const failed = [];
        const successful = [];

        const status = await ssh.putDirectory('./dist', '/root/infiltro-planning-api', {
            recursive: true,
            concurrency: 10,
            tick: (localPath, remotePath, error) => (error) ? failed.push(localPath) : successful.push(localPath)
        })

        console.log('the directory transfer was', status ? 'successful' : 'unsuccessful');
        // console.log('successful transfers', successful);
        console.log('failed transfers', failed);

        try {
            console.log(await ssh.exec('pm2 restart server', [], { cwd: '/root/infiltro-planning-api', stream: 'stdout' }));
        }
        catch (error) {
            console.log(error);
        }
    }
})();