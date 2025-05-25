#!/usr/bin/env node

/**
 * Script check for definitions exist and type definitions contain the expected exports.
 */

const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
const expectedFiles = [
    'index.d.ts',
    'handwritten-graph.js'
];

console.log('🔍 Validating type definitions...');

// We are expecting the dist directory
if (!fs.existsSync(distDir)) {
    console.error('❌ Dist directory does not exist. Run npm run build first.');
    process.exit(1);
}

// Check if all expected files exist in the dist directory
let allFilesExist = true;
expectedFiles.forEach(file => {
    const filePath = path.join(distDir, file);
    if (!fs.existsSync(filePath)) {
        console.error(`❌ Missing file: ${file}`);
        allFilesExist = false;
    } else {
        console.log(`✅ Found: ${file}`);
    }
});

if (!allFilesExist) {
    console.error('❌ Some required files are missing.');
    process.exit(1);
}

// Check if index.d.ts exists and contains the expected exports
const indexDtsPath = path.join(distDir, 'index.d.ts');
if (!fs.existsSync(indexDtsPath)) {
    console.error('❌ index.d.ts not found');
    process.exit(1);
}

const indexDtsContent = fs.readFileSync(indexDtsPath, 'utf8');

// Checking for chart exports in index.d.ts
console.log('🔍 Validating exports in index.d.ts...');
const requiredExports = [
    'LineChart',
    'PieChart',
    'createGraph',
    'createPieChart'
];

let allExportsPresent = true;
requiredExports.forEach(exportName => {
    if (!indexDtsContent.includes(exportName)) {
        console.error(`❌ Missing export: ${exportName}`);
        allExportsPresent = false;
    } else {
        console.log(`✅ Export found: ${exportName}`);
    }
});

if (!allExportsPresent) {
    console.error('❌ Some required exports are missing from type definitions.');
    process.exit(1);
}

console.log('');
console.log('📋 Type Definition Summary:');
console.log(`   File size: ${fs.statSync(indexDtsPath).size} bytes`);
console.log(`   Lines: ${indexDtsContent.split('\n').length}`);
console.log('');
console.log('✅ All type definitions are valid!');
console.log('');
console.log('📦 Package is Ready for publishing!');