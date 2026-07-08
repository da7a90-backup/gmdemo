"use client";
import { PDFDocument, StandardFonts, rgb, degrees, PDFFont, PDFPage } from "pdf-lib";
import { generateTicketIDs, type TicketID } from "@/lib/ticket-gen";

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
  page.drawText("GENEROUS MOTORS · OFFICIAL RAFFLE TICKET", {
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

  // Decorative stub pattern (right column)
  const stubX = x + w - 50;
  page.drawLine({
    start: { x: stubX, y: y + 6 },
    end: { x: stubX, y: y + h - 6 },
    thickness: 0.5,
    color: DIVIDER,
    dashArray: [2, 2],
  });
  page.drawText("STUB", {
    x: stubX + 12,
    y: y + h / 2 + 10,
    size: 8,
    font: fontSansBold,
    color: SUBTLE,
    rotate: degrees(90),
  });
  page.drawText(id.userHash + "-" + String(id.index).padStart(4, "0"), {
    x: stubX + 24,
    y: y + h / 2 - 30,
    size: 7,
    font: fontSans,
    color: MUTED,
    rotate: degrees(90),
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
