const testData = {
  email: "test@example.com",
  password: "password123",
  firstName: "Juan",
  lastName: "Pérez",
  birthDay: 15,
  birthMonth: 8,
  birthYear: 1990,
  weight: 70.5,
  height: 175,
  glucoseProfile: "normal"
};

console.log('Test registration data:');
console.log(JSON.stringify(testData, null, 2));

// Test validation logic
function testValidation(data) {
  const validationErrors = [];
  
  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email) {
    validationErrors.push('Email is required');
  } else if (!emailRegex.test(data.email)) {
    validationErrors.push('Please provide a valid email address');
  }
  
  // Password validation
  if (!data.password) {
    validationErrors.push('Password is required');
  } else if (data.password.length < 6 || !/[a-zA-Z]/.test(data.password) || !/\d/.test(data.password)) {
    validationErrors.push('Password must be at least 6 characters long and contain at least one letter and one number');
  }
  
  // Name validation
  const nameRegex = /^[a-zA-ZÀ-ÿ\s'-]+$/;
  if (!data.firstName || data.firstName.trim().length < 2 || !nameRegex.test(data.firstName.trim())) {
    validationErrors.push('First name must be at least 2 characters long and contain only letters, spaces, hyphens, and apostrophes');
  }
  
  if (!data.lastName || data.lastName.trim().length < 2 || !nameRegex.test(data.lastName.trim())) {
    validationErrors.push('Last name must be at least 2 characters long and contain only letters, spaces, hyphens, and apostrophes');
  }
  
  // Date validation
  if (!Number.isInteger(Number(data.birthDay)) || !Number.isInteger(Number(data.birthMonth)) || !Number.isInteger(Number(data.birthYear))) {
    validationErrors.push('Birth date must be valid integers');
  } else {
    const day = Number(data.birthDay);
    const month = Number(data.birthMonth);
    const year = Number(data.birthYear);
    
    const currentYear = new Date().getFullYear();
    const currentDate = new Date();
    
    if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > currentYear) {
      validationErrors.push('Please provide a valid birth date');
    }
    
    const inputDate = new Date(year, month - 1, day);
    if (inputDate > currentDate || inputDate.getDate() !== day || inputDate.getMonth() !== month - 1 || inputDate.getFullYear() !== year) {
      validationErrors.push('Please provide a valid birth date');
    }
  }
  
  // Weight and height validation
  if (isNaN(Number(data.weight)) || Number(data.weight) <= 0 || Number(data.weight) > 1000) {
    validationErrors.push('Weight must be between 0.1 and 1000 kg');
  }
  
  if (isNaN(Number(data.height)) || Number(data.height) <= 0 || Number(data.height) > 300) {
    validationErrors.push('Height must be between 0.1 and 300 cm');
  }
  
  // Glucose profile validation
  if (!data.glucoseProfile || !['hypo', 'normal', 'hyper'].includes(data.glucoseProfile.toLowerCase())) {
    validationErrors.push('Glucose profile must be one of: hypo, normal, hyper');
  }
  
  return validationErrors;
}

const errors = testValidation(testData);
console.log('\nValidation result:');
if (errors.length === 0) {
  console.log('✅ All validations passed');
} else {
  console.log('❌ Validation errors:');
  errors.forEach(error => console.log('  -', error));
}
