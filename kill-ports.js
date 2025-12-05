const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function killPort(port) {
  try {
    const { stdout } = await execPromise(`netstat -ano | findstr :${port} | findstr LISTENING`);
    const lines = stdout.trim().split('\n');
    
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && !isNaN(pid)) {
        console.log(`Killing process ${pid} on port ${port}...`);
        try {
          await execPromise(`taskkill /F /PID ${pid}`);
          console.log(`✓ Process ${pid} killed successfully`);
        } catch (err) {
          // Process might already be dead, ignore
        }
      }
    }
  } catch (err) {
    // No process found on port, that's fine
  }
}

async function killAllPorts() {
  console.log('Freeing ports 5000 and 3000...');
  await killPort(5000);
  await killPort(3000);
  console.log('Done!\n');
}

killAllPorts().then(() => {
  process.exit(0);
}).catch(() => {
  process.exit(0);
});

