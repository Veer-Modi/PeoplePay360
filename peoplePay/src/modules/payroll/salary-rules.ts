import { PayrollDomainError } from "./errors";
import type { DecimalValue, SalaryRuleInput } from "./types";

export type RuleContext = Record<string, DecimalValue>;

const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

function parseNumber(value: string, field: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new PayrollDomainError(`${field} must be a valid number.`, "invalid_rule_value");
  return parsed;
}

function parsePercentage(value: string): { percentage: number; baseRuleCode: string } {
  try {
    const parsed = JSON.parse(value) as { percentage?: unknown; baseRuleCode?: unknown };
    if (typeof parsed.percentage !== "number" || typeof parsed.baseRuleCode !== "string") throw new Error();
    return { percentage: parsed.percentage, baseRuleCode: parsed.baseRuleCode };
  } catch {
    throw new PayrollDomainError(
      'Percentage rules require calculationValue such as {"percentage":10,"baseRuleCode":"BASIC"}.',
      "invalid_percentage_rule",
    );
  }
}

/** Validates ordering and code uniqueness before an engine ever produces money. */
export function validateRules(rules: SalaryRuleInput[]): SalaryRuleInput[] {
  const active = rules.filter((rule) => rule.active).sort((a, b) => a.sequence - b.sequence);
  const seenCodes = new Set<string>();
  const seenSequences = new Set<number>();
  for (const rule of active) {
    if (!rule.code.trim() || rule.sequence <= 0 || !Number.isInteger(rule.sequence)) {
      throw new PayrollDomainError("A salary rule needs a code and a positive integer sequence.", "invalid_rule");
    }
    if (seenCodes.has(rule.code)) throw new PayrollDomainError(`Duplicate rule code: ${rule.code}.`, "duplicate_rule_code");
    if (seenSequences.has(rule.sequence)) throw new PayrollDomainError(`Two rules share sequence ${rule.sequence}.`, "duplicate_rule_sequence");
    seenCodes.add(rule.code);
    seenSequences.add(rule.sequence);
  }
  return active;
}

/**
 * Deliberately small formula grammar: numbers, prior rule codes, +, -, *, /, and parentheses.
 * It avoids eval and rejects references to values that have not been computed.
 */
function evaluateFormula(expression: string, context: RuleContext): number {
  const tokenPattern = /\s*([A-Z][A-Z0-9_]*|\d+(?:\.\d+)?|[()+\-*/])\s*/gy;
  const tokens: string[] = [];
  let index = 0;
  while (index < expression.length) {
    tokenPattern.lastIndex = index;
    const match = tokenPattern.exec(expression);
    if (!match) throw new PayrollDomainError("Formula contains unsupported syntax.", "invalid_formula");
    tokens.push(match[1]);
    index = tokenPattern.lastIndex;
  }
  let cursor = 0;
  const peek = () => tokens[cursor];
  const consume = () => tokens[cursor++];
  const factor = (): number => {
    const token = consume();
    if (token === "(") {
      const value = additive();
      if (consume() !== ")") throw new PayrollDomainError("Formula has unbalanced parentheses.", "invalid_formula");
      return value;
    }
    if (token === "-") return -factor();
    if (/^\d/.test(token)) return Number(token);
    if (/^[A-Z]/.test(token)) {
      const value = context[token];
      if (value === undefined) {
        throw new PayrollDomainError(`Rule sequence error: ${token} has not been computed yet.`, "rule_sequence_error");
      }
      return value;
    }
    throw new PayrollDomainError("Formula is incomplete.", "invalid_formula");
  };
  const multiplicative = (): number => {
    let value = factor();
    while (peek() === "*" || peek() === "/") {
      const operation = consume();
      const right = factor();
      if (operation === "/" && right === 0) throw new PayrollDomainError("Formula cannot divide by zero.", "invalid_formula");
      value = operation === "*" ? value * right : value / right;
    }
    return value;
  };
  const additive = (): number => {
    let value = multiplicative();
    while (peek() === "+" || peek() === "-") {
      const operation = consume();
      const right = multiplicative();
      value = operation === "+" ? value + right : value - right;
    }
    return value;
  };
  const result = additive();
  if (cursor !== tokens.length) throw new PayrollDomainError("Formula is invalid.", "invalid_formula");
  return result;
}

export function evaluateRule(rule: SalaryRuleInput, context: RuleContext, contractWage: DecimalValue): DecimalValue {
  let value: number;
  switch (rule.calculationType) {
    case "Fixed":
      // BASIC = Contract.wage is the documented seed-data convention.
      value = rule.calculationValue.trim() === "Contract.wage" ? contractWage : parseNumber(rule.calculationValue, "Fixed rule value");
      break;
    case "Percentage": {
      const { percentage, baseRuleCode } = parsePercentage(rule.calculationValue);
      const base = context[baseRuleCode];
      if (base === undefined) throw new PayrollDomainError(`Rule sequence error: ${baseRuleCode} has not been computed yet.`, "rule_sequence_error");
      value = base * (percentage / 100);
      break;
    }
    case "Formula": value = evaluateFormula(rule.calculationValue, context); break;
    default: throw new PayrollDomainError("Unsupported salary rule calculation type.", "unsupported_rule_type");
  }
  return roundMoney(value);
}
