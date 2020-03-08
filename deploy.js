(async () => {
    require('dotenv').config();
    const { execSync } = require('child_process');
    const node_ssh = require('node-ssh');
    const ssh = new node_ssh();

    try {
        // build angular
        const stdout = await execSync('cd ../infiltro-planning && npm run build');

        console.log(`ng build: ${stdout}`);

        await ssh.connect({
            host: 'planning.infiltro.be',
            username: 'root',
            password: process.env.PASSWORD_SSH
        });

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


        // Update backend
        console.log('git pull:', await ssh.exec('git pull', [], { cwd: '/root/infiltro-planning-api', stream: 'stdout' }));
        console.log('npm ci:', await ssh.exec('npm i', [], { cwd: '/root/infiltro-planning-api', stream: 'stdout' }));
        console.log(await ssh.exec('pm2 restart server', [], { cwd: '/root/infiltro-planning-api', stream: 'stdout' }));
        

    } catch (error) {
        console.log(error)
    }

    process.exit();


    function delay(ms) {
        console.log(`delaying operation with ${ms}ms`)
        return new Promise(resolve => setTimeout(resolve, ms))
    }
})();