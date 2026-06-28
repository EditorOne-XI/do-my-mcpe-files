const { argv, exit } = process;
const args = argv.slice(1);

if (args.length < 2) {
  console.log("uriTest.js: Usage: uriTest.js <string>");
  exit(2);
}
const string = args[1];

const encoded = encodeURIComponent(string);
console.log("encodeURIComponent: " + encoded);
console.log("");
console.log("decodeURIComponent: " + decodeURIComponent(encoded));

exit(0);

// {
import { existsSync, writeFileSync } from 'fs';
try {
  const data = new Uint8Array([
    0x00, 0x7F,
    0x51, 0x75, 0x69, 0x6C, 0x61, 0x6E, 0x74, 0x69, 0x61,
    0x00, 0x7F,
    0x49, 0x6D, 0x70, 0x6F, 0x72, 0x74,
    0x00, 0x7F,
    0x42, 0x75, 0x69, 0x6C, 0x64, 0x65, 0x72,
    0x00, 0x7F,
    0x2D,
    0x00, 0x7F,
    0x45, 0x64, 0x69, 0x74, 0x6F, 0x72, 0x4F, 0x6E, 0x65,
    0x00, 0x7F,
    0x31, 0x31,
    0x00, 0x7F
  ]);
  if (!existsSync("./.zqib")) {
    writeFileSync("./.zqib", data);
    console.log("Successfully created file!");
    process.exit(0);
  }
  else {
    console.error("File exists!");
    process.exit(1);
  }
} catch (err) {
  console.error(`Failed to write file: ${err.message}`);
  process.exit(1);
}

// Quilantia Import Builder - EditorOne 11
const data = "51 75 69 6C 61 6E 74 69 61 49 6D 70 6F 72 74 42 75 69 6C 64 65 72 2D 45 64 69 74 6F 72 4F 6E 65 31 31";

let dataArray = [];
data.split(' ').forEach(d => {
  dataArray.push(`0x${d}`);
});
console.log(dataArray.join(', '));
process.exit(0);
// }
