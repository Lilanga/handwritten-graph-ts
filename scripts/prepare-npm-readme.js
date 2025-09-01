#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const readmePath = path.join(__dirname, '..', 'README.md');
const npmReadmePath = path.join(__dirname, '..', 'dist', 'README.md');

try {
    // Read the original README
    const readmeContent = fs.readFileSync(readmePath, 'utf8');
    
    // Remove the Example section with images
    const cleanedContent = readmeContent
        .replace(/### Example[\s\S]*?(?=\n\*\*\[Complete API Documentation\])/g, '')
        .replace(/\n{3,}/g, '\n\n'); // Clean up extra newlines
    
    // Ensure dist directory exists
    const distDir = path.dirname(npmReadmePath);
    if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir, { recursive: true });
    }
    
    // Write the cleaned README
    fs.writeFileSync(npmReadmePath, cleanedContent);
    
    console.log('✅ Clean README created for npm package at dist/README.md');
} catch (error) {
    console.error('❌ Error creating clean README:', error.message);
    process.exit(1);
}