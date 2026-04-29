import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { CashflowEntry } from "./cashflow.service";
import { formatBRL, formatDateShort } from "./format.service";

interface ExportSummary {
  entradas: number;
  saidas: number;
  saldo: number;
  periodo: string;
}

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export function exportCSV(entries: CashflowEntry[], summary: ExportSummary) {
  const header = ["Data", "Descrição", "Categoria", "Tipo", "Valor (R$)"];
  const rows = entries.map((e) => [
    formatDateShort(e.date),
    `"${e.description.replace(/"/g, '""')}"`,
    e.category,
    e.kind === "ganho" ? "Entrada" : "Saída",
    (e.kind === "ganho" ? e.amount : -e.amount).toFixed(2).replace(".", ","),
  ]);

  const meta = [
    `Manda Cá - Controle de Caixa`,
    `Período: ${summary.periodo}`,
    `Saldo: ${formatBRL(summary.saldo)}`,
    `Entradas: ${formatBRL(summary.entradas)}`,
    `Saídas: ${formatBRL(summary.saidas)}`,
    "",
  ].join("\n");

  const csv = meta + "\n" + [header, ...rows].map((r) => r.join(";")).join("\n");

  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, `mandaca-caixa-${Date.now()}.csv`);
}

export function exportPDF(entries: CashflowEntry[], summary: ExportSummary) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(28, 65, 41);
  doc.rect(0, 0, pageWidth, 70, "F");
  doc.setTextColor(252, 251, 248);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Manda Cá", 40, 32);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Gestão Rural Inteligente", 40, 50);

  doc.setTextColor(28, 65, 41);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Controle de Caixa", 40, 110);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(90, 90, 90);
  doc.text(`Período: ${summary.periodo}`, 40, 128);
  doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, 40, 144);

  const cardY = 165;
  const cardW = (pageWidth - 80 - 20) / 3;
  const cards = [
    { label: "SALDO DO PERÍODO", value: formatBRL(summary.saldo), color: [28, 65, 41] },
    { label: "ENTRADAS", value: formatBRL(summary.entradas), color: [46, 125, 50] },
    { label: "SAÍDAS", value: formatBRL(summary.saidas), color: [230, 130, 40] },
  ];
  cards.forEach((c, i) => {
    const x = 40 + i * (cardW + 10);
    doc.setFillColor(245, 242, 234);
    doc.roundedRect(x, cardY, cardW, 60, 6, 6, "F");
    doc.setTextColor(120, 120, 120);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(c.label, x + 12, cardY + 18);
    doc.setTextColor(c.color[0], c.color[1], c.color[2]);
    doc.setFontSize(14);
    doc.text(c.value, x + 12, cardY + 42);
  });

  autoTable(doc, {
    startY: cardY + 85,
    head: [["Data", "Descrição", "Categoria", "Tipo", "Valor (R$)"]],
    body: entries.map((e) => [
      formatDateShort(e.date),
      e.description,
      e.category,
      e.kind === "ganho" ? "Entrada" : "Saída",
      formatBRL(e.kind === "ganho" ? e.amount : -e.amount, { withSign: true }),
    ]),
    styles: { font: "helvetica", fontSize: 10, cellPadding: 8 },
    headStyles: { fillColor: [28, 65, 41], textColor: [252, 251, 248], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 246, 240] },
    columnStyles: {
      0: { cellWidth: 75 },
      4: { halign: "right", fontStyle: "bold" },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 4) {
        const raw = entries[data.row.index];
        if (raw) {
          data.cell.styles.textColor = raw.kind === "ganho" ? [46, 125, 50] : [230, 130, 40];
        }
      }
    },
    margin: { left: 40, right: 40 },
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(140, 140, 140);
    doc.text(
      `© ${new Date().getFullYear()} Manda Cá - Gestão Rural Inteligente`,
      40,
      doc.internal.pageSize.getHeight() - 20,
    );
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - 40, doc.internal.pageSize.getHeight() - 20, { align: "right" });
  }

  doc.save(`mandaca-caixa-${Date.now()}.pdf`);
}
