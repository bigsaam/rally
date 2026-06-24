// Equal-split settle-up: every member owes an equal share of the trip total;
// payers are credited what they fronted. Net = paid − share. A greedy
// min-cash-flow pass turns the nets into the fewest who-pays-whom transfers.

/** @param {number} n */
const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

/**
 * @param {Array<{ amount: number, paid_by?: string | null }>} expenses
 * @param {Array<{ id: string, display_name: string }>} members  everyone the cost splits across
 * @returns {{
 *   total: number,
 *   perPerson: number,
 *   net: Array<{ id: string, name: string, net: number }>,
 *   settlements: Array<{ from: string, fromName: string, to: string, toName: string, amount: number }>
 * }}
 */
export function settleUp(expenses, members) {
  const n = members.length;
  const total = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const share = n ? total / n : 0;

  /** @type {Record<string, number>} */
  const paid = {};
  for (const m of members) paid[m.id] = 0;
  for (const e of expenses) {
    if (e.paid_by && paid[e.paid_by] != null) paid[e.paid_by] += Number(e.amount) || 0;
  }

  const net = members.map((m) => ({ id: m.id, name: m.display_name, net: round2((paid[m.id] || 0) - share) }));

  // Greedy: biggest debtor pays biggest creditor until everyone nets ~zero.
  const debtors = net.filter((x) => x.net < -0.005).map((x) => ({ ...x, owe: -x.net })).sort((a, b) => b.owe - a.owe);
  const creditors = net.filter((x) => x.net > 0.005).map((x) => ({ ...x, due: x.net })).sort((a, b) => b.due - a.due);

  /** @type {Array<{ from: string, fromName: string, to: string, toName: string, amount: number }>} */
  const settlements = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const pay = round2(Math.min(debtors[i].owe, creditors[j].due));
    if (pay > 0) {
      settlements.push({
        from: debtors[i].id,
        fromName: debtors[i].name,
        to: creditors[j].id,
        toName: creditors[j].name,
        amount: pay
      });
    }
    debtors[i].owe = round2(debtors[i].owe - pay);
    creditors[j].due = round2(creditors[j].due - pay);
    if (debtors[i].owe < 0.005) i++;
    if (creditors[j].due < 0.005) j++;
  }

  return { total: round2(total), perPerson: round2(share), net, settlements };
}
