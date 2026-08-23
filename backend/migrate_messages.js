import pool from './src/db.js';

const sql = `
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  lost_report_id INTEGER REFERENCES reports(id) ON DELETE CASCADE,
  found_report_id INTEGER REFERENCES reports(id) ON DELETE CASCADE,
  sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_messages_lost_found ON messages(lost_report_id, found_report_id);
`;

pool.query(sql)
  .then(() => {
    console.log('Messages table created successfully.');
    process.exit(0);
  })
  .catch((e) => {
    console.error('Error creating messages table:', e);
    process.exit(1);
  });
