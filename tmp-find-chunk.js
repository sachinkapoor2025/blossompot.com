const fs = require("fs");
const path = require("path");
const https = require("https");

const html = fs.readFileSync(process.env.TEMP + "/membership-orders.html", "utf8");
const scripts = [...html.matchAll(/\/_next\/static\/chunks\/[^"']+\.js/g)].map((m) => m[0]);
const unique = [...new Set(scripts)];

function get(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString("utf8") }));
      })
      .on("error", reject);
  });
}

(async () => {
  const dir = process.env.TEMP + "/bp-chunks";
  fs.mkdirSync(dir, { recursive: true });
  for (const src of unique) {
    const url = "https://www.blossompot.com" + src;
    const { status, body } = await get(url);
    const name = src.split("/").pop();
    fs.writeFileSync(path.join(dir, name), body);
    const has23637 = body.includes("23637:");
    const hasDuration = body.includes("durationLabel");
    const hasFormat = body.includes("formatMembershipDate");
    console.log(status, name, "len", body.length, "mod23637", has23637, "durationLabel", hasDuration, "formatMembershipDate", hasFormat);
  }
})();
