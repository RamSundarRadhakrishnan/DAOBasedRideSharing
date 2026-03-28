const fs = require("fs");
const zlib = require("zlib");
const pdfPath = String.raw`C:\Ram Sundar's Notes\College Stuff\Sem 6\Software Engineering\SRS DAO Based Taxi App Ram Sundar 23BCE1939.pdf`;
const buffer = fs.readFileSync(pdfPath);
const text = buffer.toString("latin1");
const streamRegex = /<<(.*?)>>\s*stream\r?\n([\s\S]*?)\r?\nendstream/g;
let index = 0;
for (const match of text.matchAll(streamRegex)) {
  const header = match[1];
  const streamData = Buffer.from(match[2], "latin1");
  let decoded;
  try {
    decoded = /\/FlateDecode/.test(header) ? zlib.inflateSync(streamData).toString("latin1") : streamData.toString("latin1");
  } catch {
    continue;
  }
  if (/[A-Za-z]{4,}/.test(decoded)) {
    console.log('---STREAM ' + (++index) + '---');
    console.log(decoded.slice(0, 3000));
    if (index >= 8) break;
  }
}
