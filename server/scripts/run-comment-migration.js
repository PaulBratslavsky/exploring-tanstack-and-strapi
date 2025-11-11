/**
 * Script to run the comment schema migration
 * Usage: node scripts/run-comment-migration.js [up|down]
 */

'use strict';

const path = require('path');

async function runMigration(direction = 'up') {
  console.log(`Running comment migration: ${direction}`);
  
  try {
    // Initialize Strapi
    const Strapi = require('@strapi/strapi');
    const app = await Strapi().load();
    
    // Get database connection
    const knex = app.db.connection;
    
    // Load migration
    const migration = require('../database/migrations/2024.10.13T00.00.00.comment-schema-migration.js');
    
    if (direction === 'up') {
      await migration.up(knex, app);
      console.log('Migration completed successfully');
    } else if (direction === 'down') {
      await migration.down(knex, app);
      console.log('Migration rollback completed successfully');
    } else {
      throw new Error('Invalid direction. Use "up" or "down"');
    }
    
    // Close Strapi
    await app.destroy();
    process.exit(0);
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Get direction from command line arguments
const direction = process.argv[2] || 'up';
runMigration(direction);