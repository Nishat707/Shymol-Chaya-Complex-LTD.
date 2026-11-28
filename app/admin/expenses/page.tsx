import { db } from "@/lib/db";
import { taka } from "@/lib/dates";
import { addExpense, addExpenseCategory, payExpense, setupDefaultExpenseCategories, toggleExpenseCategory, voidExpense } from "@/lib/actions";
import { Msg } from "@/components/Msg";
import { DEFAULT_EXPENSE_CATEGORIES } from "@/lib/expense-categories";
import { requirePermission } from "@/lib/session";

const METHODS = [["CASH", "Cash"], ["BANK_TRANSFER", "Bank transfer"], ["MOBILE_FINANCIAL_SERVICE", "Mobile financial service"], ["OTHER", "Other"]];
export default async function Expenses({ searchParams }: { searchParams: Promise<{ err?: string; ok?: string }> }) {
  await requirePermission("expenses");
  const sp = await searchParams; const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
  const d = db();
  const [cats, allCats, list] = await Promise.all([
    d.orm.public.ExpenseCategory.where({ active: true }).orderBy((c) => c.name.asc()).all(),
    d.orm.public.ExpenseCategory.orderBy((c) => c.name.asc()).all(),
    d.orm.public.Expense.orderBy((e) => e.expenseDate.desc()).limit(80).include("category").all(),
  ]);
  const activeNames = new Set(cats.map((category) => category.name.toLowerCase()));
  const needsDefaults = DEFAULT_EXPENSE_CATEGORIES.some((name) => !activeNames.has(name.toLowerCase()));
  const opts = METHODS.map(([v, l]) => <option key={v} value={v}>{l}</option>);
  return (
    <>
      <h1>Expenses</h1><Msg sp={sp} />
      <form className="grid card" action={addExpense}>
        <label>Title<input name="title" required /></label>
        <label>Category<select name="category" required defaultValue="" disabled={!cats.length}><option value="" disabled>Select a category</option>{cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          {!cats.length && <span className="field-help">Set up categories below before adding an expense.</span>}
        </label>
        <label>Amount (৳)<input name="amount" inputMode="decimal" required /></label>
        <label>Date<input name="date" type="date" defaultValue={today} required /></label>
        <label>Vendor<input name="vendor" /></label><label>Description<input name="description" /></label>
        <label>Status<select name="paid"><option value="0">Recorded, not paid yet</option><option value="1">Paid</option></select></label>
        <label>Method (if paid)<select name="method">{opts}</select></label>
        <button disabled={!cats.length}>Add expense</button>
      </form>
      <section className="card category-panel">
        <div className="section-heading">
          <div><h2>Expense categories</h2><p>Add categories or deactivate ones you no longer use.</p></div>
          <span className="category-count">{cats.length} active</span>
        </div>
        <div className="category-actions">
          {needsDefaults && <form action={setupDefaultExpenseCategories}><button type="submit">Set up 12 standard categories</button></form>}
          <form className="category-form" action={addExpenseCategory}>
            <label>New category<input name="name" maxLength={60} placeholder="e.g. Generator maintenance" required /></label>
            <button type="submit">Add category</button>
          </form>
        </div>
        {allCats.length ? <div className="category-list">
          {allCats.map(category => (
            <div className={`category-chip${category.active ? "" : " inactive"}`} key={category.id}>
              <span>{category.name}</span>
              <form action={toggleExpenseCategory}>
                <input type="hidden" name="id" value={category.id} />
                <button className="category-toggle" type="submit">{category.active ? "Deactivate" : "Reactivate"}</button>
              </form>
            </div>
          ))}
        </div> : <p className="empty-state">No categories yet. Add one above before recording an expense.</p>}
      </section>
      <div className="card tw"><table><thead><tr><th>Date</th><th>Title</th><th>Category</th><th className="n">Amount</th><th>Status</th><th></th></tr></thead>
        <tbody>{list.map(e => (
          <tr key={e.id} className={e.status === "VOID" ? "void" : ""}><td>{e.expenseDate}</td><td>{e.title}</td><td>{e.category.name}</td><td className="n">{taka(e.amount)}</td><td>{e.status === "PAID" ? "Paid" : e.status === "VOID" ? "Void" : "Unpaid"}</td>
            <td>{e.status === "RECORDED" && <form action={payExpense} className="inline"><input type="hidden" name="id" value={e.id} /><input name="date" type="date" defaultValue={today} /><select name="method">{opts}</select><button className="sec">Mark paid</button></form>}
              {e.status !== "VOID" && <form action={voidExpense} className="inline"><input type="hidden" name="id" value={e.id} /><input name="reason" placeholder="Reason to void" required /><button className="sec">Void</button></form>}</td></tr>))}</tbody></table></div>
    </>
  );
}
