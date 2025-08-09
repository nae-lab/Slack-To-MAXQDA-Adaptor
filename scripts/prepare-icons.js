const fs = require('fs');
const path = require('path');

// Ensure build directory exists
const buildDir = path.join(__dirname, '..', 'build');
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

// Copy icon from public to build directory
const sourceIcon = path.join(__dirname, '..', 'public', 'app-iconpng.png');
const destIcon = path.join(__dirname, '..', 'build', 'icon.png');

if (fs.existsSync(sourceIcon)) {
  fs.copyFileSync(sourceIcon, destIcon);
  console.log('Icon copied to build directory');
} else {
  console.error('Source icon not found:', sourceIcon);
  process.exit(1);
}