/**
 * Script to validate that the migration setup is correct
 * This checks the schema changes and validates the migration files
 */

'use strict';

const fs = require('fs');
const path = require('path');

function validateMigrationSetup() {
  console.log('Validating comment schema migration setup...');
  
  const errors = [];
  const warnings = [];

  // Check if schema.json has been updated
  const schemaPath = path.join(__dirname, '../src/api/comment/content-types/comment/schema.json');
  
  if (!fs.existsSync(schemaPath)) {
    errors.push('Comment schema.json file not found');
  } else {
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
    
    // Check if parentId field exists
    if (!schema.attributes.parentId) {
      errors.push('parentId field not found in comment schema');
    } else {
      const parentIdField = schema.attributes.parentId;
      if (parentIdField.type !== 'string') {
        errors.push('parentId field should be of type string');
      }
      if (parentIdField.maxLength !== 255) {
        warnings.push('parentId field maxLength should be 255');
      }
    }
    
    // Check if old relation fields are removed
    if (schema.attributes.parentComment) {
      errors.push('parentComment relation field should be removed from schema');
    }
    if (schema.attributes.replies) {
      errors.push('replies relation field should be removed from schema');
    }
    
    // Check if moderation fields are removed (simplified schema)
    if (schema.attributes.isApproved) {
      warnings.push('isApproved field found - consider removing for simplified schema');
    }
    if (schema.attributes.moderationStatus) {
      warnings.push('moderationStatus field found - consider removing for simplified schema');
    }
    if (schema.attributes.moderatedBy) {
      warnings.push('moderatedBy field found - consider removing for simplified schema');
    }
    
    // Check if isInappropriate field exists
    if (!schema.attributes.isInappropriate) {
      warnings.push('isInappropriate field not found - should be added for simplified flagging');
    }
  }

  // Check if migration file exists
  const migrationPath = path.join(__dirname, '../database/migrations/2024.10.13T00.00.00.comment-schema-migration.js');
  if (!fs.existsSync(migrationPath)) {
    errors.push('Migration file not found');
  }

  // Check if validation file exists
  const validationPath = path.join(__dirname, '../src/api/comment/services/comment-validation.js');
  if (!fs.existsSync(validationPath)) {
    errors.push('Comment validation file not found');
  }

  // Check if migration runner exists
  const runnerPath = path.join(__dirname, 'run-comment-migration.js');
  if (!fs.existsSync(runnerPath)) {
    errors.push('Migration runner script not found');
  }

  // Report results
  console.log('\n=== Validation Results ===');
  
  if (errors.length === 0) {
    console.log('✅ All required files and configurations are present');
  } else {
    console.log('❌ Errors found:');
    errors.forEach(error => console.log(`  - ${error}`));
  }

  if (warnings.length > 0) {
    console.log('⚠️  Warnings:');
    warnings.forEach(warning => console.log(`  - ${warning}`));
  }

  console.log('\n=== Next Steps ===');
  console.log('1. Review the schema changes in comment/schema.json');
  console.log('2. Test the migration in a development environment first');
  console.log('3. Run: node scripts/run-comment-migration.js up');
  console.log('4. Validate data integrity after migration');
  console.log('5. Update your application code to use parentId field');

  return errors.length === 0;
}

// Run validation
const isValid = validateMigrationSetup();
process.exit(isValid ? 0 : 1);