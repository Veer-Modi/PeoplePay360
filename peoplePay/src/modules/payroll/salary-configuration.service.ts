import { prisma } from "@/lib/prisma";
import { PayrollDomainError } from "./errors";
import { validateRules } from "./salary-rules";
import type { CalculationType, SalaryRuleInput, SalaryStructureInput } from "./types";

type RuleWrite = Omit<SalaryRuleInput, "id" | "active" | "category"> & { categoryName: string; active?: boolean };

const mapStructure = (structure: {
  id: string; name: string; active: boolean; rules: Array<{ id: string; name: string; code: string; sequence: number; calculationType: string; calculationValue: string; active: boolean; category: { name: string } }>;
}): SalaryStructureInput => ({
  id: structure.id,
  name: structure.name,
  active: structure.active,
  rules: structure.rules.map((rule) => ({ ...rule, calculationType: rule.calculationType as CalculationType, category: rule.category.name })),
});

/** Real database CRUD for Person 3's Salary Structure and Salary Rule configuration. */
export class SalaryConfigurationService {
  static async listStructures(): Promise<SalaryStructureInput[]> {
    const structures = await prisma.salaryStructure.findMany({ include: { rules: { include: { category: true }, orderBy: { sequence: "asc" } } }, orderBy: { name: "asc" } });
    return structures.map(mapStructure);
  }

  static async getStructure(id: string): Promise<SalaryStructureInput | null> {
    const structure = await prisma.salaryStructure.findUnique({ where: { id }, include: { rules: { include: { category: true }, orderBy: { sequence: "asc" } } } });
    return structure ? mapStructure(structure) : null;
  }

  static async createStructure(name: string, active = true): Promise<SalaryStructureInput> {
    if (!name.trim()) throw new PayrollDomainError("Salary structure name is required.", "invalid_structure");
    const structure = await prisma.salaryStructure.create({ data: { name: name.trim(), active }, include: { rules: { include: { category: true } } } });
    return mapStructure(structure);
  }

  static async updateStructure(id: string, input: { name?: string; active?: boolean }): Promise<SalaryStructureInput> {
    const structure = await prisma.salaryStructure.update({ where: { id }, data: { ...(input.name !== undefined ? { name: input.name.trim() } : {}), ...(input.active !== undefined ? { active: input.active } : {}) }, include: { rules: { include: { category: true }, orderBy: { sequence: "asc" } } } });
    return mapStructure(structure);
  }

  static async addRule(structureId: string, input: RuleWrite): Promise<SalaryRuleInput> {
    const category = await prisma.salaryRuleCategory.findUnique({ where: { name: input.categoryName } });
    if (!category) throw new PayrollDomainError("Salary rule category does not exist.", "invalid_rule_category");
    const existing = await this.getStructure(structureId);
    if (!existing) throw new PayrollDomainError("Salary structure not found.", "structure_not_found", 404);
    validateRules([...existing.rules, { id: "new", name: input.name, code: input.code, sequence: input.sequence, calculationType: input.calculationType, calculationValue: input.calculationValue, active: input.active ?? true, category: input.categoryName }]);
    const rule = await prisma.salaryRule.create({ data: { name: input.name, code: input.code, sequence: input.sequence, calculationType: input.calculationType, calculationValue: input.calculationValue, active: input.active ?? true, salaryStructureId: structureId, categoryId: category.id }, include: { category: true } });
    return { id: rule.id, name: rule.name, code: rule.code, sequence: rule.sequence, calculationType: rule.calculationType as CalculationType, calculationValue: rule.calculationValue, active: rule.active, category: rule.category.name };
  }

  static async listRules(structureId?: string): Promise<SalaryRuleInput[]> {
    const rules = await prisma.salaryRule.findMany({
      where: structureId ? { salaryStructureId: structureId } : undefined,
      include: { category: true },
      orderBy: [{ salaryStructureId: "asc" }, { sequence: "asc" }],
    });
    return rules.map((rule) => ({ id: rule.id, name: rule.name, code: rule.code, sequence: rule.sequence, calculationType: rule.calculationType as CalculationType, calculationValue: rule.calculationValue, active: rule.active, category: rule.category.name }));
  }

  static async updateRule(ruleId: string, input: Partial<RuleWrite>): Promise<SalaryRuleInput> {
    const current = await prisma.salaryRule.findUnique({ where: { id: ruleId }, include: { category: true } });
    if (!current) throw new PayrollDomainError("Salary rule not found.", "rule_not_found", 404);
    const category = input.categoryName ? await prisma.salaryRuleCategory.findUnique({ where: { name: input.categoryName } }) : current.category;
    if (!category) throw new PayrollDomainError("Salary rule category does not exist.", "invalid_rule_category");
    const structure = await this.getStructure(current.salaryStructureId);
    if (!structure) throw new PayrollDomainError("Salary structure not found.", "structure_not_found", 404);
    const candidate: SalaryRuleInput = {
      id: current.id,
      name: input.name ?? current.name,
      code: input.code ?? current.code,
      sequence: input.sequence ?? current.sequence,
      calculationType: input.calculationType ?? current.calculationType as CalculationType,
      calculationValue: input.calculationValue ?? current.calculationValue,
      active: input.active ?? current.active,
      category: input.categoryName ?? current.category.name,
    };
    validateRules([...structure.rules.filter((rule) => rule.id !== ruleId), candidate]);
    const rule = await prisma.salaryRule.update({
      where: { id: ruleId },
      data: { name: candidate.name, code: candidate.code, sequence: candidate.sequence, calculationType: candidate.calculationType, calculationValue: candidate.calculationValue, active: candidate.active, categoryId: category.id },
      include: { category: true },
    });
    return { id: rule.id, name: rule.name, code: rule.code, sequence: rule.sequence, calculationType: rule.calculationType as CalculationType, calculationValue: rule.calculationValue, active: rule.active, category: rule.category.name };
  }

  static async deleteRule(ruleId: string): Promise<void> {
    const references = await prisma.payslipLine.count({ where: { salaryRuleId: ruleId } });
    if (references > 0) throw new PayrollDomainError("A rule used by a historical Payslip cannot be deleted.", "rule_in_use");
    await prisma.salaryRule.delete({ where: { id: ruleId } });
  }

  static async deleteStructure(structureId: string): Promise<void> {
    const [contractCount, payrunCount, payslipCount] = await Promise.all([
      prisma.contract.count({ where: { salaryStructureId: structureId } }),
      prisma.payrun.count({ where: { salaryStructureId: structureId } }),
      prisma.payslip.count({ where: { salaryStructureId: structureId } }),
    ]);
    if (contractCount + payrunCount + payslipCount > 0) {
      throw new PayrollDomainError("A Salary Structure used by a contract or payroll record cannot be deleted.", "structure_in_use");
    }
    await prisma.salaryStructure.delete({ where: { id: structureId } });
  }
}
