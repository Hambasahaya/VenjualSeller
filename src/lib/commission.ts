export const DEFAULT_COMMISSION_PERCENTAGE = 10;

function toNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : 0;
  }

  return 0;
}

export function resolveCommissionDetails(
  baseAmount: number,
  commissionPercentage: unknown,
  commissionAmount: unknown
) {
  const resolvedBaseAmount = Math.max(0, toNumber(baseAmount));
  const parsedCommissionPercentage = toNumber(commissionPercentage);
  const parsedCommissionAmount = toNumber(commissionAmount);

  if (parsedCommissionPercentage > 0) {
    return {
      percentage: parsedCommissionPercentage,
      amount:
        parsedCommissionAmount > 0
          ? parsedCommissionAmount
          : Math.round((resolvedBaseAmount * parsedCommissionPercentage) / 100),
    };
  }

  if (parsedCommissionAmount > 0) {
    return {
      percentage:
        resolvedBaseAmount > 0
          ? Math.round((parsedCommissionAmount / resolvedBaseAmount) * 1000) / 10
          : 0,
      amount: parsedCommissionAmount,
    };
  }

  if (resolvedBaseAmount <= 0) {
    return {
      percentage: 0,
      amount: 0,
    };
  }

  return {
    percentage: DEFAULT_COMMISSION_PERCENTAGE,
    amount: Math.round(
      (resolvedBaseAmount * DEFAULT_COMMISSION_PERCENTAGE) / 100
    ),
  };
}
