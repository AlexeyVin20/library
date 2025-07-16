const fs = require('fs');
const path = require('path');

const possiblePaths = [
  '/etc/root/library/main.json',
  '/main.json',
  '/Synapse/main.json',
  'main.json',
];
const envLocalPath = path.resolve(process.cwd(), '.env.local');

let mainJsonPath = null;

for (const p of possiblePaths) {
  if (fs.existsSync(p)) {
    mainJsonPath = p;
    break;
  }
}

if (!mainJsonPath) {
  console.warn(`[load-env] Warning: Configuration file not found in any of the following locations: ${possiblePaths.join(', ')}`);
  console.warn(`[load-env] Skipping .env.local creation. Please ensure environment variables are set manually if needed.`);
  process.exit(0);
}

console.log(`[load-env] Reading configuration from ${mainJsonPath}`);

try {
  const mainJsonContent = fs.readFileSync(mainJsonPath, 'utf8');
  const config = JSON.parse(mainJsonContent);

  const envContent = Object.entries(config)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  fs.writeFileSync(envLocalPath, envContent);

  console.log(`[load-env] Successfully created .env.local file from ${mainJsonPath}`);
} catch (error) {
  console.error('[load-env] Error processing configuration file:', error);
  process.exit(1);
} 
