type Amount = number | { toString(): string };

export type ResidentChargeSummary = {
  month: string;
  amount: Amount;
  waived: Amount;
  allocations: readonly { amount: Amount }[];
};

export function residentFinancialMetrics(
  charges: readonly ResidentChargeSummary[],
  totalPaid: Amount,
  currentMonth: string,
  hasPayment: boolean,
) {
  const currentCharge = charges.find((charge) => charge.month === currentMonth);
  const outstanding = charges.reduce(
    (sum, charge) =>
      sum +
      Number(charge.amount.toString()) -
      Number(charge.waived.toString()) -
      charge.allocations.reduce((paid, allocation) => paid + Number(allocation.amount.toString()), 0),
    0,
  );

  return {
    currentCharge: currentCharge
      ? Number(currentCharge.amount.toString()) - Number(currentCharge.waived.toString())
      : 0,
    outstanding: Math.max(0, outstanding),
    totalPaid: Number(totalPaid.toString()),
    latestPaymentStatus: hasPayment ? "Recorded" : "No payment",
  };
}
