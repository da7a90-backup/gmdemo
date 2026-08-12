"use client";
import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { generateTicketIDs, type TicketID } from "@/lib/ticket-gen";
import { ticketNo } from "@/lib/ticket-format";

export type PdfBuyer = { firstName: string; lastInitial: string; city: string; state: string };
export type PdfTicketBatch = {
  drawCycle: number;
  vehicleLabel: string;
  charityName: string;
  drawDateLabel: string;
  buyer: PdfBuyer;
  orderId: string;
};

const A3_W = 842; // 297mm * 72 / 25.4
const A3_H = 1191; // 420mm * 72 / 25.4

const COLS = 3;
const ROWS = 5;
const PAGE_MARGIN = 28;
const GUTTER = 10;

const ACCENT = rgb(180 / 255, 83 / 255, 9 / 255); // deep amber — print-legible take on the marker yellow
const INK = rgb(22 / 255, 22 / 255, 26 / 255);
const MUTED = rgb(60 / 255, 60 / 255, 66 / 255);
const SUBTLE = rgb(107 / 255, 107 / 255, 112 / 255);
const DIVIDER = rgb(231 / 255, 226 / 255, 217 / 255);
const CHARITY = rgb(15 / 255, 107 / 255, 73 / 255);
const BG = rgb(250 / 255, 247 / 255, 242 / 255);

function drawTicket(opts: {
  page: PDFPage;
  x: number;
  y: number;
  w: number;
  h: number;
  id: TicketID;
  batch: PdfTicketBatch;
  fontSans: PDFFont;
  fontSansBold: PDFFont;
  fontSerif: PDFFont;
}) {
  const { page, x, y, w, h, id, batch, fontSans, fontSansBold, fontSerif } = opts;

  // Body
  page.drawRectangle({ x, y, width: w, height: h, color: BG, borderColor: DIVIDER, borderWidth: 0.75 });

  // Dashed cut line on left edge
  for (let i = 0; i < h - 8; i += 6) {
    page.drawLine({
      start: { x: x + 6, y: y + i + 4 },
      end: { x: x + 6, y: y + i + 7 },
      thickness: 0.5,
      color: DIVIDER,
    });
  }

  // Header strip
  page.drawRectangle({
    x: x + 12,
    y: y + h - 30,
    width: w - 24,
    height: 18,
    color: rgb(22 / 255, 22 / 255, 26 / 255),
  });
  page.drawText("GENEROUS MOTORS · OFFICIAL TICKET", {
    x: x + 18,
    y: y + h - 22,
    size: 7,
    font: fontSansBold,
    color: BG,
  });

  // Cycle + vehicle
  page.drawText(`CYCLE ${String(batch.drawCycle).padStart(2, "0")}`, {
    x: x + 14,
    y: y + h - 50,
    size: 8,
    font: fontSansBold,
    color: SUBTLE,
  });
  page.drawText(batch.vehicleLabel.toUpperCase(), {
    x: x + 14,
    y: y + h - 64,
    size: 9,
    font: fontSansBold,
    color: INK,
  });

  // Ticket number (big)
  const numY = y + 56;
  page.drawText(id.full, {
    x: x + 14,
    y: numY + 12,
    size: 14,
    font: fontSerif,
    color: ACCENT,
  });
  page.drawText("Ticket No.", {
    x: x + 14,
    y: numY + 30,
    size: 6,
    font: fontSansBold,
    color: SUBTLE,
  });

  // Buyer
  const buyerY = y + 30;
  page.drawText("HOLDER", {
    x: x + 14,
    y: buyerY + 14,
    size: 6,
    font: fontSansBold,
    color: SUBTLE,
  });
  page.drawText(
    `${batch.buyer.firstName} ${batch.buyer.lastInitial}. - ${batch.buyer.city}, ${batch.buyer.state}`,
    { x: x + 14, y: buyerY, size: 8, font: fontSans, color: MUTED }
  );

  // Charity strip
  page.drawRectangle({
    x: x + 12,
    y: y + 10,
    width: w - 24,
    height: 14,
    color: rgb(230 / 255, 242 / 255, 236 / 255),
    borderColor: CHARITY,
    borderWidth: 0.5,
  });
  page.drawText(`10% of cycle to ${batch.charityName}`, {
    x: x + 18,
    y: y + 14,
    size: 7,
    font: fontSansBold,
    color: CHARITY,
  });

  // Draw date - right side
  page.drawText(`Draw: ${batch.drawDateLabel}`, {
    x: x + w - 14 - fontSans.widthOfTextAtSize(`Draw: ${batch.drawDateLabel}`, 7),
    y: y + h - 50,
    size: 7,
    font: fontSans,
    color: MUTED,
  });
  page.drawText(batch.orderId, {
    x: x + w - 14 - fontSans.widthOfTextAtSize(batch.orderId, 6),
    y: y + h - 64,
    size: 6,
    font: fontSans,
    color: SUBTLE,
  });

}

export async function buildTicketsPdf(opts: {
  contact: { email?: string; phone?: string };
  count: number;
  batch: PdfTicketBatch;
}): Promise<Uint8Array> {
  const ids = generateTicketIDs({
    drawCycle: opts.batch.drawCycle,
    contact: opts.contact,
    count: opts.count,
  });

  const pdf = await PDFDocument.create();
  const fontSans = await pdf.embedFont(StandardFonts.Helvetica);
  const fontSansBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const fontSerif = await pdf.embedFont(StandardFonts.TimesRomanBold);

  const cellW = (A3_W - PAGE_MARGIN * 2 - GUTTER * (COLS - 1)) / COLS;
  const cellH = (A3_H - PAGE_MARGIN * 2 - 80 - GUTTER * (ROWS - 1)) / ROWS;

  let page: PDFPage | null = null;
  let pageIndex = 0;

  for (let i = 0; i < ids.length; i++) {
    const positionOnPage = i % (COLS * ROWS);
    if (positionOnPage === 0) {
      page = pdf.addPage([A3_W, A3_H]);
      pageIndex++;
      drawPageHeader(page, fontSans, fontSansBold, opts.batch, pageIndex, Math.ceil(ids.length / (COLS * ROWS)));
    }
    const col = positionOnPage % COLS;
    const row = Math.floor(positionOnPage / COLS);
    const x = PAGE_MARGIN + col * (cellW + GUTTER);
    const y = A3_H - PAGE_MARGIN - 80 - (row + 1) * cellH - row * GUTTER;

    drawTicket({
      page: page!,
      x,
      y,
      w: cellW,
      h: cellH,
      id: ids[i],
      batch: opts.batch,
      fontSans,
      fontSansBold,
      fontSerif,
    });
  }

  return pdf.save();
}

function drawPageHeader(
  page: PDFPage,
  fontSans: PDFFont,
  fontSansBold: PDFFont,
  batch: PdfTicketBatch,
  pageNum: number,
  pageTotal: number
) {
  const top = A3_H - PAGE_MARGIN;
  page.drawText("GENEROUS MOTORS", { x: PAGE_MARGIN, y: top - 12, size: 14, font: fontSansBold, color: INK });
  page.drawText(`Cycle ${batch.drawCycle} · ${batch.vehicleLabel}`, {
    x: PAGE_MARGIN,
    y: top - 30,
    size: 10,
    font: fontSans,
    color: MUTED,
  });
  page.drawText(`Draw: ${batch.drawDateLabel}  ·  Charity: ${batch.charityName}  ·  Order ${batch.orderId}`, {
    x: PAGE_MARGIN,
    y: top - 46,
    size: 8,
    font: fontSans,
    color: SUBTLE,
  });
  const pageLabel = `Sheet ${pageNum}/${pageTotal} · A3 · 15 tickets per sheet`;
  page.drawText(pageLabel, {
    x: A3_W - PAGE_MARGIN - fontSans.widthOfTextAtSize(pageLabel, 8),
    y: top - 12,
    size: 8,
    font: fontSans,
    color: SUBTLE,
  });
  page.drawLine({
    start: { x: PAGE_MARGIN, y: top - 58 },
    end: { x: A3_W - PAGE_MARGIN, y: top - 58 },
    thickness: 0.5,
    color: DIVIDER,
  });
}

export function downloadPdf(bytes: Uint8Array, filename: string) {
  // Copy into a fresh ArrayBuffer so TS/DOM lib doesn't complain about SAB.
  const ab = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(ab).set(bytes);
  const blob = new Blob([ab], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ------------------------------------------------------------------ */
/* Admin cycle sheets — black & white A3 grids for barrel printing.    */
/* ------------------------------------------------------------------ */

// A contiguous range of real entries for one order line (from Supabase entry_blocks).
// The A3 sheet expands [seqStart..seqEnd] into individual tickets, each numbered
// GM-<cycle2><order4><ticket4> (e.g. cycle 5, order 53, ticket 1 → GM-0500530001),
// where the ticket block counts up within the order.
export type AdminTicketBlock = {
  orderToken: string;   // '0001' — the middle part
  drawCycle: number;    // 1
  fullName: string;     // holder name (falls back to email)
  phone: string;
  seqStart: number;
  seqEnd: number;
};

const BLACK = rgb(0, 0, 0);
const GREY = rgb(0.4, 0.4, 0.4);
const LIGHT = rgb(0.78, 0.78, 0.78);
const WHITE = rgb(1, 1, 1);

// Generous Motors mark — the two brand SVG paths (viewBox 100 270 900 530).
const MARK_PATH_G =
  "M292.39,407.73v72.14h109.07l-55.47,160.31h-55.49c-15.99-.51-34.66-3.61-45.52-7.58-32.76-11.97-58.76-36.58-73.21-69.3-14.65-33.19-15.7-70.7-2.95-105.6,20.18-55.25,71.14-92.06,127.29-92.25h148.45s383.51-.02,383.51-.02l61.51-72.14h-445.02s-145.27.02-145.27.02c-.92,0-1.83-.02-2.74-.02-86.52,0-164.85,55.83-195.47,139.65-19.19,52.51-17.52,109.15,4.72,159.5,22.44,50.83,63.08,89.15,114.43,107.91,21.79,7.96,49.68,11.4,68.51,11.95h1.07v.02h107.57l105.38-304.59h-210.36Z";
const MARK_PATH_M =
  "M896.8,293.29 L610.39,636.1 L509.92,407.61 L471.51,521.86 L555.26,712.32 L652.46,712.32 L869.72,452.28 L807.21,712.32 L890.68,712.32 L991.4,293.29 Z";
const MARK_MIN_X = 118;
const MARK_MIN_Y = 270;
const MARK_H = 449; // 719 - 270

/** Draw the GM mark in black with its top-left at (left, top), sized to `height`. */
function drawLogoMark(page: PDFPage, left: number, top: number, height: number) {
  const scale = height / MARK_H;
  const x = left - MARK_MIN_X * scale;
  const y = top + MARK_MIN_Y * scale;
  page.drawSvgPath(MARK_PATH_G, { x, y, scale, color: BLACK });
  page.drawSvgPath(MARK_PATH_M, { x, y, scale, color: BLACK });
}

function drawMonoTicket(opts: {
  page: PDFPage;
  x: number;
  y: number;
  w: number;
  h: number;
  ticketNumber: string;
  purchase: AdminTicketBlock;
  drawDateLabel: string;
  fontSans: PDFFont;
  fontSansBold: PDFFont;
  fontSerif: PDFFont;
}) {
  const { page, x, y, w, h, ticketNumber, purchase, drawDateLabel, fontSans, fontSansBold, fontSerif } = opts;
  const R = x + w - 12; // right content edge — full ticket width now that the stub is gone

  page.drawRectangle({ x, y, width: w, height: h, color: WHITE, borderColor: BLACK, borderWidth: 1 });

  // Header — logo mark + wordmark
  drawLogoMark(page, x + 12, y + h - 14, 15);
  page.drawText("GENEROUS MOTORS", {
    x: x + 44, y: y + h - 24, size: 9.5, font: fontSansBold, color: BLACK,
  });
  page.drawText(`OFFICIAL TICKET · CYCLE ${String(purchase.drawCycle).padStart(2, "0")}`, {
    x: x + 44, y: y + h - 33, size: 5.5, font: fontSans, color: GREY,
  });
  page.drawLine({
    start: { x: x + 12, y: y + h - 40 }, end: { x: R, y: y + h - 40 },
    thickness: 0.75, color: BLACK,
  });

  // Ticket number
  page.drawText("TICKET No.", { x: x + 12, y: y + h - 52, size: 5.5, font: fontSansBold, color: GREY });
  page.drawText(ticketNumber, { x: x + 12, y: y + h - 68, size: 14, font: fontSerif, color: BLACK });

  // Holder — name + phone
  page.drawText("HOLDER", { x: x + 12, y: y + 44, size: 5.5, font: fontSansBold, color: GREY });
  page.drawText(purchase.fullName.toUpperCase(), { x: x + 12, y: y + 34, size: 9, font: fontSansBold, color: BLACK });
  page.drawText(purchase.phone, { x: x + 12, y: y + 24, size: 8, font: fontSans, color: BLACK });

  // Footer row — draw date + order (full width)
  page.drawLine({
    start: { x: x + 12, y: y + 18 }, end: { x: R, y: y + 18 },
    thickness: 0.5, color: LIGHT,
  });
  page.drawText(`DRAW ${drawDateLabel.toUpperCase()}`, { x: x + 12, y: y + 9, size: 6, font: fontSans, color: GREY });
  const orderText = `ORDER ${purchase.orderToken}`;
  page.drawText(orderText, {
    x: R - fontSans.widthOfTextAtSize(orderText, 6), y: y + 9, size: 6, font: fontSans, color: GREY,
  });
}

/** Load the site's General Sans faces for PDF embedding (served from /public/fonts). */
async function loadGeneralSans(fonts?: SheetFonts): Promise<SheetFonts> {
  if (fonts) return fonts;
  const [regular, semibold, bold] = await Promise.all(
    ["GeneralSans-Regular.ttf", "GeneralSans-Semibold.ttf", "GeneralSans-Bold.ttf"].map((f) =>
      fetch(`/fonts/${f}`).then((r) => r.arrayBuffer()),
    ),
  );
  return { regular, semibold, bold };
}

export type SheetFonts = { regular: ArrayBuffer; semibold: ArrayBuffer; bold: ArrayBuffer };

/**
 * Batch A3 sheet: every ticket for the given purchases (already filtered by
 * cycle + date range by the caller), black & white, 15 per sheet, no page
 * header — the full sheet is ticket real estate. Set in General Sans.
 */
export async function buildCycleSheetsPdf(opts: {
  cycleLabel: string;
  drawDateLabel: string;
  rangeLabel: string;
  blocks: AdminTicketBlock[];
  fonts?: SheetFonts;
}): Promise<Uint8Array> {
  const jobs: { number: string; block: AdminTicketBlock }[] = [];
  const perOrder = new Map<string, number>(); // running ticket index within each order
  for (const b of opts.blocks) {
    for (let seq = b.seqStart; seq <= b.seqEnd; seq++) {
      const idx = (perOrder.get(b.orderToken) ?? 0) + 1;
      perOrder.set(b.orderToken, idx);
      const number = ticketNo(b.drawCycle, b.orderToken, idx); // GM-<cycle><order><ticket>
      jobs.push({ number, block: b });
    }
  }

  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const gs = await loadGeneralSans(opts.fonts);
  const fontSans = await pdf.embedFont(gs.regular, { subset: true });
  const fontSansBold = await pdf.embedFont(gs.semibold, { subset: true });
  const fontSerif = await pdf.embedFont(gs.bold, { subset: true }); // ticket number face

  // Fill the ENTIRE sheet: 4 tickets per row, NO margin and NO gutter, so tickets
  // tile corner to corner with zero wasted paper. Adjacent tickets share a single
  // border = a single cut line. (On non-borderless printers the very outer border
  // may clip by a millimetre or two — the text stays safely inset.)
  const SHEET_COLS = 4;
  const SHEET_ROWS = 5;
  const cellW = A3_W / SHEET_COLS;
  const cellH = A3_H / SHEET_ROWS;
  const perPage = SHEET_COLS * SHEET_ROWS;

  let page: PDFPage | null = null;

  for (let i = 0; i < jobs.length; i++) {
    const pos = i % perPage;
    if (pos === 0) page = pdf.addPage([A3_W, A3_H]);
    const col = pos % SHEET_COLS;
    const row = Math.floor(pos / SHEET_COLS);
    drawMonoTicket({
      page: page!,
      x: col * cellW,
      y: A3_H - (row + 1) * cellH,
      w: cellW,
      h: cellH,
      ticketNumber: jobs[i].number,
      purchase: jobs[i].block,
      drawDateLabel: opts.drawDateLabel,
      fontSans, fontSansBold, fontSerif,
    });
  }

  if (jobs.length === 0) pdf.addPage([A3_W, A3_H]);
  return pdf.save();
}
