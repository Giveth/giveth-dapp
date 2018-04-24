const { fork, spawn } = require('child_process');
const process = require('process');

// main spawns 3 servers: testrpc, feathers, and dapp
// feathers-giveth is expected to have been locally cloned and installed at root level of dapp
function main() {

  // navigate to feathers folder inside dapp
  process.chdir('./feathers-giveth');

  // start testrpc and return testrpc process in callback
  const testrpc = startTestrpc(function (testrpc) {

    // run deploy script to deploy smart contracts
    runScript('./scripts/deploy.js', function (err) {
      
      if (err) throw err;

      // start feathers and return feathers process
      const feathers = startFeathers(function (feathers) {

        // go back to dapp directory
        process.chdir('..');

        // start dapp and return dapp process
        const dapp = startDapp(function (dapp) {

          // graceful shutdown
          process.on('SIGINT', () => {
            shutdown(testrpc, feathers, dapp, function () {
              "graceful shutdown complete"
            });
          });
        });
      });
    });

    // really no point in returning this process here
    // but felt this callback hell should return something
    return testrpc;
  })
}

// runs any js script, used to deploy contracts
function runScript(scriptPath, callback) {

    // keep track of whether callback has been invoked to prevent multiple invocations
    let invoked = false;

    const process = fork(scriptPath);

    // listen for errors as they may prevent the exit event from firing
    process.on('error', function (err) {
        if (invoked) return;
        invoked = true;
        callback(err);
    });

    // execute the callback once the process has finished running
    process.on('exit', function (code) {
        if (invoked) return;
        invoked = true;
        const err = code === 0 ? null : new Error('exit code ' + code);
        callback(err);
    });

}

// start installed testrpc version with websockets
function startTestrpc(callback) {

  const testrpc = spawn('npm', ['run-script', 'testrpc']);

  testrpc.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });

  testrpc.stderr.on('data', (data) => {
    console.log(`stderr: ${data}`);
  });

  testrpc.on('close', (code, signal) => {
    console.log(`child process terminated due to receipt of signal ${signal}`);
  });

  setTimeout(function(){ callback(testrpc); }, 3000);

  return testrpc
}

// start localhost feathersjs cache server
function startFeathers(callback) {

  const feathers = spawn('npm', ['run-script', 'start']);

  feathers.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });

  feathers.stderr.on('data', (data) => {
    console.log(`stderr: ${data}`);
  });

  feathers.on('close', (code, signal) => {
    console.log(`child process terminated due to receipt of signal ${signal}`);
  });

  setTimeout(function(){ callback(feathers); }, 3000);

  return feathers;
}

// start dapp
function startDapp(callback) {

  const dapp = spawn('npm', ['run-script', 'start']);

  dapp.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });

  dapp.stderr.on('data', (data) => {
    console.log(`stderr: ${data}`);
  });

  dapp.on('close', (code, signal) => {
    console.log(`child process terminated due to receipt of signal ${signal}`);
  });

  callback(dapp);

  return dapp;
}


// shudown all 3 servers
function shutdown(testrpc, feathers, dapp, callback) {

  testrpc.on('close', (code, signal) => {
    console.log('testrpc closed');
    process.exit();
  });

  feathers.on('close', (code, signal) => {
    console.log('feathers closed');
    testrpc.kill('SIGHUP');
  });

  feathers.kill('SIGHUP');

  dapp.on('close', (code, signal) => {
    console.log('dapp closed');
    process.exit();
  });

  callback()
}

// run main
main()