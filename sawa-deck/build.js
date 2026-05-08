// ─────────────────────────────────────────────────────────────────────
// SAWA — Hackcessible 2026 presentation
// Brand palette pulled directly from src/tokens.ts in the Jaki repo
// ─────────────────────────────────────────────────────────────────────

const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const Fa = require("react-icons/fa");
const Md = require("react-icons/md");
const Hi = require("react-icons/hi2");
const Bi = require("react-icons/bi");

// ── Brand tokens (from /Jaki/src/tokens.ts) ──────────────────────────
const C = {
  bg:       "F8F7F4",
  surface:  "FFFFFF",
  surface2: "F2EFE9",
  line:     "E7E3DB",
  line2:    "D9D4C8",
  ink:      "1F1B16",
  ink2:     "44403C",
  ink3:     "78716C",
  ink4:     "A8A29E",
  sage:     "87A878",
  sageDeep: "5E7C52",
  sageSoft: "EAF0E4",
  amber:    "C89B4A",
  amberSoft:"F5EBD6",
  rose:     "B86B5E",
  roseSoft: "F3E1DC",
  sky:      "6F8FA8",
  skySoft:  "E2EAF0",
  plum:     "8A6E8C",
  plumSoft: "EDE4EE",
};

const SERIF = "Georgia"; // display
const SANS  = "Calibri"; // body — Inter Tight not universally available; Calibri is consistent
const MONO  = "Consolas";

// ── Icon helpers ─────────────────────────────────────────────────────
async function icon(IconComp, color, size = 256) {
  const svg = ReactDOMServer.renderToStaticMarkup(
    React.createElement(IconComp, { color: "#" + color, size: String(size) })
  );
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + png.toString("base64");
}

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9"; // 10 × 5.625
pres.title  = "Sawa — Hackcessible 2026";
pres.author = "Sawa Team — AKU × KU × CIME AKU";

// Slide width/height constants
const W = 10, H = 5.625;

// ── Reusable element helpers ─────────────────────────────────────────
function setBg(slide, color = C.bg) {
  slide.background = { color };
}

// Small sage dot motif — tiny circle, used as the recurring brand mark
function brandDot(slide, x, y, r = 0.08, color = C.sage) {
  slide.addShape(pres.shapes.OVAL, {
    x: x - r/2, y: y - r/2, w: r, h: r,
    fill: { color }, line: { color, width: 0 }
  });
}

// Top-of-slide section eyebrow + slide title
function header(slide, eyebrow, title, opts = {}) {
  const eyebrowColor = opts.eyebrowColor || C.sage;
  // eyebrow row: dot + small caps text
  brandDot(slide, 0.55, 0.49, 0.10, eyebrowColor);
  slide.addText(eyebrow, {
    x: 0.7, y: 0.34, w: 6, h: 0.3,
    fontFace: SANS, fontSize: 10, bold: true, charSpacing: 4,
    color: eyebrowColor, margin: 0,
  });
  slide.addText(title, {
    x: 0.5, y: 0.65, w: 9, h: 0.85,
    fontFace: SERIF, fontSize: opts.titleSize || 32, italic: opts.titleItalic || false,
    color: C.ink, margin: 0,
  });
}

// Footer page mark — page number + Sawa wordmark
function footer(slide, pageNum, totalPages) {
  slide.addText("SAWA", {
    x: 0.5, y: H - 0.4, w: 1, h: 0.25,
    fontFace: SERIF, fontSize: 9, bold: true, charSpacing: 4,
    color: C.ink3, margin: 0,
  });
  slide.addText(`${String(pageNum).padStart(2, "0")} / ${String(totalPages).padStart(2, "0")}`, {
    x: W - 1.5, y: H - 0.4, w: 1, h: 0.25,
    fontFace: SANS, fontSize: 9, color: C.ink3, align: "right", margin: 0,
  });
}

// ─────────────────────────────────────────────────────────────────────
async function build() {
  const TOTAL = 24;
  let p = 0;

  // ─── 1 · TITLE ─────────────────────────────────────────────────────
  {
    const s = pres.addSlide(); setBg(s, C.bg); p++;

    // Three subtle accent dots in the negative space (top-right cluster)
    brandDot(s, 8.6, 0.7, 0.20, C.sage);
    brandDot(s, 9.0, 0.7, 0.13, C.amber);
    brandDot(s, 9.3, 0.7, 0.09, C.rose);

    s.addText("HACKCESSIBLE 2026", {
      x: 0.7, y: 1.1, w: 8, h: 0.3,
      fontFace: SANS, fontSize: 11, bold: true, charSpacing: 6, color: C.sage, margin: 0,
    });

    // Main word — Sawa
    s.addText("Sawa.", {
      x: 0.55, y: 1.5, w: 7, h: 1.7,
      fontFace: SERIF, fontSize: 130, bold: true, italic: true,
      color: C.ink, margin: 0,
    });

    // Tagline
    s.addText("Tech tailored to autism — one person at a time.", {
      x: 0.7, y: 3.3, w: 8.6, h: 0.55,
      fontFace: SERIF, fontSize: 22, italic: true, color: C.ink2, margin: 0,
    });

    // Divider — single line, low key
    s.addShape(pres.shapes.LINE, {
      x: 0.7, y: 4.05, w: 1.5, h: 0,
      line: { color: C.sageDeep, width: 1.5 },
    });

    // Team / hosting
    s.addText([
      { text: "Aga Khan University Medical School", options: { bold: true, color: C.ink2, breakLine: true } },
      { text: "× Kenyatta University Biomedical Engineering", options: { bold: true, color: C.ink2, breakLine: true } },
      { text: " ", options: { fontSize: 6, breakLine: true } },
      { text: "Hosted by CIME · Aga Khan University", options: { color: C.ink3, italic: true } },
    ], {
      x: 0.7, y: 4.25, w: 8, h: 1.2,
      fontFace: SANS, fontSize: 12, margin: 0,
    });
  }

  // ─── 2 · HOOK / PROBLEM ───────────────────────────────────────────
  {
    const s = pres.addSlide(); setBg(s, C.bg); p++;

    s.addText("THE PROBLEM", {
      x: 0.55, y: 0.5, w: 5, h: 0.3,
      fontFace: SANS, fontSize: 11, bold: true, charSpacing: 6, color: C.rose, margin: 0,
    });

    s.addText([
      { text: "We build assistive tech ", options: { color: C.ink } },
      { text: "for ", options: { color: C.ink } },
      { text: "autism", options: { italic: true, color: C.sageDeep } },
      { text: " — but rarely ", options: { color: C.ink } },
      { text: "with ", options: { color: C.ink } },
      { text: "the people who use it.", options: { italic: true, color: C.rose } },
    ], {
      x: 0.55, y: 1.1, w: 9, h: 3.2,
      fontFace: SERIF, fontSize: 44, margin: 0, valign: "top",
    });

    s.addText("Sawa flips that. We test the person before we design the product.", {
      x: 0.55, y: 4.5, w: 9, h: 0.6,
      fontFace: SANS, fontSize: 16, italic: true, color: C.ink3, margin: 0,
    });

    footer(s, p, TOTAL);
  }

  // ─── 3 · KENYA NUMBERS ─────────────────────────────────────────────
  {
    const s = pres.addSlide(); setBg(s, C.bg); p++;
    header(s, "01 · INTRODUCTION — THE NUMBERS", "Autism in Kenya.");

    // Big stat card 1 — left
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y: 1.7, w: 4.4, h: 3.3,
      fill: { color: C.surface }, line: { color: C.line, width: 1 },
    });
    s.addText("1 in 25", {
      x: 0.6, y: 1.95, w: 4.2, h: 1.3,
      fontFace: SERIF, fontSize: 64, bold: true, italic: true, color: C.sageDeep, margin: 0, align: "center",
    });
    s.addText("Kenyan children may be on the spectrum", {
      x: 0.7, y: 3.35, w: 4.0, h: 0.4,
      fontFace: SANS, fontSize: 14, bold: true, color: C.ink, align: "center", margin: 0,
    });
    s.addText("Autism Society of Kenya estimate — ~4% of the population, roughly 2.2 million Kenyans across the spectrum.", {
      x: 0.8, y: 3.85, w: 3.8, h: 1.0,
      fontFace: SANS, fontSize: 11, color: C.ink3, align: "center", margin: 0,
    });

    // Right column — secondary stats
    const rightX = 5.2, rightW = 4.3;

    s.addShape(pres.shapes.RECTANGLE, {
      x: rightX, y: 1.7, w: rightW, h: 1.5,
      fill: { color: C.amberSoft }, line: { color: C.amberSoft, width: 0 },
    });
    s.addText("4 boys : 1 girl", {
      x: rightX + 0.2, y: 1.85, w: rightW - 0.4, h: 0.7,
      fontFace: SERIF, fontSize: 28, bold: true, color: C.ink, margin: 0,
    });
    s.addText("Diagnosis ratio in Kenya — though girls are widely under-diagnosed.", {
      x: rightX + 0.2, y: 2.55, w: rightW - 0.4, h: 0.6,
      fontFace: SANS, fontSize: 11, color: C.ink2, margin: 0,
    });

    s.addShape(pres.shapes.RECTANGLE, {
      x: rightX, y: 3.4, w: rightW, h: 1.5,
      fill: { color: C.skySoft }, line: { color: C.skySoft, width: 0 },
    });
    s.addText("#46 globally", {
      x: rightX + 0.2, y: 3.55, w: rightW - 0.4, h: 0.7,
      fontFace: SERIF, fontSize: 28, bold: true, color: C.ink, margin: 0,
    });
    s.addText("Kenya's WHO autism-prevalence rank — yet still no national prevalence registry.", {
      x: rightX + 0.2, y: 4.25, w: rightW - 0.4, h: 0.6,
      fontFace: SANS, fontSize: 11, color: C.ink2, margin: 0,
    });

    footer(s, p, TOTAL);
  }

  // ─── 4 · GLOBAL NUMBERS — A RAPID RISE ─────────────────────────────
  {
    const s = pres.addSlide(); setBg(s, C.bg); p++;
    header(s, "01 · INTRODUCTION — THE NUMBERS", "A rapid global rise.");

    // CDC bar chart of US prevalence
    const labels = ["1992", "2000", "2010", "2018", "2020", "2022"];
    const values = [1/150 * 1000, 1/150 * 1000, 1/68 * 1000, 1/44 * 1000, 1/36 * 1000, 1/31 * 1000];
    // Convert to "children per 1000" for legibility
    const perThousand = [6.7, 6.7, 14.7, 22.7, 27.8, 32.3];

    s.addChart(pres.charts.BAR, [{
      name: "Per 1,000 US children diagnosed with ASD",
      labels: labels,
      values: perThousand,
    }], {
      x: 0.5, y: 1.7, w: 5.6, h: 3.3,
      barDir: "col",
      chartColors: [C.sageDeep],
      chartArea: { fill: { color: C.bg } },
      plotArea: { fill: { color: C.bg } },
      catAxisLabelColor: C.ink2, catAxisLabelFontFace: SANS, catAxisLabelFontSize: 10,
      valAxisLabelColor: C.ink3, valAxisLabelFontFace: SANS, valAxisLabelFontSize: 9,
      valGridLine: { color: C.line, size: 0.5 },
      catGridLine: { style: "none" },
      showValue: true, dataLabelColor: C.ink2, dataLabelFontFace: SANS, dataLabelFontSize: 9,
      dataLabelPosition: "outEnd", dataLabelFormatCode: "0.0",
      showLegend: false,
      showTitle: true, title: "US autism prevalence — per 1,000 children, age 8",
      titleColor: C.ink, titleFontFace: SERIF, titleFontSize: 12,
    });

    // Right side — call-out stats
    const rx = 6.4;

    s.addText("1 in 31", {
      x: rx, y: 1.7, w: 3.2, h: 0.9,
      fontFace: SERIF, fontSize: 56, bold: true, color: C.ink, margin: 0,
    });
    s.addText("US children — CDC 2025, up from 1 in 36 in 2023.", {
      x: rx, y: 2.55, w: 3.2, h: 0.5,
      fontFace: SANS, fontSize: 11, color: C.ink3, margin: 0,
    });

    s.addText("≈ 5×", {
      x: rx, y: 3.2, w: 3.2, h: 0.9,
      fontFace: SERIF, fontSize: 56, bold: true, color: C.amber, margin: 0,
    });
    s.addText("Higher than when CDC began surveying, in cohorts born 1992.", {
      x: rx, y: 4.05, w: 3.2, h: 0.5,
      fontFace: SANS, fontSize: 11, color: C.ink3, margin: 0,
    });

    s.addText("WHO global average: ≈ 1 in 100 children.", {
      x: rx, y: 4.65, w: 3.2, h: 0.4,
      fontFace: SANS, fontSize: 10, italic: true, color: C.ink3, margin: 0,
    });

    footer(s, p, TOTAL);
  }

  // ─── 5 · LOST CHILDREN — THE URGENCY ───────────────────────────────
  {
    const s = pres.addSlide(); setBg(s, C.bg); p++;
    header(s, "01 · INTRODUCTION — THE STAKES", "Children get lost.", { eyebrowColor: C.rose });

    // Three stat tiles, side by side
    const tiles = [
      {
        big: "49%",
        head: "of children with autism wander",
        sub: "Roughly half elope from caregivers — four times the rate of unaffected siblings (Kennedy Krieger, NAA).",
        color: C.rose, soft: C.roseSoft
      },
      {
        big: "1 in 3",
        head: "can't say their own name",
        sub: "More than a third of children with autism who wander cannot communicate their name, address, or phone number.",
        color: C.amber, soft: C.amberSoft
      },
      {
        big: "71%",
        head: "of fatal outcomes are drowning",
        sub: "Followed by traffic injuries (18%). Average missing time is around 41 minutes.",
        color: C.sky, soft: C.skySoft
      },
    ];
    tiles.forEach((t, i) => {
      const x = 0.5 + i * 3.1;
      s.addShape(pres.shapes.RECTANGLE, {
        x, y: 1.7, w: 3.0, h: 3.3,
        fill: { color: C.surface }, line: { color: C.line, width: 1 },
      });
      // Color stripe top
      s.addShape(pres.shapes.RECTANGLE, {
        x, y: 1.7, w: 3.0, h: 0.18,
        fill: { color: t.color }, line: { color: t.color, width: 0 },
      });
      s.addText(t.big, {
        x: x + 0.2, y: 2.0, w: 2.6, h: 1.0,
        fontFace: SERIF, fontSize: 50, bold: true, color: t.color, margin: 0,
      });
      s.addText(t.head, {
        x: x + 0.2, y: 3.05, w: 2.6, h: 0.6,
        fontFace: SANS, fontSize: 13, bold: true, color: C.ink, margin: 0,
      });
      s.addText(t.sub, {
        x: x + 0.2, y: 3.65, w: 2.6, h: 1.2,
        fontFace: SANS, fontSize: 10, color: C.ink3, margin: 0,
      });
    });

    footer(s, p, TOTAL);
  }

  // ─── 6 · THE ANATOMY — BRAIN/DEVELOPMENT ───────────────────────────
  {
    const s = pres.addSlide(); setBg(s, C.bg); p++;
    header(s, "01 · INTRODUCTION — THE ANATOMY", "Why developing brains.");

    // Two-column structure
    s.addText("What we know", {
      x: 0.5, y: 1.6, w: 4.5, h: 0.4,
      fontFace: SANS, fontSize: 11, bold: true, charSpacing: 4, color: C.sage, margin: 0,
    });

    s.addText([
      { text: "Genes set the stage.", options: { bold: true, color: C.ink, breakLine: true } },
      { text: "Twin and family studies put autism heritability at 70–90%. There is no single 'autism gene' — it is a polygenic condition.", options: { color: C.ink2, breakLine: true } },
      { text: " ", options: { fontSize: 6, breakLine: true } },
      { text: "Environment writes on it.", options: { bold: true, color: C.ink, breakLine: true } },
      { text: "Prenatal factors, prematurity, infection, and early postnatal stimulation all interact with the genetic substrate.", options: { color: C.ink2, breakLine: true } },
      { text: " ", options: { fontSize: 6, breakLine: true } },
      { text: "Younger brains are more plastic — and more vulnerable.", options: { bold: true, color: C.ink, breakLine: true } },
      { text: "Birth–5 years is the peak window for synaptic pruning, white-matter myelination, and language network formation.", options: { color: C.ink2 } },
    ], {
      x: 0.5, y: 2.0, w: 4.5, h: 3.2,
      fontFace: SANS, fontSize: 12, margin: 0, valign: "top",
    });

    // Right column — brain plasticity visual (bar of brain growth)
    s.addText("Brain volume by age", {
      x: 5.4, y: 1.6, w: 4.1, h: 0.4,
      fontFace: SANS, fontSize: 11, bold: true, charSpacing: 4, color: C.sage, margin: 0,
    });

    s.addChart(pres.charts.LINE, [{
      name: "% of adult brain volume",
      labels: ["Birth", "1 yr", "2 yr", "5 yr", "10 yr", "Adult"],
      values: [25, 60, 75, 90, 95, 100],
    }], {
      x: 5.3, y: 2.0, w: 4.3, h: 2.7,
      chartColors: [C.sageDeep],
      chartArea: { fill: { color: C.bg } },
      plotArea: { fill: { color: C.bg } },
      lineSize: 3, lineSmooth: true,
      catAxisLabelColor: C.ink3, catAxisLabelFontFace: SANS, catAxisLabelFontSize: 9,
      valAxisLabelColor: C.ink3, valAxisLabelFontFace: SANS, valAxisLabelFontSize: 9,
      valAxisMaxVal: 110, valAxisMinVal: 0,
      valGridLine: { color: C.line, size: 0.5 },
      catGridLine: { style: "none" },
      showLegend: false,
      lineDataSymbolSize: 8,
      lineDataSymbolFillColor: C.amber,
      lineDataSymbolLineColor: C.sageDeep,
    });

    s.addText("By age 5, the brain is already at ~90% of adult volume — almost everything that matters is wired before primary school.", {
      x: 5.3, y: 4.75, w: 4.3, h: 0.5,
      fontFace: SANS, fontSize: 10, italic: true, color: C.ink3, margin: 0,
    });

    footer(s, p, TOTAL);
  }

  // ─── 7 · THE PHONE FACTOR ──────────────────────────────────────────
  {
    const s = pres.addSlide(); setBg(s, C.bg); p++;
    header(s, "01 · INTRODUCTION — THE PHONE FACTOR", "Have phones added fuel?", { eyebrowColor: C.amber });

    // Three findings in a list
    s.addText("What recent research suggests:", {
      x: 0.5, y: 1.55, w: 9, h: 0.4,
      fontFace: SANS, fontSize: 12, bold: true, color: C.ink2, margin: 0,
    });

    const findings = [
      {
        n: "01",
        head: "Heavier early-life screen exposure correlates with autism-like symptoms.",
        sub: "ASD cases averaged ~3.6 hours of daily screen time vs. controls in a 2024 case-control study (PMC11624908)."
      },
      {
        n: "02",
        head: "A Japanese cohort linked age-1 screen time to age-3 autism diagnoses in boys.",
        sub: "Heffler et al. — flagged as a possible white-matter and language-network disruption signal."
      },
      {
        n: "03",
        head: "75% of US under-2s exceed AAP screen-time limits — globally, the figure is climbing.",
        sub: "AAP recommends zero screens before 18–24 months; ≤1 hour/day for ages 2–5."
      },
    ];
    findings.forEach((f, i) => {
      const y = 2.05 + i * 0.85;
      s.addText(f.n, {
        x: 0.5, y: y, w: 0.5, h: 0.6,
        fontFace: SERIF, fontSize: 24, bold: true, italic: true, color: C.amber, margin: 0,
      });
      s.addText(f.head, {
        x: 1.05, y: y - 0.05, w: 8.4, h: 0.4,
        fontFace: SANS, fontSize: 14, bold: true, color: C.ink, margin: 0,
      });
      s.addText(f.sub, {
        x: 1.05, y: y + 0.32, w: 8.4, h: 0.45,
        fontFace: SANS, fontSize: 10, color: C.ink3, italic: true, margin: 0,
      });
    });

    // Honest caveat
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y: 4.78, w: 9, h: 0.4,
      fill: { color: C.sageSoft }, line: { color: C.sageSoft, width: 0 },
    });
    s.addText("Important: causation is unproven. Reverse causation — autistic children seeking screens — is plausible too.", {
      x: 0.7, y: 4.83, w: 8.6, h: 0.3,
      fontFace: SANS, fontSize: 10, italic: true, color: C.sageDeep, margin: 0,
    });

    footer(s, p, TOTAL);
  }

  // ─── 8 · THE TENSION → STRENGTH ────────────────────────────────────
  {
    const s = pres.addSlide(); setBg(s, C.ink); p++;

    s.addText("OUR STANCE", {
      x: 0.55, y: 0.55, w: 5, h: 0.3,
      fontFace: SANS, fontSize: 11, bold: true, charSpacing: 6, color: C.sage, margin: 0,
    });

    s.addText([
      { text: "If the tools that may have ", options: { color: "F8F7F4" } },
      { text: "harmed", options: { color: C.rose, italic: true } },
      { text: " can be re-shaped", options: { color: "F8F7F4", breakLine: true } },
      { text: "to ", options: { color: "F8F7F4" } },
      { text: "help", options: { color: C.sage, italic: true, bold: true } },
      { text: " — we should be the ones doing it.", options: { color: "F8F7F4" } },
    ], {
      x: 0.55, y: 1.3, w: 9, h: 2.8,
      fontFace: SERIF, fontSize: 38, margin: 0, valign: "top",
    });

    s.addShape(pres.shapes.LINE, {
      x: 0.55, y: 4.2, w: 0.9, h: 0,
      line: { color: C.sage, width: 1.5 },
    });

    s.addText("The same touchscreens, accelerometers, and GPS chips implicated in the rise are the cheapest, most ubiquitous assistive substrate ever built. Sawa weaponises them — for the user, not against.", {
      x: 0.55, y: 4.4, w: 9, h: 1.0,
      fontFace: SANS, fontSize: 13, italic: true, color: "D9D4C8", margin: 0,
    });
  }

  // ─── 9 · OUR JOURNEY — DIVIDER ─────────────────────────────────────
  {
    const s = pres.addSlide(); setBg(s, C.bg); p++;

    s.addText("02", {
      x: 0.55, y: 0.7, w: 2, h: 1.4,
      fontFace: SERIF, fontSize: 96, italic: true, color: C.sage, margin: 0,
    });
    s.addShape(pres.shapes.LINE, {
      x: 0.6, y: 2.1, w: 0.7, h: 0,
      line: { color: C.sageDeep, width: 1.5 },
    });
    s.addText("Our journey", {
      x: 0.55, y: 2.2, w: 9, h: 1.2,
      fontFace: SERIF, fontSize: 60, italic: true, color: C.ink, margin: 0,
    });
    s.addText("From what exists, to who Arthur is, to what he can actually do.", {
      x: 0.55, y: 3.5, w: 9, h: 0.6,
      fontFace: SANS, fontSize: 16, color: C.ink2, italic: true, margin: 0,
    });

    footer(s, p, TOTAL);
  }

  // ─── 10 · WHAT EXISTS ──────────────────────────────────────────────
  {
    const s = pres.addSlide(); setBg(s, C.bg); p++;
    header(s, "02 · OUR JOURNEY — LANDSCAPE", "What's already out there.");

    // Existing tools — table-style cards
    const tools = [
      { name: "PECS",         what: "Picture Exchange Communication", strength: "Low-tech, durable, classroom-ready", gap: "Not personalised; analog-only" },
      { name: "Proloquo2Go",  what: "iPad AAC app", strength: "Rich vocabulary, voice output", gap: "$249, requires iPad, fixed UI" },
      { name: "TouchChat",    what: "AAC suite for tablets", strength: "Customisable boards", gap: "Steep learning curve, expensive" },
      { name: "AngelSense",   what: "GPS tracker for kids", strength: "Real-time location, alerts", gap: "Tracking only — no communication" },
    ];

    tools.forEach((t, i) => {
      const y = 1.65 + i * 0.78;
      // Row card
      s.addShape(pres.shapes.RECTANGLE, {
        x: 0.5, y: y, w: 9, h: 0.72,
        fill: { color: C.surface }, line: { color: C.line, width: 1 },
      });
      s.addText(t.name, {
        x: 0.7, y: y + 0.1, w: 1.8, h: 0.35,
        fontFace: SERIF, fontSize: 16, bold: true, color: C.sageDeep, margin: 0,
      });
      s.addText(t.what, {
        x: 0.7, y: y + 0.42, w: 1.8, h: 0.3,
        fontFace: SANS, fontSize: 9, italic: true, color: C.ink3, margin: 0,
      });
      s.addText(t.strength, {
        x: 2.7, y: y + 0.22, w: 3.3, h: 0.4,
        fontFace: SANS, fontSize: 11, color: C.ink2, margin: 0,
      });
      s.addText(t.gap, {
        x: 6.1, y: y + 0.22, w: 3.3, h: 0.4,
        fontFace: SANS, fontSize: 11, italic: true, color: C.rose, margin: 0,
      });
    });

    // column headers (above first row)
    s.addText("TOOL", { x: 0.7, y: 1.4, w: 1.8, h: 0.2, fontFace: SANS, fontSize: 9, bold: true, charSpacing: 3, color: C.ink3, margin: 0 });
    s.addText("STRENGTH", { x: 2.7, y: 1.4, w: 3, h: 0.2, fontFace: SANS, fontSize: 9, bold: true, charSpacing: 3, color: C.ink3, margin: 0 });
    s.addText("THE GAP", { x: 6.1, y: 1.4, w: 3, h: 0.2, fontFace: SANS, fontSize: 9, bold: true, charSpacing: 3, color: C.rose, margin: 0 });

    s.addText("Common thread: every tool is shaped by what worked for someone else's child.", {
      x: 0.5, y: 4.85, w: 9, h: 0.3,
      fontFace: SANS, fontSize: 11, italic: true, color: C.ink3, margin: 0,
    });

    footer(s, p, TOTAL);
  }

  // ─── 11 · WHY TEST FIRST ───────────────────────────────────────────
  {
    const s = pres.addSlide(); setBg(s, C.bg); p++;
    header(s, "02 · OUR JOURNEY — PRINCIPLE", "Why test first.");

    s.addText("The default", {
      x: 0.5, y: 1.65, w: 4.3, h: 0.35,
      fontFace: SANS, fontSize: 11, bold: true, charSpacing: 4, color: C.rose, margin: 0,
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y: 2.05, w: 4.3, h: 2.95,
      fill: { color: C.roseSoft }, line: { color: C.roseSoft, width: 0 },
    });
    s.addText([
      { text: "1. Read the literature.", options: { bold: true, color: C.ink, breakLine: true } },
      { text: "2. Design a generic interface.", options: { bold: true, color: C.ink, breakLine: true } },
      { text: "3. Hand it to the user.", options: { bold: true, color: C.ink, breakLine: true } },
      { text: "4. Watch them struggle.", options: { bold: true, color: C.ink, breakLine: true } },
      { text: "5. Iterate from frustration.", options: { bold: true, color: C.ink, breakLine: true } },
      { text: " ", options: { fontSize: 6, breakLine: true } },
      { text: "The user adapts to the tool.", options: { italic: true, color: C.rose } },
    ], {
      x: 0.7, y: 2.2, w: 3.9, h: 2.7,
      fontFace: SANS, fontSize: 14, margin: 0, valign: "top", paraSpaceAfter: 4,
    });

    s.addText("Our approach", {
      x: 5.2, y: 1.65, w: 4.3, h: 0.35,
      fontFace: SANS, fontSize: 11, bold: true, charSpacing: 4, color: C.sageDeep, margin: 0,
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 5.2, y: 2.05, w: 4.3, h: 2.95,
      fill: { color: C.sageSoft }, line: { color: C.sageSoft, width: 0 },
    });
    s.addText([
      { text: "1. Build an assessment platform.", options: { bold: true, color: C.ink, breakLine: true } },
      { text: "2. Measure what the user can do.", options: { bold: true, color: C.ink, breakLine: true } },
      { text: "3. Note what they can't — or won't.", options: { bold: true, color: C.ink, breakLine: true } },
      { text: "4. Design the UI to those numbers.", options: { bold: true, color: C.ink, breakLine: true } },
      { text: "5. Re-test, re-tune.", options: { bold: true, color: C.ink, breakLine: true } },
      { text: " ", options: { fontSize: 6, breakLine: true } },
      { text: "The tool adapts to the user.", options: { italic: true, color: C.sageDeep } },
    ], {
      x: 5.4, y: 2.2, w: 3.9, h: 2.7,
      fontFace: SANS, fontSize: 14, margin: 0, valign: "top", paraSpaceAfter: 4,
    });

    footer(s, p, TOTAL);
  }

  // ─── 12 · MEET ARTHUR ──────────────────────────────────────────────
  {
    const s = pres.addSlide(); setBg(s, C.bg); p++;
    header(s, "02 · OUR JOURNEY — THE PERSON", "Meet Arthur.");

    // Two-column: portrait area (silhouette) + bio
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y: 1.65, w: 3.4, h: 3.4,
      fill: { color: C.sageSoft }, line: { color: C.sageSoft, width: 0 },
    });
    // Avatar circle
    s.addShape(pres.shapes.OVAL, {
      x: 1.55, y: 2.0, w: 1.3, h: 1.3,
      fill: { color: C.surface }, line: { color: C.sage, width: 2 },
    });
    s.addText("A", {
      x: 1.55, y: 2.05, w: 1.3, h: 1.2,
      fontFace: SERIF, fontSize: 60, bold: true, italic: true, color: C.sageDeep, align: "center", valign: "middle", margin: 0,
    });
    s.addText("Arthur", {
      x: 0.7, y: 3.45, w: 3.0, h: 0.5,
      fontFace: SERIF, fontSize: 26, bold: true, italic: true, color: C.ink, align: "center", margin: 0,
    });
    s.addText("Young adult on the spectrum,", {
      x: 0.7, y: 4.0, w: 3.0, h: 0.3,
      fontFace: SANS, fontSize: 11, color: C.ink2, align: "center", margin: 0,
    });
    s.addText("Nairobi, Kenya.", {
      x: 0.7, y: 4.3, w: 3.0, h: 0.3,
      fontFace: SANS, fontSize: 11, color: C.ink2, align: "center", margin: 0,
    });

    // Right — bio bullets
    s.addText("Why Arthur, why now.", {
      x: 4.2, y: 1.7, w: 5.3, h: 0.4,
      fontFace: SERIF, fontSize: 22, italic: true, color: C.ink, margin: 0,
    });

    s.addText([
      { text: "Speaks little, communicates a lot.  ", options: { bold: true, color: C.ink, breakLine: true } },
      { text: "Highly responsive to visual prompts and predictable routines, frustrated by abstract menus.", options: { color: C.ink2, breakLine: true } },
      { text: " ", options: { fontSize: 4, breakLine: true } },
      { text: "Owns a phone. Rarely uses it as designed.  ", options: { bold: true, color: C.ink, breakLine: true } },
      { text: "The technology is in his pocket; the affordances are not for him.", options: { color: C.ink2, breakLine: true } },
      { text: " ", options: { fontSize: 4, breakLine: true } },
      { text: "Caregiver-supported, not caregiver-tethered.  ", options: { bold: true, color: C.ink, breakLine: true } },
      { text: "Goal: more independence, fewer reactive interventions.", options: { color: C.ink2 } },
    ], {
      x: 4.2, y: 2.15, w: 5.3, h: 3.1,
      fontFace: SANS, fontSize: 12, margin: 0, valign: "top", paraSpaceAfter: 4,
    });

    footer(s, p, TOTAL);
  }

  // ─── 13 · THE ASSESSMENT ───────────────────────────────────────────
  {
    const s = pres.addSlide(); setBg(s, C.bg); p++;
    header(s, "02 · OUR JOURNEY — THE TEST", "The assessment platform.");

    s.addText("A web-based AT assessment Arthur can run on any phone or tablet — measuring fine motor and cognitive ability across 13 micro-tasks, scored 0–10 each.", {
      x: 0.5, y: 1.6, w: 9, h: 0.7,
      fontFace: SANS, fontSize: 13, italic: true, color: C.ink2, margin: 0,
    });

    // Two columns of test categories
    s.addText("FINE MOTOR — 7 tasks", {
      x: 0.5, y: 2.45, w: 4.4, h: 0.3,
      fontFace: SANS, fontSize: 10, bold: true, charSpacing: 4, color: C.amber, margin: 0,
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y: 2.8, w: 4.4, h: 2.3,
      fill: { color: C.amberSoft }, line: { color: C.amberSoft, width: 0 },
    });
    s.addText([
      { text: "Reaction Tap   ·   Accuracy Tap", options: { breakLine: true } },
      { text: "Long Press   ·   Button Sizes", options: { breakLine: true } },
      { text: "Scroll Test (vertical & horizontal)", options: { breakLine: true } },
      { text: "Double Tap   ·   Drag & Drop", options: {} },
    ], {
      x: 0.7, y: 2.95, w: 4.0, h: 2.0,
      fontFace: SANS, fontSize: 13, color: C.ink, margin: 0, paraSpaceAfter: 6,
    });

    s.addText("COGNITIVE — 6 tasks", {
      x: 5.2, y: 2.45, w: 4.4, h: 0.3,
      fontFace: SANS, fontSize: 10, bold: true, charSpacing: 4, color: C.sky, margin: 0,
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 5.2, y: 2.8, w: 4.4, h: 2.3,
      fill: { color: C.skySoft }, line: { color: C.skySoft, width: 0 },
    });
    s.addText([
      { text: "Image Recall   ·   Symbol Matching", options: { breakLine: true } },
      { text: "Preference (2 options)", options: { breakLine: true } },
      { text: "Preference (4 options)", options: { breakLine: true } },
      { text: "Verb–Noun & Verb–Noun–Adj pairing", options: { breakLine: true } },
      { text: "Audio Wait", options: {} },
    ], {
      x: 5.4, y: 2.95, w: 4.0, h: 2.0,
      fontFace: SANS, fontSize: 13, color: C.ink, margin: 0, paraSpaceAfter: 6,
    });

    s.addText("Available at arthur-assessment.vercel.app · Open source · Re-runnable.", {
      x: 0.5, y: 4.9, w: 9, h: 0.3,
      fontFace: MONO, fontSize: 10, color: C.ink3, margin: 0,
    });

    footer(s, p, TOTAL);
  }

  // ─── 14 · ARTHUR'S RESULTS ─────────────────────────────────────────
  {
    const s = pres.addSlide(); setBg(s, C.bg); p++;
    header(s, "02 · OUR JOURNEY — THE RESULTS", "What Arthur showed us.");

    // Big score card on left
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y: 1.6, w: 3.3, h: 3.5,
      fill: { color: C.sageDeep }, line: { color: C.sageDeep, width: 0 },
    });
    s.addText("OVERALL", {
      x: 0.7, y: 1.8, w: 2.9, h: 0.3,
      fontFace: SANS, fontSize: 10, bold: true, charSpacing: 4, color: C.sageSoft, margin: 0,
    });
    s.addText("9/10", {
      x: 0.6, y: 2.15, w: 3.1, h: 1.4,
      fontFace: SERIF, fontSize: 80, bold: true, italic: true, color: "FFFFFF", align: "center", margin: 0,
    });
    s.addText("Ready for smartwatch-AAC.", {
      x: 0.7, y: 3.7, w: 2.9, h: 0.4,
      fontFace: SANS, fontSize: 12, italic: true, color: C.sageSoft, align: "center", margin: 0,
    });
    s.addText("11 April 2026", {
      x: 0.7, y: 4.5, w: 2.9, h: 0.3,
      fontFace: MONO, fontSize: 9, color: C.amberSoft, align: "center", margin: 0,
    });

    // Right — domain breakdown chart
    s.addChart(pres.charts.BAR, [{
      name: "Score",
      labels: [
        "Reaction Tap", "Accuracy Tap", "Long Press", "Button Sizes",
        "Scroll Test", "Drag & Drop",
        "Image Recall", "Symbol Matching",
        "Preference 2", "Preference 4", "Audio Wait",
        "Double Tap*", "Scroll & Find*", "Verb–Noun*", "V–N–Adj*",
      ],
      values: [10, 10, 10, 10, 5, 3, 10, 8, 10, 9, 10, 0, 0, 0, 0],
    }], {
      x: 4.0, y: 1.6, w: 5.7, h: 3.5,
      barDir: "bar",
      chartColors: [C.sageDeep],
      chartArea: { fill: { color: C.bg } },
      plotArea: { fill: { color: C.bg } },
      catAxisLabelColor: C.ink2, catAxisLabelFontFace: SANS, catAxisLabelFontSize: 8,
      valAxisLabelColor: C.ink3, valAxisLabelFontFace: SANS, valAxisLabelFontSize: 8,
      valAxisMaxVal: 10, valAxisMinVal: 0,
      valGridLine: { color: C.line, size: 0.5 },
      catGridLine: { style: "none" },
      showValue: true, dataLabelColor: C.ink, dataLabelFontFace: SANS, dataLabelFontSize: 8,
      dataLabelPosition: "outEnd",
      showLegend: false,
    });

    s.addText("* Skipped — not refused on capability grounds, but a clear signal: don't impose these patterns.", {
      x: 4.0, y: 4.85, w: 5.7, h: 0.3,
      fontFace: SANS, fontSize: 9, italic: true, color: C.ink3, margin: 0,
    });

    footer(s, p, TOTAL);
  }

  // ─── 15 · TEST → PRODUCT BRIDGE ────────────────────────────────────
  {
    const s = pres.addSlide(); setBg(s, C.bg); p++;
    header(s, "02 · OUR JOURNEY — THE BRIDGE", "From scores to UI decisions.");

    // Three-column: Skipped → Avoid; Aced → Lean on; Mixed → Adapt
    const cols = [
      {
        head: "ACED",
        color: C.sageDeep, soft: C.sageSoft,
        items: [
          "Reaction Tap (10/10)",
          "Accuracy Tap (10/10)",
          "Long Press (10/10)",
          "Image Recall (10/10)",
          "Audio Wait (10/10)",
        ],
        action: "Build on these.",
        tail: "Large tap targets, hold-to-confirm, image-led navigation, audio cues."
      },
      {
        head: "MIXED",
        color: C.amber, soft: C.amberSoft,
        items: [
          "Symbol Matching (8/10)",
          "Scroll Test (5/10)",
          "Drag & Drop (3/10)",
        ],
        action: "Adapt around them.",
        tail: "Scroll replaced by paged swipe. No drag-and-drop in any flow. Symbol vocabulary kept small, recognised over recalled."
      },
      {
        head: "SKIPPED",
        color: C.rose, soft: C.roseSoft,
        items: [
          "Double Tap",
          "Scroll & Find",
          "Verb–Noun pairing",
          "Verb–Noun–Adj pairing",
        ],
        action: "Don't impose these.",
        tail: "Single-tap interactions only. No grammatical sentence-building UI. Pre-built phrase cards instead."
      },
    ];

    cols.forEach((c, i) => {
      const x = 0.5 + i * 3.1;
      s.addShape(pres.shapes.RECTANGLE, {
        x, y: 1.65, w: 3.0, h: 3.5,
        fill: { color: C.surface }, line: { color: C.line, width: 1 },
      });
      s.addShape(pres.shapes.RECTANGLE, {
        x, y: 1.65, w: 3.0, h: 0.18,
        fill: { color: c.color }, line: { color: c.color, width: 0 },
      });
      s.addText(c.head, {
        x: x + 0.2, y: 1.95, w: 2.6, h: 0.3,
        fontFace: SANS, fontSize: 10, bold: true, charSpacing: 6, color: c.color, margin: 0,
      });
      s.addText(c.items.map((it, j) => ({
        text: it,
        options: { breakLine: j < c.items.length - 1, color: C.ink2 },
      })), {
        x: x + 0.2, y: 2.3, w: 2.6, h: 1.5,
        fontFace: SANS, fontSize: 11, margin: 0, valign: "top", paraSpaceAfter: 2,
      });
      s.addShape(pres.shapes.LINE, {
        x: x + 0.2, y: 3.85, w: 2.6, h: 0,
        line: { color: C.line, width: 0.75 },
      });
      s.addText(c.action, {
        x: x + 0.2, y: 3.95, w: 2.6, h: 0.3,
        fontFace: SERIF, fontSize: 13, bold: true, italic: true, color: c.color, margin: 0,
      });
      s.addText(c.tail, {
        x: x + 0.2, y: 4.25, w: 2.6, h: 0.85,
        fontFace: SANS, fontSize: 10, color: C.ink3, margin: 0,
      });
    });

    footer(s, p, TOTAL);
  }

  // ─── 16 · OUR PRODUCTS — DIVIDER ───────────────────────────────────
  {
    const s = pres.addSlide(); setBg(s, C.bg); p++;

    s.addText("03", {
      x: 0.55, y: 0.7, w: 2, h: 1.4,
      fontFace: SERIF, fontSize: 96, italic: true, color: C.amber, margin: 0,
    });
    s.addShape(pres.shapes.LINE, {
      x: 0.6, y: 2.1, w: 0.7, h: 0,
      line: { color: C.amber, width: 1.5 },
    });
    s.addText("What we built.", {
      x: 0.55, y: 2.2, w: 9, h: 1.2,
      fontFace: SERIF, fontSize: 60, italic: true, color: C.ink, margin: 0,
    });
    s.addText("Two phones, one watch, one assessment — sharing one back-end.", {
      x: 0.55, y: 3.5, w: 9, h: 0.6,
      fontFace: SANS, fontSize: 16, color: C.ink2, italic: true, margin: 0,
    });

    footer(s, p, TOTAL);
  }

  // ─── 17 · ARCHITECTURE ─────────────────────────────────────────────
  {
    const s = pres.addSlide(); setBg(s, C.bg); p++;
    header(s, "03 · OUR PRODUCTS — ARCHITECTURE", "How Sawa is built.");

    // ── Architecture diagram (5 boxes + arrows) ──
    // Layout: 3 columns
    //  Col 1 (left):  Caregiver phone (Jaki)
    //  Col 2 (center): Supabase (Auth + DB + Realtime)
    //  Col 3 (right): Arthur's phone + Smartwatch (M11)

    const boxStyle = (color) => ({
      fill: { color: C.surface }, line: { color, width: 1.5 },
    });

    // Center hub — Supabase
    s.addShape(pres.shapes.RECTANGLE, {
      x: 4.0, y: 2.5, w: 2.0, h: 1.4, ...boxStyle(C.sageDeep)
    });
    s.addText("Supabase", {
      x: 4.0, y: 2.6, w: 2.0, h: 0.4,
      fontFace: SERIF, fontSize: 16, bold: true, italic: true, color: C.sageDeep, align: "center", margin: 0,
    });
    s.addText([
      { text: "Auth", options: { breakLine: true } },
      { text: "Postgres tables", options: { breakLine: true } },
      { text: "Realtime channels", options: {} },
    ], {
      x: 4.0, y: 3.0, w: 2.0, h: 0.85,
      fontFace: MONO, fontSize: 9, color: C.ink2, align: "center", margin: 0, paraSpaceAfter: 1,
    });

    // Left — Jaki phone
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y: 1.85, w: 2.6, h: 2.7, ...boxStyle(C.sky)
    });
    s.addText("Jaki — Caregiver", {
      x: 0.5, y: 1.95, w: 2.6, h: 0.4,
      fontFace: SERIF, fontSize: 14, bold: true, italic: true, color: C.sky, align: "center", margin: 0,
    });
    s.addText([
      { text: "React 19 + Vite", options: { breakLine: true } },
      { text: "Capacitor → Android APK", options: { breakLine: true } },
      { text: "Activity feed, routines,", options: { breakLine: true } },
      { text: "geofence, AAC log,", options: { breakLine: true } },
      { text: "screen-time limits", options: {} },
    ], {
      x: 0.6, y: 2.4, w: 2.4, h: 2.0,
      fontFace: SANS, fontSize: 10, color: C.ink2, align: "center", margin: 0, paraSpaceAfter: 1,
    });

    // Right top — Arthur phone
    s.addShape(pres.shapes.RECTANGLE, {
      x: 6.9, y: 1.7, w: 2.6, h: 1.7, ...boxStyle(C.amber)
    });
    s.addText("Arthur — Companion", {
      x: 6.9, y: 1.8, w: 2.6, h: 0.4,
      fontFace: SERIF, fontSize: 14, bold: true, italic: true, color: C.amber, align: "center", margin: 0,
    });
    s.addText([
      { text: "Quick-message AAC cards,", options: { breakLine: true } },
      { text: "live routine, SOS hold-press", options: {} },
    ], {
      x: 7.0, y: 2.25, w: 2.4, h: 1.0,
      fontFace: SANS, fontSize: 10, color: C.ink2, align: "center", margin: 0,
    });

    // Right bottom — M11 watch
    s.addShape(pres.shapes.RECTANGLE, {
      x: 6.9, y: 3.55, w: 2.6, h: 1.5, ...boxStyle(C.plum)
    });
    s.addText("M11 Smartwatch", {
      x: 6.9, y: 3.65, w: 2.6, h: 0.4,
      fontFace: SERIF, fontSize: 14, bold: true, italic: true, color: C.plum, align: "center", margin: 0,
    });
    s.addText([
      { text: "GPS + accelerometer", options: { breakLine: true } },
      { text: "Geofence breach → SOS", options: {} },
    ], {
      x: 7.0, y: 4.1, w: 2.4, h: 1.0,
      fontFace: SANS, fontSize: 10, color: C.ink2, align: "center", margin: 0,
    });

    // Arrows (lines with colour) — Supabase ↔ each device
    const arrow = (x1, y1, x2, y2, color) => {
      s.addShape(pres.shapes.LINE, {
        x: x1, y: y1, w: x2 - x1, h: y2 - y1,
        line: { color, width: 2, dashType: "dash", endArrowType: "triangle", beginArrowType: "triangle" },
      });
    };
    arrow(3.1, 3.2, 4.0, 3.2, C.sky);     // Jaki ↔ Supabase
    arrow(6.0, 2.8, 6.9, 2.55, C.amber);  // Supabase ↔ Arthur
    arrow(6.0, 3.6, 6.9, 4.3, C.plum);    // Supabase ↔ M11

    // Bottom — tables list
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y: 4.85, w: 9, h: 0.5,
      fill: { color: C.surface2 }, line: { color: C.surface2, width: 0 },
    });
    s.addText([
      { text: "TABLES   ", options: { bold: true, color: C.ink3, charSpacing: 3 } },
      { text: "users · events · locations · notifications", options: { color: C.ink2 } },
      { text: "    REALTIME   ", options: { bold: true, color: C.ink3, charSpacing: 3 } },
      { text: "watch event INSERT → SOS overlay on Jaki within 2s", options: { color: C.ink2 } },
    ], {
      x: 0.7, y: 4.92, w: 8.6, h: 0.4,
      fontFace: MONO, fontSize: 9, margin: 0, valign: "middle",
    });

    footer(s, p, TOTAL);
  }

  // ─── 18 · JAKI — CAREGIVER PHONE ───────────────────────────────────
  {
    const s = pres.addSlide(); setBg(s, C.bg); p++;
    header(s, "03 · OUR PRODUCTS — CAREGIVER", "Jaki — the caregiver phone.", { eyebrowColor: C.sky });

    // Left — phone-shaped mockup placeholder
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.7, y: 1.7, w: 2.6, h: 3.5,
      fill: { color: C.skySoft }, line: { color: C.sky, width: 1.5 }, rectRadius: 0.18,
    });
    // Status bar
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.85, y: 1.85, w: 2.3, h: 0.3,
      fill: { color: C.surface }, line: { color: C.surface, width: 0 },
    });
    s.addText("9:41", {
      x: 0.95, y: 1.88, w: 1, h: 0.25,
      fontFace: SANS, fontSize: 9, bold: true, color: C.ink, margin: 0,
    });
    // Header card
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.85, y: 2.25, w: 2.3, h: 0.55,
      fill: { color: C.surface }, line: { color: C.surface, width: 0 },
    });
    s.addText("Hi Jaki", {
      x: 0.95, y: 2.3, w: 2.1, h: 0.25,
      fontFace: SERIF, fontSize: 11, bold: true, color: C.ink, margin: 0,
    });
    s.addText("Arthur — at home", {
      x: 0.95, y: 2.55, w: 2.1, h: 0.2,
      fontFace: SANS, fontSize: 8, color: C.ink3, margin: 0,
    });
    // Activity feed items
    for (let i = 0; i < 4; i++) {
      const y = 2.95 + i * 0.5;
      s.addShape(pres.shapes.RECTANGLE, {
        x: 0.85, y, w: 2.3, h: 0.4,
        fill: { color: C.surface }, line: { color: C.surface, width: 0 },
      });
      s.addShape(pres.shapes.OVAL, {
        x: 0.95, y: y + 0.08, w: 0.2, h: 0.2,
        fill: { color: i === 0 ? C.sage : i === 1 ? C.amber : C.line2 }, line: { color: "FFFFFF", width: 0 },
      });
      s.addText(["Routine: lunch ✓", "AAC: 'water please'", "Geofence enter: home", "Screen time 23 min"][i], {
        x: 1.2, y: y + 0.05, w: 1.95, h: 0.25,
        fontFace: SANS, fontSize: 8, color: C.ink, margin: 0,
      });
    }

    // Right — feature list
    s.addText("What Jaki sees & controls:", {
      x: 4.0, y: 1.7, w: 5.5, h: 0.4,
      fontFace: SERIF, fontSize: 18, italic: true, color: C.ink, margin: 0,
    });
    const feats = [
      ["Activity feed", "Live stream of Arthur's actions, routine progress, AAC messages, location events."],
      ["Routine builder", "Drag-free, swipe-only routine editor — Arthur's phone reflects updates instantly."],
      ["Safe-zone map", "Geofence around home, school, therapy. Breach triggers SOS overlay."],
      ["Screen-time limits", "Per-app caps, with positive nudges rather than hard locks."],
      ["AAC log + history", "Full record of what Arthur communicated and when."],
    ];
    feats.forEach((f, i) => {
      const y = 2.2 + i * 0.55;
      brandDot(s, 4.05, y + 0.17, 0.10, C.sky);
      s.addText(f[0], {
        x: 4.2, y, w: 5.3, h: 0.28,
        fontFace: SANS, fontSize: 12, bold: true, color: C.ink, margin: 0,
      });
      s.addText(f[1], {
        x: 4.2, y: y + 0.27, w: 5.3, h: 0.3,
        fontFace: SANS, fontSize: 10, color: C.ink3, margin: 0,
      });
    });

    footer(s, p, TOTAL);
  }

  // ─── 19 · ARTHUR'S PHONE ───────────────────────────────────────────
  {
    const s = pres.addSlide(); setBg(s, C.bg); p++;
    header(s, "03 · OUR PRODUCTS — COMPANION", "Arthur's phone.", { eyebrowColor: C.amber });

    // Left — companion phone mockup (smaller, dark theme)
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.9, y: 1.8, w: 2.2, h: 3.3,
      fill: { color: C.ink }, line: { color: C.amber, width: 1.5 }, rectRadius: 0.18,
    });
    s.addText("9:41", {
      x: 1.05, y: 1.95, w: 1, h: 0.2,
      fontFace: SANS, fontSize: 8, bold: true, color: C.amberSoft, margin: 0,
    });
    s.addText("Hi, Arthur", {
      x: 1.05, y: 2.25, w: 1.9, h: 0.3,
      fontFace: SERIF, fontSize: 13, bold: true, italic: true, color: "FFFFFF", margin: 0,
    });
    // 2x2 quick-message grid
    const cards = [
      { label: "Water", color: C.sky },
      { label: "Hungry", color: C.amber },
      { label: "Hurt", color: C.rose },
      { label: "Toilet", color: C.plum },
    ];
    cards.forEach((c, i) => {
      const cx = 1.05 + (i % 2) * 0.95;
      const cy = 2.65 + Math.floor(i / 2) * 1.0;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: cx, y: cy, w: 0.85, h: 0.85,
        fill: { color: c.color }, line: { color: c.color, width: 0 }, rectRadius: 0.08,
      });
      s.addText(c.label, {
        x: cx, y: cy + 0.55, w: 0.85, h: 0.25,
        fontFace: SANS, fontSize: 9, bold: true, color: "FFFFFF", align: "center", margin: 0,
      });
    });
    // SOS button
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 1.05, y: 4.65, w: 1.85, h: 0.35,
      fill: { color: C.rose }, line: { color: C.rose, width: 0 }, rectRadius: 0.08,
    });
    s.addText("Hold for SOS", {
      x: 1.05, y: 4.7, w: 1.85, h: 0.25,
      fontFace: SANS, fontSize: 9, bold: true, color: "FFFFFF", align: "center", margin: 0,
    });

    // Right — feature list
    s.addText("What Arthur uses:", {
      x: 4.0, y: 1.7, w: 5.5, h: 0.4,
      fontFace: SERIF, fontSize: 18, italic: true, color: C.ink, margin: 0,
    });
    const feats = [
      ["4-card AAC home", "One tap = one phrase, sent to Jaki's feed. No menus, no nesting."],
      ["Live routine", "Today's steps, in order. Tap to mark done. Auto-advances to the next."],
      ["SOS hold-press", "0.8s hold sends location + alert to Jaki — paired to the watch's accelerometer trigger."],
      ["Real clock", "Live time and weekday — no abstract calendars, no notifications stack."],
      ["Single-tap, large targets", "Every interaction validated against the assessment scores."],
    ];
    feats.forEach((f, i) => {
      const y = 2.2 + i * 0.55;
      brandDot(s, 4.05, y + 0.17, 0.10, C.amber);
      s.addText(f[0], {
        x: 4.2, y, w: 5.3, h: 0.28,
        fontFace: SANS, fontSize: 12, bold: true, color: C.ink, margin: 0,
      });
      s.addText(f[1], {
        x: 4.2, y: y + 0.27, w: 5.3, h: 0.3,
        fontFace: SANS, fontSize: 10, color: C.ink3, margin: 0,
      });
    });

    footer(s, p, TOTAL);
  }

  // ─── 20 · SMARTWATCH (M11) ─────────────────────────────────────────
  {
    const s = pres.addSlide(); setBg(s, C.bg); p++;
    header(s, "03 · OUR PRODUCTS — WEARABLE", "M11 — the smartwatch companion.", { eyebrowColor: C.plum });

    // Left — watch mockup (rounded square)
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 1.1, y: 1.9, w: 2.0, h: 2.5,
      fill: { color: C.ink }, line: { color: C.plum, width: 2 }, rectRadius: 0.3,
    });
    // Watch screen content
    s.addText("9:41", {
      x: 1.1, y: 2.2, w: 2.0, h: 0.6,
      fontFace: SERIF, fontSize: 32, bold: true, italic: true, color: "FFFFFF", align: "center", margin: 0,
    });
    s.addText("Tue 8 May", {
      x: 1.1, y: 2.85, w: 2.0, h: 0.25,
      fontFace: SANS, fontSize: 9, color: C.amberSoft, align: "center", margin: 0,
    });
    // Status pill
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 1.4, y: 3.25, w: 1.4, h: 0.5,
      fill: { color: C.sageDeep }, line: { color: C.sageDeep, width: 0 }, rectRadius: 0.25,
    });
    s.addText("In safe zone", {
      x: 1.4, y: 3.35, w: 1.4, h: 0.3,
      fontFace: SANS, fontSize: 9, bold: true, color: "FFFFFF", align: "center", margin: 0,
    });
    // Watch strap hints
    s.addShape(pres.shapes.RECTANGLE, {
      x: 1.85, y: 1.4, w: 0.5, h: 0.5,
      fill: { color: C.line2 }, line: { color: C.line2, width: 0 },
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 1.85, y: 4.4, w: 0.5, h: 0.5,
      fill: { color: C.line2 }, line: { color: C.line2, width: 0 },
    });

    // Right — feature list
    s.addText("Why a watch, not a wristband:", {
      x: 4.0, y: 1.7, w: 5.5, h: 0.4,
      fontFace: SERIF, fontSize: 18, italic: true, color: C.ink, margin: 0,
    });
    const feats = [
      ["GPS + cellular fallback", "Continuous location reporting. Works without the phone in range."],
      ["Geofence breach detection", "Crosses a zone edge → SOS event → Jaki's phone within ~2s via Supabase Realtime."],
      ["Accelerometer fall/run trigger", "Sudden movement signature triggers a check-in or SOS, no manual input needed."],
      ["Caregiver-friendly clasp", "Tamper-resistant strap — addresses the most common complaint with assistive wearables."],
      ["Screen for routines", "Mirrors today's routine; vibrates at transitions."],
    ];
    feats.forEach((f, i) => {
      const y = 2.2 + i * 0.55;
      brandDot(s, 4.05, y + 0.17, 0.10, C.plum);
      s.addText(f[0], {
        x: 4.2, y, w: 5.3, h: 0.28,
        fontFace: SANS, fontSize: 12, bold: true, color: C.ink, margin: 0,
      });
      s.addText(f[1], {
        x: 4.2, y: y + 0.27, w: 5.3, h: 0.3,
        fontFace: SANS, fontSize: 10, color: C.ink3, margin: 0,
      });
    });

    footer(s, p, TOTAL);
  }

  // ─── 21 · DEMO PLACEHOLDER ─────────────────────────────────────────
  {
    const s = pres.addSlide(); setBg(s, C.ink); p++;

    s.addText("LIVE", {
      x: 0.55, y: 0.55, w: 5, h: 0.3,
      fontFace: SANS, fontSize: 11, bold: true, charSpacing: 6, color: C.amber, margin: 0,
    });
    s.addText("Demo.", {
      x: 0.55, y: 1.0, w: 9, h: 2.5,
      fontFace: SERIF, fontSize: 160, bold: true, italic: true, color: "FFFFFF", margin: 0,
    });
    s.addShape(pres.shapes.LINE, {
      x: 0.55, y: 4.0, w: 0.9, h: 0,
      line: { color: C.amber, width: 1.5 },
    });
    s.addText("Jaki opens app → Arthur sends 'water please' → SOS fires from the watch → Jaki sees it.", {
      x: 0.55, y: 4.2, w: 9, h: 0.6,
      fontFace: SANS, fontSize: 14, italic: true, color: C.line2, margin: 0,
    });
    s.addText("APK on Hackcessible_Pixel6 emulator + arthur.html in browser tab + Supabase dashboard.", {
      x: 0.55, y: 4.85, w: 9, h: 0.3,
      fontFace: MONO, fontSize: 10, color: C.ink4, margin: 0,
    });
  }

  // ─── 22 · POST-HACKCESSIBLE — PERSONALISED UI ──────────────────────
  {
    const s = pres.addSlide(); setBg(s, C.bg); p++;
    header(s, "04 · POST-HACKCESSIBLE — ROADMAP", "Where we go next.");

    // Two big tiles
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y: 1.65, w: 4.4, h: 3.5,
      fill: { color: C.surface }, line: { color: C.line, width: 1 },
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y: 1.65, w: 4.4, h: 0.18,
      fill: { color: C.sageDeep }, line: { color: C.sageDeep, width: 0 },
    });
    s.addText("01 · Assessment-driven UI", {
      x: 0.7, y: 1.95, w: 4.0, h: 0.35,
      fontFace: SERIF, fontSize: 18, bold: true, italic: true, color: C.ink, margin: 0,
    });
    s.addText("Each Sawa install begins with the assessment. Scores write directly into a UI config — buttons, vocab, gestures, audio cues — that the apps load on first run.", {
      x: 0.7, y: 2.35, w: 4.0, h: 1.2,
      fontFace: SANS, fontSize: 12, color: C.ink2, margin: 0,
    });
    s.addText([
      { text: "Drag score < 5", options: { bold: true, color: C.sageDeep, breakLine: true } },
      { text: "→ no drag interactions in any flow.", options: { color: C.ink3, breakLine: true } },
      { text: "Symbol Matching ≥ 8", options: { bold: true, color: C.sageDeep, breakLine: true } },
      { text: "→ unlock symbol-based contact dialing.", options: { color: C.ink3, breakLine: true } },
      { text: "Verb–Noun = 0", options: { bold: true, color: C.sageDeep, breakLine: true } },
      { text: "→ phrases stay pre-built, never composed.", options: { color: C.ink3 } },
    ], {
      x: 0.7, y: 3.55, w: 4.0, h: 1.5,
      fontFace: MONO, fontSize: 9, margin: 0, valign: "top", paraSpaceAfter: 0,
    });

    s.addShape(pres.shapes.RECTANGLE, {
      x: 5.1, y: 1.65, w: 4.4, h: 3.5,
      fill: { color: C.surface }, line: { color: C.line, width: 1 },
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 5.1, y: 1.65, w: 4.4, h: 0.18,
      fill: { color: C.plum }, line: { color: C.plum, width: 0 },
    });
    s.addText("02 · Watch as a child-finder", {
      x: 5.3, y: 1.95, w: 4.0, h: 0.35,
      fontFace: SERIF, fontSize: 18, bold: true, italic: true, color: C.ink, margin: 0,
    });
    s.addText("Closing the gap that 1-in-3 nonverbal kids face: cannot say their name when found. The watch carries identity, location, and caregiver contact in one glance.", {
      x: 5.3, y: 2.35, w: 4.0, h: 1.2,
      fontFace: SANS, fontSize: 12, color: C.ink2, margin: 0,
    });
    s.addText([
      { text: "Geofence breach", options: { bold: true, color: C.plum, breakLine: true } },
      { text: "→ Jaki + secondary contact paged in <2s.", options: { color: C.ink3, breakLine: true } },
      { text: "QR badge on the dial", options: { bold: true, color: C.plum, breakLine: true } },
      { text: "→ a finder gets caregiver phone instantly.", options: { color: C.ink3, breakLine: true } },
      { text: "Offline beacon (BLE)", options: { bold: true, color: C.plum, breakLine: true } },
      { text: "→ helps recovery in low-signal areas.", options: { color: C.ink3 } },
    ], {
      x: 5.3, y: 3.55, w: 4.0, h: 1.5,
      fontFace: MONO, fontSize: 9, margin: 0, valign: "top", paraSpaceAfter: 0,
    });

    footer(s, p, TOTAL);
  }

  // ─── 23 · ASKS ─────────────────────────────────────────────────────
  {
    const s = pres.addSlide(); setBg(s, C.bg); p++;
    header(s, "04 · POST-HACKCESSIBLE — WHAT WE NEED", "How you can help.");

    const asks = [
      { head: "Pilot families",   sub: "5–10 households in Nairobi for a 12-week field trial — caregivers + young people on the spectrum.",      tag: "FAMILIES" },
      { head: "Clinical mentors", sub: "Paediatric neurodevelopment specialists to validate the assessment battery against ADOS-2 / DSM-5-TR.",   tag: "CLINICAL" },
      { head: "Hardware partners",sub: "M11-compatible watch supply chain — bulk procurement, tamper-resistant straps, eSIM provisioning.",      tag: "HARDWARE" },
      { head: "Funding",          sub: "Seed grant for the 12-week pilot, watch fleet, and a part-time field coordinator.",                       tag: "FUNDING" },
    ];

    asks.forEach((a, i) => {
      const y = 1.7 + i * 0.78;
      s.addShape(pres.shapes.RECTANGLE, {
        x: 0.5, y, w: 9, h: 0.7,
        fill: { color: C.surface }, line: { color: C.line, width: 1 },
      });
      // Tag pill
      s.addShape(pres.shapes.RECTANGLE, {
        x: 0.7, y: y + 0.15, w: 1.4, h: 0.4,
        fill: { color: C.sageSoft }, line: { color: C.sageSoft, width: 0 },
      });
      s.addText(a.tag, {
        x: 0.7, y: y + 0.2, w: 1.4, h: 0.3,
        fontFace: SANS, fontSize: 9, bold: true, charSpacing: 3, color: C.sageDeep, align: "center", margin: 0,
      });
      s.addText(a.head, {
        x: 2.3, y: y + 0.08, w: 7, h: 0.3,
        fontFace: SANS, fontSize: 13, bold: true, color: C.ink, margin: 0,
      });
      s.addText(a.sub, {
        x: 2.3, y: y + 0.36, w: 7, h: 0.3,
        fontFace: SANS, fontSize: 10, color: C.ink3, margin: 0,
      });
    });

    footer(s, p, TOTAL);
  }

  // ─── 24 · TEAM + Q&A ───────────────────────────────────────────────
  {
    const s = pres.addSlide(); setBg(s, C.bg); p++;

    s.addText("THANK YOU", {
      x: 0.55, y: 0.55, w: 5, h: 0.3,
      fontFace: SANS, fontSize: 11, bold: true, charSpacing: 6, color: C.sage, margin: 0,
    });

    s.addText("Sawa.", {
      x: 0.55, y: 1.0, w: 9, h: 1.6,
      fontFace: SERIF, fontSize: 110, bold: true, italic: true, color: C.ink, margin: 0,
    });

    s.addShape(pres.shapes.LINE, {
      x: 0.55, y: 2.85, w: 0.9, h: 0,
      line: { color: C.sageDeep, width: 1.5 },
    });

    s.addText("A collaboration of:", {
      x: 0.55, y: 3.0, w: 9, h: 0.4,
      fontFace: SANS, fontSize: 12, italic: true, color: C.ink3, margin: 0,
    });

    s.addText([
      { text: "Aga Khan University Medical School", options: { bold: true, color: C.ink, breakLine: true } },
      { text: "Kenyatta University Biomedical Engineering", options: { bold: true, color: C.ink, breakLine: true } },
      { text: " ", options: { fontSize: 6, breakLine: true } },
      { text: "Hosted by CIME — Centre for Innovation in Medical Education, Aga Khan University", options: { italic: true, color: C.ink2 } },
    ], {
      x: 0.55, y: 3.4, w: 9, h: 1.4,
      fontFace: SANS, fontSize: 14, margin: 0, valign: "top",
    });

    // Three brand dots — close
    brandDot(s, 0.55, H - 0.55, 0.18, C.sage);
    brandDot(s, 0.85, H - 0.55, 0.12, C.amber);
    brandDot(s, 1.10, H - 0.55, 0.08, C.rose);

    s.addText("Questions welcome.", {
      x: 1.5, y: H - 0.7, w: 7, h: 0.4,
      fontFace: SERIF, fontSize: 16, italic: true, color: C.ink2, margin: 0,
    });
  }

  // ── Write file ───────────────────────────────────────────────────────
  await pres.writeFile({ fileName: "Sawa_Hackcessible_2026.pptx" });
  console.log(`Wrote deck with ${p} slides (TOTAL=${TOTAL}).`);
}

build().catch(e => { console.error(e); process.exit(1); });
