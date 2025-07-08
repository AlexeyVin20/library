const fs = require('fs');
const path = require('path');

const mainJsonPath = '/etc/config/library/main.json';
const envLocalPath = path.resolve(process.cwd(), '.env.local');

console.log(`[load-env] Reading configuration from ${mainJsonPath}`);

if (!fs.existsSync(mainJsonPath)) {
  console.warn(`[load-env] Warning: Configuration file not found at ${mainJsonPath}.`);
  console.warn(`[load-env] Skipping .env.local creation. Please ensure environment variables are set manually if needed.`);
  process.exit(0);
}

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
