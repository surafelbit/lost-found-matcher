import pool from './src/db.js';

pool.query("ALTER TABLE messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE")
  .then(() => {
    console.log('Added read_at column');
    process.exit(0);
  })
  .catch(e => {
    console.error('Error', e);
    process.exit(1);
  });
