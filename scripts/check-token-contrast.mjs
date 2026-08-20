// WCAG 2.1 contrast audit of the v3.0.0 token pairs that appear in globals.css.
// Every ink token is checked against EVERY surface it can land on, not just --bg.
// Alpha inks are composited over their surface first.

const hex = (h) => {
  const v = h.replace("#", "");
  const f = v.length === 3 ? v.split("").map((c) => c + c).join("") : v;
  return [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16));
};
const rgba = (s) => {
  const p = s.match(/rgba?\(([^)]+)\)/)[1].split(",").map((x) => parseFloat(x.trim()));
  return { rgb: p.slice(0, 3), a: p.length > 3 ? p[3] : 1 };
};
const parse = (s) => (s.startsWith("#") ? { rgb: hex(s), a: 1 } : rgba(s));
const lum = (rgb) =>
  rgb
    .map((c) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    })
    .reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
const ratio = (fgS, bgS) => {
  const bg = parse(bgS);
  const fg = parse(fgS).rgb.map((c, i) => c * parse(fgS).a + bg.rgb[i] * (1 - parse(fgS).a));
  const [a, b] = [lum(fg), lum(bg.rgb)].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
};

const LIGHT = {
  bg: "#FBF7F0", surface: "#FFFFFF", "surface-2": "#F4EDE2", "surface-3": "#EAE0D1",
  gold: "#D4AF37", "gold-ink": "#77621F",
  w: "#161210", w70: "rgba(22,18,16,.8)", w60: "rgba(22,18,16,.7)",
  w50: "rgba(22,18,16,.62)", w40: "rgba(22,18,16,.61)",
  contrast: "#161210", "contrast-ink": "#FBF7F0", black: "#000",
};
const DARK = {
  bg: "#0A0A0A", surface: "#141414", "surface-2": "#1B1B1B", "surface-3": "#232323",
  gold: "#D4AF37", "gold-ink": "#D4AF37",
  w: "#FFFFFF", w70: "rgba(255,255,255,.7)", w60: "rgba(255,255,255,.6)",
  w50: "rgba(255,255,255,.5)", w40: "rgba(255,255,255,.55)",
  contrast: "#FFFFFF", "contrast-ink": "#000000", black: "#000",
};

const SURFACES = ["bg", "surface", "surface-2", "surface-3"];
// text tokens must clear AA 4.5 on every surface they can land on
const TEXT = [
  ["w    body copy", "w"],
  ["w70  strong secondary", "w70"],
  ["w60  muted body", "w60"],
  ["w50  .lede / dish + menu descriptions / FAQ / addresses", "w50"],
  ["w40  11px uppercase labels", "w40"],
  ["gold-ink  links, eyebrows", "gold-ink"],
];
const FIXED = [
  ["black on gold button", "black", "gold", 4.5],
  ["contrast-ink on solid button/CTA bar", "contrast-ink", "contrast", 4.5],
];

let fail = 0;
for (const [name, T] of [["LIGHT (default)", LIGHT], ["DARK (data-surface=\"dark\")", DARK]]) {
  console.log("\n=== " + name + " ===");
  for (const [label, ink] of TEXT) {
    const cells = SURFACES.map((s) => {
      const r = ratio(T[ink], T[s]);
      if (r < 4.5) fail++;
      return `${s} ${r.toFixed(2)}${r < 4.5 ? "!" : ""}`;
    });
    const bad = cells.some((c) => c.includes("!"));
    console.log(`  ${bad ? "FAIL" : "PASS"}  ${label.padEnd(56)} ${cells.join("  ")}`);
  }
  for (const [label, ink, surf, min] of FIXED) {
    const r = ratio(T[ink], T[surf]);
    if (r < min) fail++;
    console.log(`  ${r >= min ? "PASS" : "FAIL"}  ${label.padEnd(56)} ${r.toFixed(2)}:1`);
  }
}
console.log("\n" + (fail === 0 ? "All pairs clear WCAG AA 4.5:1." : fail + " FAILING PAIR(S)"));
process.exit(fail === 0 ? 0 : 1);
