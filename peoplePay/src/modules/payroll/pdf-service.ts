import type { ComputedPayslip } from "./types";

const escapePdf = (value: string) => value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

/** Generates a compact, dependency-free PDF from the actual computed payslip lines. */
export function generatePayslipPdf(payslip: ComputedPayslip): Uint8Array {
  const rows = [
    "PeoplePay360 Payslip", `Employee: ${payslip.employeeName}`, `Period: ${payslip.period.start.toLocaleDateString()} - ${payslip.period.end.toLocaleDateString()}`,
    ...payslip.lines.map((line) => `${line.category} | ${line.ruleName}: ${line.amount.toFixed(2)}`),
    `Gross Total: ${payslip.grossTotal.toFixed(2)}`, `Net Total: ${payslip.netTotal.toFixed(2)}`,
  ];
  const content = ["BT", "/F1 12 Tf", "50 780 Td", ...rows.flatMap((row, index) => [index ? "0 -18 Td" : "", `(${escapePdf(row)}) Tj`]).filter(Boolean), "ET"].join("\n");
  const contentLength = new TextEncoder().encode(content).length;
  const objects = ["<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [3 0 R] /Count 1 >>", "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>", `<< /Length ${contentLength} >>\nstream\n${content}\nendstream`, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"];
  let pdf = "%PDF-1.4\n"; const offsets = [0];
  objects.forEach((object, i) => { offsets.push(pdf.length); pdf += `${i + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = pdf.length; pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n `).join("\n")}\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new TextEncoder().encode(pdf);
}
