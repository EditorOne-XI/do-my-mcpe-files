import { basename } from 'path';

function validatePackGroup(filePaths) {
  const regex = /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.(json|mc|jpeg)$/;
  
  const uuidMap = new Map();

  for (const filePath of filePaths) {
    const fileName = basename(filePath);
    const match = fileName.match(regex);

    if (match) {
      console.log(match);
      const [_, uuid, ext] = match;

      if (!uuidMap.has(uuid)) {
        uuidMap.set(uuid, new Set());
      }

      const extSet = uuidMap.get(uuid);
      extSet.add(ext.toLowerCase());

      if (extSet.size === 3) {
        console.log(`Found group with ${uuid}`);
        return true; 
      }
    }
  }

  console.error("No group found.");
  return false;
}

const files = [
  "4a5b6c7d-8e9f-0a1b-2c3d-4e5f6a7b8c9d.json",
  "123e4567-e89b-12d3-a456-426614174000.json",
  "123e4567-e89b-12d3-a456-426614174000.mc",
  "4a5b6c7d-8e9f-0a1b-2c3d-4e5f6a7b8c9d.jpeg",
  "123e4567-e89b-12d3-a456-426614174000.jpeg"
];

console.log(validatePackGroup(files));
