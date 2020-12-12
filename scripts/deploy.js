(async () => {
    require('dotenv').config();
    const { execSync } = require('child_process');
    const node_ssh = require('node-ssh');
    const ssh = new node_ssh();

    try {

        await ssh.connect({
            host: 'planning.infiltro.be',
            username: 'root',
            password: process.env.PASSWORD_SSH
        });


        if (process.argv.indexOf('frontend') !== -1 || process.argv.indexOf('f') !== -1) {
            console.log('deploying frontend')
            await frontenDeploy()
        }

        if (process.argv.indexOf('backend') !== -1 || process.argv.indexOf('b') !== -1) {
            console.log('deploying backend')
            await backendDeploy()
        }

        if (process.argv.indexOf('frontend') === -1 && process.argv.indexOf('backend') === -1 && process.argv.indexOf('f') === -1 && process.argv.indexOf('b') === -1) {
            console.log('deploying frontend and backend')
            await frontenDeploy()
            await backendDeploy()
        }
    } catch (error) {
        console.log(error)
    }

    process.exit();


    async function frontenDeploy() {
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
        // Update backend
        console.log('git pull:', await ssh.exec('git pull', [], { cwd: '/root/infiltro-planning-api', stream: 'stdout' }));
        try {
            console.log('npm i:', await ssh.exec('npm i', [], { cwd: '/root/infiltro-planning-api', stream: 'stdout' }));
        } catch (error) {
            console.error(error)
        }
        console.log(await ssh.exec('pm2 restart server', [], { cwd: '/root/infiltro-planning-api', stream: 'stdout' }));
    }

    function delay(ms) {
        console.log(`delaying operation with ${ms}ms`)
        return new Promise(resolve => setTimeout(resolve, ms))
    }
})();