import Link from "next/link";
import { prisma } from "@/lib/db";
import { taka } from "@/lib/dates";
import { addPayment, voidPay } from "@/lib/actions";
import { Msg } from "@/components/Msg";

export default async function Payments({ searchParams }: { searchParams: Promise<{ err?: string; ok?: string }> }) {
  const sp = await searchParams;
  const [flats, pays] = await Promise.all([
    prisma.flat.findMany({ where: { occupancy: "OCCUPIED" }, orderBy: [{ floor: "asc" }, { number: "asc" }] }),
    prisma.payment.findMany({ orderBy: { createdAt: "desc" }, take: 60, include: { flat: true } }),
  ]);
  return (
    <>
      <h1>Payments</h1><Msg sp={sp} />
      <form className="grid card" action={addPayment}>
        <label>Flat<select name="flat" required>{flats.map(f => <option key={f.id}>{f.number}</option>)}</select></label>
        <label>Amount (৳)<input name="amount" inputMode="decimal" required /></label>
        <label>Date received<input name="date" type="date" defaultValue={new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" })} required /></label>
        <label>Method<select name="method"><option value="CASH">Cash</option><option value="BANK_TRANSFER">Bank transfer</option><option value="MOBILE_FINANCIAL_SERVICE">Mobile financial service</option><option value="OTHER">Other</option></select></label>
        <label>Reference<input name="reference" /></label><label>Notes<input name="notes" /></label>
        <button>Record payment</button>
      </form>
      <p className="noprint">Payments clear the oldest unpaid month first. <a href="/admin/export/payments">Download CSV</a></p>
      <div className="card tw"><table><thead><tr><th>Receipt</th><th>Flat</th><th>Date</th><th className="n">Amount</th><th>Status</th><th></th></tr></thead>
        <tbody>{pays.map(p => (
          <tr key={p.id} className={p.voidedAt ? "void" : ""}><td><Link href={`/admin/receipt/${p.id}`}>{p.receiptNo}</Link></td><td>{p.flat.number}</td><td>{p.receivedOn.toISOString().slice(0, 10)}</td><td className="n">{taka(p.amount.toString())}</td>
            <td>{p.voidedAt ? "Void" : "Received"}</td>
            <td>{!p.voidedAt && <form action={voidPay} className="inline"><input type="hidden" name="id" value={p.id} /><input name="reason" placeholder="Reason to void" required /><button className="sec">Void</button></form>}</td></tr>))}</tbody></table></div>
    </>
  );
}
