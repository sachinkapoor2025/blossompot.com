const fs = require("fs");
const path = require("path");
const body = fs.readFileSync(path.join(process.env.TEMP, "bp-chunks", "3637-ca7fc584fbd3a187.js"), "utf8");
const i = body.indexOf("t.durationLabel=function");
console.log("duration at", i);
console.log(body.slice(i - 400, i + 80));
const re = /r\(n\((\d+)\),t\)/g;
const mods = [];
let m;
const start = body.indexOf("23637:");
const slice = body.slice(start, start + 4000);
while ((m = re.exec(slice))) mods.push(m[1]);
console.log("reexported count", mods.length);
// find module that contains durationLabel assignment by scanning module boundaries
const modRe = /(\d+):\((?:e,t,n|e,t)\)=>\{/g;
let last = null;
const hits = [];
while ((m = modRe.exec(body))) {
  if (last && m.index > i && last.index < i) {
    hits.push({ id: last.id, start: last.index });
  }
  last = { id: m[1], index: m.index };
}
console.log("module containing durationLabel", hits);
console.log("is reexported", hits[0] && mods.includes(hits[0].id));
