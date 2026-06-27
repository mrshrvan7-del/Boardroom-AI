// build-wrapper.js
const { spawn } = require('child_process');

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { 
      stdio: 'inherit', 
      shell: true,
      env: { ...process.env }
    });
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command failed with exit code ${code}`));
    });
  });
}

async function main() {
  if (process.env.IN_OPEN_NEXT === 'true') {
    // We are inside OpenNext's compile loop. Run the actual Next.js build.
    console.log('--- [Recursion Shield] Running actual Next.js build ---');
    try {
      await runCommand('npx', ['next', 'build']);
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  } else {
    // We are at the root build level. Trigger OpenNext compiler with the safety flag.
    console.log('--- [Recursion Shield] Starting OpenNext build process ---');
    process.env.IN_OPEN_NEXT = 'true';
    try {
      await runCommand('npx', ['opennextjs-cloudflare', 'build', '--dangerouslyUseUnsupportedNextVersion']);
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  }
}

main();
