import { prisma } from "@/lib/db";
import { taka } from "@/lib/dates";
import { addExpense, payExpense, voidExpense } from "@/lib/actions";
import { Msg } from "@/components/Msg";

const METHODS = [["CASH", "Cash"], ["BANK_TRANSFER", "Bank transfer"], ["MOBILE_FINANCIAL_SERVICE", "Mobile financial service"], ["OTHER", "Other"]];
export default async function Expenses({ searchParams }: { searchParams: Promise<{ err?: string; ok?: string }> }) {
  const sp = await searchParams; const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
  const [cats, list] = await Promise.all([prisma.expenseCategory.findMany({ where: { active: true }, orderBy: { name: "asc" } }), prisma.expense.findMany({ orderBy: { expenseDate: "desc" }, take: 80, include: { category: true } })]);
  const opts = METHODS.map(([v, l]) => <option key={v} value={v}>{l}</option>);
  return (
    <>
      <h1>Expenses</h1><Msg sp={sp} />
      <form className="grid card" action={addExpense}>
        <label>Title<input name="title" required /></label>
        <label>Category<select name="category" required>{cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label>Amount (৳)<input name="amount" inputMode="decimal" required /></label>
        <label>Date<input name="date" type="date" defaultValue={today} required /></label>
        <label>Vendor<input name="vendor" /></label><label>Description<input name="description" /></label>
        <label>Status<select name="paid"><option value="0">Recorded, not paid yet</option><option value="1">Paid</option></select></label>
        <label>Method (if paid)<select name="method">{opts}</select></label>
        <button>Add expense</button>
      </form>
      <div className="card tw"><table><thead><tr><th>Date</th><th>Title</th><th>Category</th><th className="n">Amount</th><th>Status</th><th></th></tr></thead>
        <tbody>{list.map(e => (
          <tr key={e.id} className={e.status === "VOID" ? "void" : ""}><td>{e.expenseDate.toISOString().slice(0, 10)}</td><td>{e.title}</td><td>{e.category.name}</td><td className="n">{taka(e.amount.toString())}</td><td>{e.status === "PAID" ? "Paid" : e.status === "VOID" ? "Void" : "Unpaid"}</td>
            <td>{e.status === "RECORDED" && <form action={payExpense} className="inline"><input type="hidden" name="id" value={e.id} /><input name="date" type="date" defaultValue={today} /><select name="method">{opts}</select><button className="sec">Mark paid</button></form>}
              {e.status !== "VOID" && <form action={voidExpense} className="inline"><input type="hidden" name="id" value={e.id} /><input name="reason" placeholder="Reason to void" required /><button className="sec">Void</button></form>}</td></tr>))}</tbody></table></div>
    </>
  );
}
