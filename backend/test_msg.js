import pool from './src/db.js';

pool.query("INSERT INTO messages (lost_report_id, found_report_id, sender_id, message) VALUES (1, 4, 1, 'test')")
  .then(() => {
    console.log('Inserted');
    process.exit(0);
  })
  .catch(e => {
    console.error('Error', e);
    process.exit(1);
  });
