const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const file = 'public/uploads/profiles/6a7a1a684959ef134f79721d-19c7e7f4-210a-4aee-8775-774dc294325e.jpg';
  if (fs.existsSync(file)) {
    const buf = fs.readFileSync(file);
    const b64 = 'data:image/jpeg;base64,' + buf.toString('base64');
    const res = await mongoose.connection.collection('users').updateOne(
      { _id: new mongoose.Types.ObjectId('6a7a1a684959ef134f79721d') },
      { $set: { avatar: b64 } }
    );
    console.log('Successfully updated user avatar to base64 Data URL! Matched:', res.matchedCount, 'Modified:', res.modifiedCount);
  } else {
    console.log('File not found:', file);
  }
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
