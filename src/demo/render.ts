"use client";

import type { DocSpec } from "./scenarios";

// Draws fictional specimen documents. Layouts are generic and deliberately do not
// reproduce official emblems, logos or security features.

export interface TextRun {
  text: string;
  x: number;
  y: number; // baseline
  size: number;
}

const LATIN = `"Helvetica Neue", Arial, sans-serif`;
const DEV = `"Noto Sans Devanagari", ${LATIN}`;

let fontReady: Promise<void> | null = null;
export function ensureFonts(): Promise<void> {
  if (!fontReady) {
    fontReady = (async () => {
      const face = new FontFace("Noto Sans Devanagari", "url(/fonts/NotoSansDevanagari-Regular.ttf)");
      document.fonts.add(await face.load());
    })();
  }
  return fontReady;
}

class Painter {
  runs: TextRun[] = [];
  ctx: CanvasRenderingContext2D;
  constructor(public canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d")!;
  }
  bg(color: string) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
  rect(x: number, y: number, w: number, h: number, fill?: string, stroke?: string, lw = 2) {
    if (fill) {
      this.ctx.fillStyle = fill;
      this.ctx.fillRect(x, y, w, h);
    }
    if (stroke) {
      this.ctx.strokeStyle = stroke;
      this.ctx.lineWidth = lw;
      this.ctx.strokeRect(x, y, w, h);
    }
  }
  line(x1: number, y1: number, x2: number, y2: number, color = "#999", lw = 1.5) {
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = lw;
    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.stroke();
  }
  /** Draws text and records it for the PDF text layer. */
  t(text: string, x: number, y: number, size = 26, opts: { bold?: boolean; color?: string; align?: "left" | "center" | "right"; record?: boolean } = {}) {
    if (!text) return;
    const dev = /[ऀ-ॿ₹]/.test(text);
    this.ctx.font = `${opts.bold ? "700" : "400"} ${size}px ${dev ? DEV : LATIN}`;
    this.ctx.fillStyle = opts.color ?? "#1d1d1f";
    const w = this.ctx.measureText(text).width;
    const left = opts.align === "center" ? x - w / 2 : opts.align === "right" ? x - w : x;
    this.ctx.textBaseline = "alphabetic";
    this.ctx.fillText(text, left, y);
    if (opts.record !== false) this.runs.push({ text, x: left, y, size });
  }
  watermark(text = "SPECIMEN · FICTIONAL DEMO DATA") {
    const { ctx, canvas } = this;
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(-Math.atan2(canvas.height, canvas.width));
    ctx.font = `700 ${Math.round(canvas.width / 16)}px ${LATIN}`;
    ctx.fillStyle = "rgba(200, 40, 40, 0.10)";
    ctx.textAlign = "center";
    ctx.fillText(text, 0, 0);
    ctx.restore();
  }
  footer(text: string) {
    this.t(text, this.canvas.width / 2, this.canvas.height - 22, 17, { color: "#8a8a8a", align: "center", record: false });
  }
}

function make(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return new Painter(c);
}

const DEMO_FOOTER = "RejectLess demo sandbox · fictional person · not a real document";

// ---------------------------------------------------------------------------- layouts

function aadhaar(d: Record<string, string>) {
  const p = make(1100, 700);
  p.bg("#fbfaf7");
  p.rect(0, 0, 1100, 96, "#f1e3c8");
  p.rect(0, 96, 1100, 6, "#d9822b");
  p.t("भारत सरकार", 40, 46, 30, { bold: true });
  p.t("Government of India", 40, 84, 26, { bold: true });
  p.t("Aadhaar · specimen layout", 1060, 62, 22, { align: "right", color: "#7a5a2a" });
  p.rect(48, 140, 220, 270, "#e7e3da", "#c9c2b5");
  p.t("PHOTO", 158, 285, 22, { align: "center", color: "#9a948a", record: false });
  p.t(d.nameLocal, 310, 180, 34);
  p.t(d.name, 310, 228, 32, { bold: true });
  if (d.dob) p.t(`जन्म तिथि / DOB: ${d.dob}`, 310, 284, 28);
  else p.t(`जन्म वर्ष / Year of Birth: ${d.yob}`, 310, 284, 28);
  p.t(`${d.genderLocal} / ${d.gender.toUpperCase()}`, 310, 336, 28);
  p.line(40, 470, 1060, 470, "#d9822b", 3);
  p.t(`XXXX XXXX ${d.last4}`, 550, 548, 52, { bold: true, align: "center" });
  p.t("Masked Aadhaar: only the last 4 digits are shown", 550, 600, 22, { align: "center", color: "#666" });
  p.watermark();
  p.footer(DEMO_FOOTER);
  return p;
}

function pan(d: Record<string, string>) {
  const p = make(1100, 700);
  p.bg("#eef3f7");
  p.rect(0, 0, 1100, 110, "#d7e4ee");
  p.t("आयकर विभाग", 40, 48, 28, { bold: true });
  p.t("INCOME TAX DEPARTMENT", 40, 88, 28, { bold: true });
  p.t("e-PAN · specimen layout", 1060, 64, 22, { align: "right", color: "#3d5a73" });
  p.t("स्थायी लेखा संख्या कार्ड / Permanent Account Number Card", 40, 158, 24, { color: "#3d5a73" });
  p.t(d.pan, 40, 214, 44, { bold: true });
  p.t("नाम / Name", 40, 280, 22, { color: "#555" });
  p.t(d.name, 40, 318, 30, { bold: true });
  p.t("पिता का नाम / Father's Name", 40, 384, 22, { color: "#555" });
  p.t(d.father, 40, 422, 30, { bold: true });
  p.t("जन्म की तारीख / Date of Birth", 40, 488, 22, { color: "#555" });
  p.t(d.dob, 40, 526, 30, { bold: true });
  p.rect(820, 260, 220, 270, "#dfe6ec", "#b7c4cf");
  p.t("PHOTO", 930, 400, 22, { align: "center", color: "#8a97a3", record: false });
  p.watermark();
  p.footer(DEMO_FOOTER);
  return p;
}

function passbook(d: Record<string, string>) {
  const p = make(1240, 900);
  p.bg("#fdfcf8");
  p.rect(0, 0, 1240, 120, "#1f4e5f");
  p.t(d.bank, 50, 62, 40, { bold: true, color: "#ffffff" });
  p.t("(fictional bank)", 50, 100, 20, { color: "#cfe3ea" });
  p.t("SAVINGS ACCOUNT PASSBOOK", 1190, 78, 26, { bold: true, align: "right", color: "#ffffff" });
  const rows: [string, string][] = [
    ["Branch", `${d.branch}, ${d.city}`],
    ["IFSC", d.ifsc],
    ["Account Holder Name", d.holder],
    ["Account No.", d.account],
    ["Account Type", "Savings"],
    ["Customer ID", `DEMO${d.account.slice(-5)}`],
    ["Nomination", "Registered"],
  ];
  rows.forEach(([k, v], i) => {
    const y = 200 + i * 78;
    p.t(`${k}: ${v}`, 70, y, 32, { bold: k === "Account Holder Name" || k === "Account No." || k === "IFSC" });
    p.line(70, y + 22, 1170, y + 22, "#e3ded3", 1);
  });
  p.t("Branch Manager (specimen — no signature)", 1170, 800, 20, { align: "right", color: "#888", record: false });
  p.watermark();
  p.footer(DEMO_FOOTER);
  return p;
}

function cheque(d: Record<string, string>) {
  const p = make(1500, 680);
  p.bg("#eef6f1");
  for (let i = 0; i < 1500; i += 18) p.line(i, 0, i + 300, 680, "rgba(31,110,80,0.05)", 1);
  p.t(d.bank, 50, 66, 38, { bold: true, color: "#1b5e45" });
  p.t(`Branch: ${d.branch}, ${d.city}`, 50, 110, 24);
  p.t(`IFSC: ${d.ifsc}`, 50, 148, 26, { bold: true });
  p.t("Date  D D M M Y Y Y Y", 1450, 70, 24, { align: "right", color: "#555", record: false });
  p.t("Pay", 50, 236, 26);
  p.line(110, 240, 1220, 240, "#7aa594");
  p.t("or Bearer", 1240, 236, 26);
  p.t("Rupees", 50, 316, 26);
  p.line(150, 320, 1100, 320, "#7aa594");
  p.rect(1120, 280, 330, 60, undefined, "#7aa594");
  p.t(`A/c No. ${d.account}`, 50, 420, 32, { bold: true });
  p.t(d.holder, 1430, 500, 28, { bold: true, align: "right" });
  p.t("Please sign above", 1430, 540, 22, { align: "right", color: "#555" });
  p.t("000123  800012003  10", 400, 630, 30, { color: "#333", record: false });
  const { ctx } = p;
  ctx.save();
  ctx.translate(750, 340);
  ctx.rotate(-0.12);
  ctx.font = `700 120px ${LATIN}`;
  ctx.strokeStyle = "rgba(190,30,30,0.75)";
  ctx.lineWidth = 5;
  ctx.textAlign = "center";
  ctx.strokeText("CANCELLED", 0, 40);
  ctx.restore();
  p.runs.push({ text: "CANCELLED", x: 450, y: 380, size: 60 });
  p.watermark();
  p.footer(DEMO_FOOTER);
  return p;
}

function epf(d: Record<string, string>) {
  const p = make(1240, 1500);
  p.bg("#ffffff");
  p.rect(0, 0, 1240, 130, "#f2f4f7");
  p.t("EPF Member Passbook", 60, 70, 40, { bold: true });
  p.t("Provident Fund · specimen layout for demonstration (fictional)", 60, 110, 22, { color: "#555" });
  const rows: [string, string][] = [
    ["Establishment Name", d.establishment],
    ["Member ID", d.memberId],
    ["UAN", d.uan],
    ["Member Name", d.name],
    ["Father/Husband Name", d.father],
    ["Date of Birth", d.dob],
    ["Date of Joining", d.doj],
    ["Date of Exit", d.doe],
  ];
  rows.forEach(([k, v], i) => p.t(`${k}: ${v}`, 60, 200 + i * 58, 28));
  const ty = 700;
  p.rect(60, ty, 1120, 56, "#eef1f5", "#cfd6df", 1);
  ["Wage Month", "Transaction", "Employee Share", "Employer Share", "Pension"].forEach((h, i) =>
    p.t(h, 80 + i * 222, ty + 37, 21, { bold: true, record: false }),
  );
  const months = ["Opening balance", "Contribution", "Contribution", "Contribution", "Interest credited"];
  months.forEach((m, i) => {
    const y = ty + 100 + i * 52;
    p.t(i === 0 ? "—" : `M-${5 - i}`, 80, y, 21, { record: false });
    p.t(m, 302, y, 21, { record: false });
    p.t(i === 0 ? "…" : "1,800", 524, y, 21, { record: false });
    p.t(i === 0 ? "…" : "550", 746, y, 21, { record: false });
    p.t(i === 0 ? "…" : "1,250", 968, y, 21, { record: false });
    p.line(60, y + 16, 1180, y + 16, "#eef1f5", 1);
  });
  p.t(`Total Balance: ₹ ${d.balance}`, 60, 1110, 32, { bold: true });
  p.t("(Employee + employer share including interest; pension shown separately)", 60, 1152, 20, { color: "#666", record: false });
  p.watermark();
  p.footer(DEMO_FOOTER);
  return p;
}

function marksheet(d: Record<string, string>) {
  const p = make(1240, 1650);
  p.bg("#fffdf6");
  p.rect(30, 30, 1180, 1590, undefined, "#b49b5a", 4);
  p.t(d.board, 620, 120, 34, { bold: true, align: "center" });
  p.t(`Senior Secondary (Class XII) Examination ${d.year}`, 620, 172, 26, { align: "center" });
  p.t("STATEMENT OF MARKS", 620, 230, 30, { bold: true, align: "center", color: "#7a5f1f" });
  const rows: [string, string][] = [
    ["Name of Candidate", d.name],
    ["Father's Name", d.father],
    ["Date of Birth", d.dob],
    ["Roll No.", d.roll],
    ["Stream", d.stream],
    ["Year of Examination", d.year],
  ];
  rows.forEach(([k, v], i) => p.t(`${k}: ${v}`, 90, 320 + i * 56, 28));
  const total = Math.round(parseFloat(d.percentage) * 5);
  const subjects = d.stream === "Science" ? ["English", "Hindi", "Physics", "Chemistry", "Mathematics"] : ["English", "Hindi", "Accountancy", "Business Studies", "Economics"];
  const base = Math.floor(total / 5);
  const marks = subjects.map((_, i) => base + (i < total - base * 5 ? 1 : 0));
  const ty = 700;
  p.rect(90, ty, 1060, 56, "#f3ecd6", "#d8c99a", 1);
  p.t("Subject", 120, ty + 37, 22, { bold: true, record: false });
  p.t("Max", 760, ty + 37, 22, { bold: true, record: false });
  p.t("Obtained", 960, ty + 37, 22, { bold: true, record: false });
  subjects.forEach((s, i) => {
    const y = ty + 100 + i * 56;
    p.t(s, 120, y, 24, { record: false });
    p.t("100", 760, y, 24, { record: false });
    p.t(String(marks[i]), 960, y, 24, { record: false });
  });
  p.t(`Total: ${total} / 500`, 90, 1130, 28, { bold: true });
  p.t(`Aggregate Percentage: ${d.percentage}`, 90, 1186, 28, { bold: true });
  p.t("Result: PASS", 90, 1242, 28, { bold: true });
  p.t("Controller of Examinations (specimen)", 1150, 1480, 22, { align: "right", color: "#777", record: false });
  p.watermark();
  p.footer(DEMO_FOOTER);
  return p;
}

function income(d: Record<string, string>) {
  const p = make(1240, 1650);
  p.bg("#ffffff");
  p.rect(30, 30, 1180, 1590, undefined, "#5b7a99", 3);
  p.t("आय प्रमाण पत्र", 620, 130, 46, { bold: true, align: "center" });
  p.t("Income Certificate", 620, 182, 28, { align: "center", color: "#444" });
  p.t("(नमूना — काल्पनिक डेटा / specimen — fictional data)", 620, 226, 22, { align: "center", color: "#888", record: false });
  const rows: [string, string][] = [
    ["प्रमाण पत्र संख्या", d.certNo],
    ["आवेदक का नाम", d.name],
    ["पिता का नाम", d.father],
    ["निवास", `${d.tehsil}, राजस्थान`],
    ["वार्षिक पारिवारिक आय", `₹ ${d.income}`],
    ["जारी करने की तिथि", d.issued],
    ["जारीकर्ता", `तहसीलदार, ${d.tehsil} (काल्पनिक कार्यालय)`],
  ];
  rows.forEach(([k, v], i) => p.t(`${k}: ${v}`, 100, 340 + i * 76, 32));
  p.t("यह प्रमाणित किया जाता है कि उपरोक्त आवेदक के परिवार की सभी स्रोतों से", 100, 940, 26, { record: false });
  p.t("वार्षिक आय ऊपर दर्शाई गई राशि है।", 100, 984, 26, { record: false });
  p.t("हस्ताक्षर (नमूना)", 1120, 1300, 26, { align: "right", color: "#666", record: false });
  p.watermark();
  p.footer(DEMO_FOOTER);
  return p;
}

function bonafide(d: Record<string, string>) {
  const p = make(1240, 1650);
  p.bg("#fcfcfa");
  p.t(d.institution, 620, 130, 38, { bold: true, align: "center" });
  p.t("(fictional institution for demonstration)", 620, 176, 22, { align: "center", color: "#777", record: false });
  p.line(90, 210, 1150, 210, "#444", 2);
  p.t("BONAFIDE CERTIFICATE", 620, 300, 34, { bold: true, align: "center" });
  p.t("This is to certify that the student named below is a bonafide student", 100, 400, 26, { record: false });
  p.t("of this institution for the academic year mentioned.", 100, 440, 26, { record: false });
  const rows: [string, string][] = [
    ["Name of Student", d.name],
    ["Course", d.course],
    ["Year of Study", d.courseYear],
    ["Mode of Study", d.mode],
    ["Academic Year", d.academicYear],
  ];
  rows.forEach(([k, v], i) => p.t(`${k}: ${v}`, 100, 540 + i * 66, 30));
  p.t("Principal (specimen)", 1140, 1200, 26, { align: "right", color: "#666", record: false });
  p.watermark();
  p.footer(DEMO_FOOTER);
  return p;
}

const LAYOUTS: Record<string, (d: Record<string, string>) => Painter> = {
  aadhaar,
  pan,
  bank_passbook: passbook,
  cancelled_cheque: cheque,
  epf_passbook: epf,
  marksheet_12: marksheet,
  income_certificate: income,
  bonafide_certificate: bonafide,
};

export async function renderSpec(spec: DocSpec): Promise<{ canvas: HTMLCanvasElement; runs: TextRun[] }> {
  await ensureFonts();
  const layout = LAYOUTS[spec.type];
  if (!layout) throw new Error(`No layout for ${spec.type}`);
  const painter = layout(spec.data);
  return { canvas: painter.canvas, runs: painter.runs };
}
