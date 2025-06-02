const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

console.log('Testing environment variables:');
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('PORT exists:', !!process.env.PORT);
console.log('NODE_ENV exists:', !!process.env.NODE_ENV);
console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);

// Print the current working directory and .env path for debugging
console.log('\nDebug information:');
console.log('Current working directory:', process.cwd());
console.log('Looking for .env at:', path.resolve(__dirname, '.env')); 