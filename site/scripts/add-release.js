#!/usr/bin/env node

import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'fs';
import { join, basename, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

function showUsage() {
  console.log(`
Usage: npm run add-release -- <version> <dmg-path> [options]

NOTE: The '--' after 'add-release' is required to pass arguments through npm!

Arguments:
  version       Version number (e.g., 1.0.0)
  dmg-path      Path to the .dmg file to add

Options:
  --changelog   Changelog text (in quotes)
  --date        Release date (defaults to today, format: YYYY-MM-DD)

Examples:
  npm run add-release -- 1.0.0 ~/Desktop/sniffly-1.0.0.dmg --changelog "Initial release"
  npm run add-release -- 1.2.0 ./sniffly.dmg --changelog "Bug fixes" --date 2025-11-10
  `);
}

function parseArgs(args) {
  if (args.length < 2) {
    showUsage();
    process.exit(1);
  }

  const version = args[0];
  const dmgPath = args[1];
  let changelog = '';
  let date = new Date().toISOString().split('T')[0];

  for (let i = 2; i < args.length; i++) {
    if (args[i] === '--changelog' && args[i + 1]) {
      changelog = args[i + 1];
      i++;
    } else if (args[i] === '--date' && args[i + 1]) {
      date = args[i + 1];
      i++;
    }
  }

  return { version, dmgPath, changelog, date };
}

function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    showUsage();
    process.exit(0);
  }

  const { version, dmgPath, changelog, date } = parseArgs(args);

  // Validate .dmg file exists
  if (!existsSync(dmgPath)) {
    console.error(`Error: File not found: ${dmgPath}`);
    process.exit(1);
  }

  if (!dmgPath.endsWith('.dmg')) {
    console.error('Error: File must be a .dmg file');
    process.exit(1);
  }

  // Read versions.json
  const versionsPath = join(projectRoot, 'versions.json');
  let versionsData;

  try {
    versionsData = JSON.parse(readFileSync(versionsPath, 'utf8'));
  } catch (error) {
    console.error('Error reading versions.json:', error.message);
    process.exit(1);
  }

  // Check if version already exists
  if (versionsData.versions.some(v => v.version === version)) {
    console.error(`Error: Version ${version} already exists`);
    process.exit(1);
  }

  // Create filename with version
  const filename = `sniffly-${version}.dmg`;
  const destPath = join(projectRoot, 'releases', filename);

  // Copy .dmg file
  try {
    copyFileSync(dmgPath, destPath);
    console.log(`✓ Copied ${basename(dmgPath)} to releases/${filename}`);
  } catch (error) {
    console.error('Error copying file:', error.message);
    process.exit(1);
  }

  // Add version entry
  const newVersion = {
    version,
    date,
    filename,
    changelog: changelog || 'No changelog provided'
  };

  versionsData.versions.push(newVersion);

  // Write updated versions.json
  try {
    writeFileSync(versionsPath, JSON.stringify(versionsData, null, 2) + '\n');
    console.log(`✓ Added version ${version} to versions.json`);
  } catch (error) {
    console.error('Error writing versions.json:', error.message);
    process.exit(1);
  }

  console.log('\n✓ Release added successfully!');
  console.log('\nNext steps:');
  console.log('  1. Run: npm run build');
  console.log('  2. Copy releases/ directory to server');
  console.log('  3. Deploy dist/ directory to /var/www/sniffly.musicsian.com/current');
}

main();
