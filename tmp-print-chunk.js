const fs = require("fs");
const s = fs.readFileSync(process.env.TEMP + "/membership-page.js", "utf8");
fs.writeFileSync(process.env.TEMP + "/membership-page.pretty.js", s);
console.log(s);
