import pdfMake from "pdfmake";
import type {
  TDocumentDefinitions,
  Content,
  TableCell,
  StyleDictionary,
  TFontDictionary,
} from "pdfmake/interfaces";

interface ParsedAnalysis {
  intro: string;
  table: { headers: string[]; rows: string[][] } | null;
}

function stripMarkdownFormatting(text: string): string {
  return text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)")
    .replace(/^#{1,6}\s+/gm, "")
    .trim();
}

function normalizeTableRows(lines: string[]): string[] {
  const normalized: string[] = [];
  let buffer = "";

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      if (buffer) {
        normalized.push(buffer);
      }
      buffer = trimmed;
    } else if (buffer) {
      buffer += " " + trimmed;
    }
  }

  if (buffer) {
    normalized.push(buffer);
  }

  return normalized;
}

function parseRow(line: string): string[] {
  return line
    .split("|")
    .slice(1, -1)
    .map((cell) => stripMarkdownFormatting(cell.trim()));
}

function isSeparatorRow(line: string): boolean {
  return /^\|[\s:-]+(\|[\s:-]+)+\|$/.test(line.trim());
}

export function parseAnalysisMarkdown(md: string): ParsedAnalysis {
  const lines = md.split("\n");
  let tableStartIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    if (isSeparatorRow(lines[i])) {
      tableStartIndex = i - 1;
      break;
    }
  }

  if (tableStartIndex < 0) {
    return { intro: stripMarkdownFormatting(md), table: null };
  }

  const introText = lines.slice(0, tableStartIndex).join("\n").trim();
  const tableLines = normalizeTableRows(lines.slice(tableStartIndex));

  if (tableLines.length < 2) {
    return { intro: stripMarkdownFormatting(introText), table: null };
  }

  const headers = parseRow(tableLines[0]);
  const rows: string[][] = [];

  for (let i = 1; i < tableLines.length; i++) {
    if (isSeparatorRow(tableLines[i])) continue;
    const cells = parseRow(tableLines[i]);
    if (cells.length === headers.length) {
      rows.push(cells);
    } else if (cells.length > 0) {
      while (cells.length < headers.length) cells.push("");
      rows.push(cells.slice(0, headers.length));
    }
  }

  return {
    intro: stripMarkdownFormatting(introText),
    table: rows.length > 0 ? { headers, rows } : null,
  };
}

const COLORS = {
  bg: "#111113",
  cardBg: "#1a1a1e",
  headerBg: "#1e1e22",
  teal: "#2dd4bf",
  white: "#ffffff",
  text: "#cccccc",
  textDim: "#888888",
  rowEven: "#16161a",
  rowOdd: "#111113",
  border: "#2a2a2e",
} as const;

const pdfFonts: TFontDictionary = {
  Helvetica: {
    normal: "Helvetica",
    bold: "Helvetica-Bold",
    italics: "Helvetica-Oblique",
    bolditalics: "Helvetica-BoldOblique",
  },
};

const PAGE_MARGIN = 32;

function estimateTableDimensions(
  headers: string[],
  rows: string[][],
  cellPadding: number,
  fontSize: number,
  headerFontSize: number
): { width: number; height: number } {
  const charWidth = fontSize * 0.52;
  const minColWidth = 40;
  const maxColWidth = 260;

  const colWidths = headers.map((header, colIndex) => {
    let longest = header.length;
    for (const row of rows) {
      if (row[colIndex] && row[colIndex].length > longest) {
        longest = row[colIndex].length;
      }
    }
    const textWidth = longest * charWidth + cellPadding * 2;
    return Math.max(minColWidth, Math.min(maxColWidth, textWidth));
  });

  const borderOverhead = (headers.length + 1) * 0.5;
  const width = colWidths.reduce((sum, w) => sum + w, 0) + borderOverhead;

  const headerRowHeight = headerFontSize + cellPadding * 2 + 0.5;
  const dataRowHeight = fontSize * 1.3 + cellPadding * 2 + 0.5;
  const height = headerRowHeight + rows.length * dataRowHeight;

  return { width, height };
}

export async function generateAnalysisPdf(markdown: string): Promise<Buffer> {
  const { intro, table } = parseAnalysisMarkdown(markdown);
  pdfMake.setFonts(pdfFonts);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const content: Content[] = [
    {
      text: "Finance Insights",
      style: "title",
    },
    {
      text: `AI-powered r/stocks analysis — ${today}`,
      style: "subtitle",
    },
    {
      canvas: [
        {
          type: "line",
          x1: 0,
          y1: 0,
          x2: 9999,
          y2: 0,
          lineWidth: 1,
          lineColor: COLORS.border,
        },
      ],
      margin: [0, 8, 0, 16] as [number, number, number, number],
    },
  ];

  if (intro) {
    content.push({
      text: intro,
      style: "intro",
      margin: [0, 0, 0, 20] as [number, number, number, number],
    });
  }

  if (table) {
    const headerCells: TableCell[] = table.headers.map((h) => ({
      text: h,
      style: "tableHeader",
      fillColor: COLORS.headerBg,
    }));

    const bodyCells: TableCell[][] = table.rows.map((row, rowIndex) =>
      row.map((cell) => ({
        text: cell,
        style: "tableCell",
        fillColor: rowIndex % 2 === 0 ? COLORS.rowEven : COLORS.rowOdd,
      }))
    );

    content.push({
      table: {
        headerRows: 1,
        widths: Array(table.headers.length).fill("auto") as string[],
        body: [headerCells, ...bodyCells],
      },
      layout: {
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => COLORS.border,
        vLineColor: () => COLORS.border,
        paddingLeft: () => 6,
        paddingRight: () => 6,
        paddingTop: () => 5,
        paddingBottom: () => 5,
      },
    });
  }

  content.push({
    text: `Generated on ${new Date().toISOString().replace("T", " at ").slice(0, 22)} UTC`,
    style: "footer",
    margin: [0, 24, 0, 0] as [number, number, number, number],
  });

  const cellFontSize = 7.5;
  const headerFontSize = 8;
  const cellPadding = 6;

  const tableDims = table
    ? estimateTableDimensions(
        table.headers,
        table.rows,
        cellPadding,
        cellFontSize,
        headerFontSize
      )
    : null;

  const pageWidth = tableDims
    ? Math.max(842, tableDims.width + PAGE_MARGIN * 2)
    : 842;

  const headerAreaHeight = 22 + 4 + 10 + 8 + 1 + 8 + 16;
  const introHeight = intro
    ? Math.ceil(intro.length / ((pageWidth - PAGE_MARGIN * 2) / (10 * 0.52))) *
        10 *
        1.5 +
      20
    : 0;
  const tableHeight = tableDims ? tableDims.height : 0;
  const footerHeight = 24 + 8;
  const pageHeight =
    PAGE_MARGIN * 2 +
    headerAreaHeight +
    introHeight +
    tableHeight +
    footerHeight +
    40;

  const styles: StyleDictionary = {
    title: {
      fontSize: 22,
      bold: true,
      color: COLORS.teal,
      margin: [0, 0, 0, 4],
    },
    subtitle: {
      fontSize: 10,
      color: COLORS.textDim,
      margin: [0, 0, 0, 8],
    },
    intro: {
      fontSize: 10,
      color: COLORS.text,
      lineHeight: 1.5,
    },
    tableHeader: {
      fontSize: 8,
      bold: true,
      color: COLORS.teal,
    },
    tableCell: {
      fontSize: cellFontSize,
      color: COLORS.white,
      lineHeight: 1.3,
    },
    footer: {
      fontSize: 8,
      color: COLORS.textDim,
      italics: true,
    },
  };

  const docDefinition: TDocumentDefinitions = {
    pageSize: { width: pageWidth, height: pageHeight },
    pageMargins: [PAGE_MARGIN, PAGE_MARGIN, PAGE_MARGIN, PAGE_MARGIN],
    background: (currentPage, pageSize) => ({
      canvas: [
        {
          type: "rect",
          x: 0,
          y: 0,
          w: pageSize.width,
          h: pageSize.height,
          color: COLORS.bg,
        },
      ],
    }),
    content,
    styles,
    defaultStyle: {
      font: "Helvetica",
      color: COLORS.text,
    },
  };

  const pdf = pdfMake.createPdf(docDefinition);
  return pdf.getBuffer();
}
