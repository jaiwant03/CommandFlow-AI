const mongoose = require('mongoose');
const dns = require('dns');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const LOCAL_URI = 'mongodb://127.0.0.1:27017/commandflow_ai';
const ATLAS_URI = process.env.MONGO_URI;

// Use public DNS for Atlas SRV resolution
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {}

async function migrate() {
  console.log('========================================================');
  console.log('[Migration] Migrating MongoDB Compass (Local) -> MongoDB Atlas');
  console.log('========================================================');

  if (!ATLAS_URI || !ATLAS_URI.includes('mongodb.net')) {
    console.error('Error: MONGO_URI in .env is not pointing to MongoDB Atlas!');
    process.exit(1);
  }

  // 1. Connect to Local MongoDB
  console.log('\n[1/4] Connecting to Local MongoDB (Compass)...');
  const localConn = await mongoose.createConnection(LOCAL_URI, {
    serverSelectionTimeoutMS: 5000
  }).asPromise();
  console.log(' Connected to Local MongoDB successfully.');

  // 2. Connect to Atlas
  console.log('\n[2/4] Connecting to MongoDB Atlas...');
  const atlasConn = await mongoose.createConnection(ATLAS_URI, {
    serverSelectionTimeoutMS: 15000,
    family: 4
  }).asPromise();
  console.log(` Connected to MongoDB Atlas host: ${atlasConn.host} (DB: ${atlasConn.name})`);

  // 3. Migrate Collections
  console.log('\n[3/4] Transferring collections & documents...');
  const localDb = localConn.db;
  const atlasDb = atlasConn.db;

  const collections = await localDb.listCollections().toArray();
  const summary = [];

  for (const col of collections) {
    const colName = col.name;
    if (colName.startsWith('system.') || colName === 'connectiontests') continue;

    const localDocs = await localDb.collection(colName).find().toArray();
    console.log(`\n  Checking collection: "${colName}" (${localDocs.length} documents in local DB)`);

    if (localDocs.length === 0) {
      summary.push({ collection: colName, localCount: 0, atlasCount: 0, status: 'Empty' });
      continue;
    }

    let migrated = 0;
    const atlasCol = atlasDb.collection(colName);

    for (const doc of localDocs) {
      await atlasCol.replaceOne({ _id: doc._id }, doc, { upsert: true });
      migrated++;
    }

    // Copy indexes if any
    try {
      const indexes = await localDb.collection(colName).indexes();
      for (const idx of indexes) {
        if (idx.name === '_id_') continue;
        const keys = idx.key;
        const options = { name: idx.name };
        if (idx.unique) options.unique = true;
        if (idx.sparse) options.sparse = true;
        await atlasCol.createIndex(keys, options).catch(() => {});
      }
    } catch (idxErr) {
      // index sync optional
    }

    const currentAtlasCount = await atlasCol.countDocuments();
    console.log(`  -> Migrated ${migrated} documents. Atlas count is now: ${currentAtlasCount}`);
    summary.push({ collection: colName, localCount: localDocs.length, atlasCount: currentAtlasCount, status: 'Migrated' });
  }

  // 4. Verification
  console.log('\n[4/4] Verification Summary:');
  console.table(summary);

  await localConn.close();
  await atlasConn.close();
  console.log('\n[Migration Complete] All data from MongoDB Compass is now synced to MongoDB Atlas!');
}

migrate().catch(err => {
  console.error('\n[Migration Failed]:', err);
  process.exit(1);
});
