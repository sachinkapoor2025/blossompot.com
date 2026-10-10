import { isIP } from "node:net";

/**
 * Public destination check for admin image probes.
 * Rejects loopback, private, link-local, multicast, unspecified, documentation,
 * and IPv6 forms that embed a non-public IPv4 address: mapped, compatible,
 * translated, 6to4, and the well-known NAT64 prefix.
 */
export function isPublicIpAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 4) return isPublicIpv4(address);
  if (family === 6) return isPublicIpv6(address);
  return false;
}

function ipv4ToInt(address: string): number | null {
  const parts = address.split(".");
  if (parts.length !== 4) return null;
  let value = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const octet = Number(part);
    if (octet > 255) return null;
    value = ((value << 8) | octet) >>> 0;
  }
  return value;
}

function inCidr(value: number, base: string, bits: number): boolean {
  const start = ipv4ToInt(base);
  if (start == null) return false;
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  return (value & mask) === (start & mask);
}

function isPublicIpv4(address: string): boolean {
  const value = ipv4ToInt(address);
  if (value == null) return false;
  const blocked: Array<[string, number]> = [
    ["0.0.0.0", 8],
    ["10.0.0.0", 8],
    ["100.64.0.0", 10],
    ["127.0.0.0", 8],
    ["169.254.0.0", 16],
    ["172.16.0.0", 12],
    ["192.0.0.0", 24],
    ["192.0.2.0", 24],
    ["192.168.0.0", 16],
    ["198.18.0.0", 15],
    ["198.51.100.0", 24],
    ["203.0.113.0", 24],
    ["224.0.0.0", 4],
    ["240.0.0.0", 4],
  ];
  return !blocked.some(([base, bits]) => inCidr(value, base, bits));
}

function parseIpv6(input: string): bigint | null {
  let address = input.toLowerCase();
  const tail = address.match(/:(\d+\.\d+\.\d+\.\d+)$/);
  if (tail?.[1]) {
    const octets = tail[1].split(".").map(Number);
    if (octets.length !== 4 || octets.some((octet) => octet > 255)) return null;
    const hi = ((octets[0]! << 8) | octets[1]!).toString(16);
    const lo = ((octets[2]! << 8) | octets[3]!).toString(16);
    address = `${address.slice(0, -tail[1].length)}${hi}:${lo}`;
  }
  const halves = address.split("::");
  if (halves.length > 2) return null;
  const parseSide = (side: string) => (side ? side.split(":") : []);
  const left = parseSide(halves[0] ?? "");
  const right = parseSide(halves[1] ?? "");
  if (halves.length === 1 && left.length !== 8) return null;
  const missing = 8 - left.length - right.length;
  if (halves.length === 2 && missing < 0) return null;
  const groups = halves.length === 2 ? [...left, ...Array.from({ length: missing }, () => "0"), ...right] : left;
  if (groups.length !== 8) return null;
  let value = 0n;
  for (const group of groups) {
    if (!/^[0-9a-f]{1,4}$/.test(group)) return null;
    value = (value << 16n) + BigInt(parseInt(group, 16));
  }
  return value;
}

function embeddedIpv4(value: bigint): string {
  return intToIpv4(Number(value & 0xffffffffn));
}

function isPublicIpv6(address: string): boolean {
  const value = parseIpv6(address);
  if (value == null) return false;
  if (value === 0n || value === 1n) return false;
  // IPv4-mapped ::ffff:0:0/96, including ::ffff:127.0.0.1.
  if (value >> 32n === 0xffffn) return isPublicIpv4(embeddedIpv4(value));
  // IPv4-translated ::ffff:0:0:0/96, including ::ffff:0:7f00:1.
  if (value >> 32n === 0xffff0000n) return isPublicIpv4(embeddedIpv4(value));
  // IPv4-compatible ::/96, including ::7f00:1 and the lookup form ::127.0.0.1.
  if (value >> 32n === 0n) return isPublicIpv4(embeddedIpv4(value));
  // 6to4 2002::/16.
  if (value >> 112n === 0x2002n) return isPublicIpv4(intToIpv4(Number((value >> 80n) & 0xffffffffn)));
  // NAT64 well-known prefix 64:ff9b::/96.
  const nat64 = (0x64n << 80n) | (0xff9bn << 64n);
  if (value >> 32n === nat64) return isPublicIpv4(embeddedIpv4(value));
  const top7 = value >> 121n;
  if (top7 === 0x7en || top7 === 0x7fn) return false;
  if (value >> 118n === 0x3fan || value >> 118n === 0x3fbn) return false;
  if (value >> 120n === 0xffn) return false;
  if (value >> 96n === 0x20010db8n) return false;
  if (value >> 80n === 0x200100020000n) return false;
  if (value >> 64n === 0x0100000000000000n) return false;
  return true;
}

function intToIpv4(value: number): string {
  return [(value >>> 24) & 255, (value >>> 16) & 255, (value >>> 8) & 255, value & 255].join(".");
}
