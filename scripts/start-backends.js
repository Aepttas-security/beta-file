const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '..');
const backendDir = path.join(rootDir, 'backend');

const services = [
  {
    name: 'Malware APK Scanner Backend (Port 8001)',
    dir: path.join(backendDir, 'malware'),
    cmd: 'node',
    args: ['server_mal.js'],
    port: 8001,
  },
  {
    name: 'Vulnerability Backend (Port 8000)',
    dir: path.join(backendDir, 'vulnerability'),
    cmd: 'python',
    args: ['run_server.py'],
    port: 8000,
  },
  {
    name: 'PostgreSQL Auth Server (Port 8002)',
    dir: path.join(rootDir, 'backend-reference'),
    cmd: 'python',
    args: ['run_postgres_auth_server.py'],
    port: 8002,
  },
];

console.log('====================================================');
console.log('🚀 Starting AepttasShield Microservice Backends...');
console.log('====================================================');

services.forEach((service) => {
  if (fs.existsSync(service.dir)) {
    try {
      const isWin = process.platform === 'win32';
      let child;
      if (isWin) {
        // On Windows, use start /b to spawn a truly independent background process
        const fullCmd = [service.cmd, ...service.args].join(' ');
        child = spawn('cmd.exe', ['/c', `start /b ${fullCmd}`], {
          cwd: service.dir,
          shell: true,
          detached: true,
          stdio: 'ignore',
          windowsHide: true,
        });
      } else {
        child = spawn(service.cmd, service.args, {
          cwd: service.dir,
          shell: false,
          detached: true,
          stdio: 'ignore',
        });
      }
      child.unref();

      console.log(`✅ Started [${service.name}] on port ${service.port}`);

      child.on('error', (err) => {
        console.warn(`⚠️ [${service.name}] notice: ${err.message}`);
      });
    } catch (e) {
      console.warn(`⚠️ Could not auto-start ${service.name}: ${e.message}`);
    }
  } else {
    console.log(`ℹ️ [${service.name}] directory not found at ${service.dir}, skipping.`);
  }
});

// Configure ADB reverse port forwarding for Android devices / emulators
try {
  const ports = [8000, 8001, 8002, 8003, 8081];
  ports.forEach((p) => {
    try {
      execSync(`adb reverse tcp:${p} tcp:${p}`, { stdio: 'ignore' });
    } catch {}
  });
  console.log('🔌 ADB reverse port forwarding configured for ports (8000, 8001, 8002, 8003, 8081)');
} catch (e) {
  // ADB not connected or not in PATH, non-critical
}

console.log('====================================================');
console.log('⚡ All available backends have been launched in background.');
console.log('====================================================\n');

