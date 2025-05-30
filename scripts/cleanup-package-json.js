import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to package.json
const packageJsonPath = path.join(__dirname, '../package.json');

// Read and parse package.json
const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Remove duplicate dependencies
const uniqueDeps = {};
const dependencies = {};

// Process dependencies
for (const [key, value] of Object.entries(pkg.dependencies)) {
  if (!uniqueDeps[key]) {
    uniqueDeps[key] = value;
    dependencies[key] = value;
  }
}

// Add required dependencies if they don't exist
dependencies['@supabase/node-fetch'] = '^2.6.12';
dependencies['cross-fetch'] = '^4.0.0';
dependencies['node-fetch'] = '^2.7.0';

// Update the dependencies
pkg.dependencies = dependencies;

// Write the cleaned package.json back to disk
fs.writeFileSync(
  packageJsonPath,
  JSON.stringify(pkg, null, 2) + '\n',
  'utf8'
);

console.log('✅ package.json has been cleaned and updated');
