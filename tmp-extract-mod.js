const fs = require("fs");
const path = require("path");
const body = fs.readFileSync(path.join(process.env.TEMP, "bp-chunks", "3637-ca7fc584fbd3a187.js"), "utf8");
const idx = body.indexOf("23637:");
console.log("idx", idx);
console.log(body.slice(idx, idx + 2500));
console.log("\n\n===== durationLabel context =====");
let from = 0;
let n = 0;
while (n < 8) {
  const i = body.indexOf("durationLabel", from);
  if (i < 0) break;
  console.log("\n---", i, "---");
  console.log(body.slice(Math.max(0, i - 120), i + 180));
  from = i + 14;
  n++;
}
