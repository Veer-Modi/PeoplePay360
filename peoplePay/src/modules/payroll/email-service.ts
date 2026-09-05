import { generatePayslipPdf } from "./pdf-service";
import type { ComputedPayslip, EmailGateway } from "./types";

/** Send one actual Payrun payslip to each employee with an email address. */
export async function sendPayslips(payslips: ComputedPayslip[], gateway: EmailGateway): Promise<{ sent: number; skipped: string[] }> {
  const skipped: string[] = [];
  let sent = 0;
  for (const payslip of payslips) {
    if (!payslip.employeeEmail) { skipped.push(payslip.employeeName); continue; }
    await gateway.send({ to: payslip.employeeEmail, subject: "Your PeoplePay360 payslip", body: `Hello ${payslip.employeeName}, your net salary is ${payslip.netTotal.toFixed(2)}.`, attachment: generatePayslipPdf(payslip), filename: "payslip.pdf" });
    sent += 1;
  }
  return { sent, skipped };
}
