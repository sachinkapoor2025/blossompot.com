const fs = require("fs");
const h = fs.readFileSync(process.env.TEMP + "/membership-orders.html", "utf8");
const i = h.indexOf("membership-orders");
console.log(h.slice(Math.max(0, i - 500), i + 1200));
console.log("\n==== SCRIPTS ====");
const scripts = [...h.matchAll(/src="(\/_next\/static\/[^"]+)"/g)].map((m) => m[1]);
console.log(scripts.join("\n"));
