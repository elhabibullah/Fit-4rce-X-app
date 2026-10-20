const fs = require('fs');
const buf = fs.readFileSync('public/models/Spinning_coach_compressed.glb');
const chunkLength = buf.readUInt32LE(12);
const json = JSON.parse(buf.toString('utf8', 20, 20 + chunkLength));
console.log('Meshes count:', json.meshes?.length);
console.log('Primitives:', JSON.stringify(json.meshes?.[0]?.primitives));
console.log('Images:', JSON.stringify(json.images));
console.log('Materials:', JSON.stringify(json.materials));
