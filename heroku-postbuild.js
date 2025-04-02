console.log('Running Heroku postbuild script...');
console.log('Environment:', process.env.NODE_ENV);
console.log('Verifying file paths and module resolution...');

// List the files in the dist directory after build
const fs = require('fs');
const path = require('path');

function listFilesRecursively(dir, prefix = '') {
  if (!fs.existsSync(dir)) {
    console.log(`Directory does not exist: ${dir}`);
    return;
  }
  
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory()) {
      console.log(`${prefix}${file}/`);
      listFilesRecursively(filePath, `${prefix}  `);
    } else {
      console.log(`${prefix}${file}`);
    }
  });
}

console.log('Listing build output:');
listFilesRecursively('./dist');

console.log('Heroku postbuild script complete.');