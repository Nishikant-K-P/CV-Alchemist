const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Setting up CV Alchemist project...');

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  console.log('Creating data directory...');
  fs.mkdirSync(dataDir, { recursive: true });
}

// Check if template files exist, if not prompt user
const candidateProfilePath = path.join(dataDir, 'candidate_profile.txt');
const resumeTemplatePath = path.join(dataDir, 'resume_template.txt');

if (!fs.existsSync(candidateProfilePath)) {
  console.log('\x1b[33mWarning: candidate_profile.txt not found in data directory.\x1b[0m');
  console.log('Make sure to create this file before using the resume generator.');
}

if (!fs.existsSync(resumeTemplatePath)) {
  console.log('\x1b[33mWarning: resume_template.txt not found in data directory.\x1b[0m');
  console.log('Make sure to create this file before using the resume generator.');
}

// Check if .env.local exists, if not create a template
const envPath = path.join(__dirname, '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('Creating .env.local template...');
  fs.writeFileSync(envPath, 
    'GOOGLE_API_KEY=your_google_api_key_here\n' +
    'GROQ_API_KEY=your_groq_api_key_here\n'
  );
  console.log('\x1b[33mPlease update .env.local with your actual API keys.\x1b[0m');
}

// Install dependencies
console.log('Installing dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('\x1b[32mDependencies installed successfully!\x1b[0m');
} catch (error) {
  console.error('\x1b[31mError installing dependencies:\x1b[0m', error.message);
  process.exit(1);
}

console.log('\n\x1b[32mSetup complete!\x1b[0m');
console.log('\nTo start the development server:');
console.log('  npm run dev');
console.log('\nMake sure you have:');
console.log('1. Updated .env.local with your API keys');
console.log('2. Created the required template files in the data directory');
