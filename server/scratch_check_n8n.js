const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const os = require('os');

const dbPath = path.join(os.homedir(), '.n8n', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log('Tables:', tables.map(t => t.name));

  db.all("SELECT * FROM execution_data ORDER BY executionId DESC LIMIT 1", (err, rows) => {
    if (err) {
      console.error(err);
    } else {
      console.log('Execution data:', rows);
    }
    db.close();
  });
});
