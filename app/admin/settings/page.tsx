import { db } from "@/lib/db";
import { requireStaff } from "@/lib/session";
import { taka } from "@/lib/dates";
import { generateBills, setDefaultCharge, setOpening, closeMonth, reopenMonth, addManager, toggleManager } from "@/lib/actions";
import { Msg } from "@/components/Msg";

export default async function Settings({ searchParams }: { searchParams: Promise<{ err?: string; ok?: string }> }) {
  const sp = await searchParams; const s = await requireStaff(); const sa = s.role === "SUPER_ADMIN";
  const d = db();
  const [charges, closed, managers, opening] = await Promise.all([
    d.orm.public.ChargeSetting.orderBy((c) => c.effectiveFrom.desc()).all(), d.orm.public.MonthClose.orderBy((c) => c.month.desc()).all(),
    d.orm.public.User.where({ role: "MANAGER" }).all(), d.orm.public.Setting.first({ key: "opening_balance" })]);
  const thisMonth = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" }).slice(0, 7);
  return (
    <>
      <h1>Settings</h1><Msg sp={sp} />
      <h2>Generate monthly bills</h2>
      <form className="grid card" action={generateBills}><label>Month (YYYY-MM)<input name="month" defaultValue={thisMonth} pattern="\d{4}-\d{2}" required /></label><button>Generate bills</button>
        <p style={{ gridColumn: "1 / -1", margin: 0 }}>Safe to run again: existing bills are never changed or duplicated.</p></form>
      {!sa ? <p>Default charge, opening balance, month closing and managers can only be changed by the Super Admin.</p> : <>
        <h2>Default monthly charge</h2>
        <form className="grid card" action={setDefaultCharge}><label>Amount (৳)<input name="amount" inputMode="decimal" required /></label><label>Effective from<input name="from" type="date" required /></label><button>Add new default</button>
          <p style={{ gridColumn: "1 / -1", margin: 0 }}>History: {charges.map(c => `${taka(c.amount)} from ${c.effectiveFrom}`).join("; ")}. Bills already generated keep their amount.</p></form>
        <h2>Opening balance</h2>
        <form className="grid card" action={setOpening}><label>Amount (৳) · now {taka(opening?.value ?? 0)}<input name="value" inputMode="decimal" required /></label><label>Reason<input name="reason" /></label><button>Save</button></form>
        <h2>Monthly closing</h2>
        <form className="grid card" action={closeMonth}><label>Month to close<input name="month" placeholder="2026-10" required /></label><button>Close month</button></form>
        {closed.map(c => <form key={c.month} action={reopenMonth} className="inline card"><b>{c.month} closed</b><input type="hidden" name="month" value={c.month} /><input name="reason" placeholder="Reason to reopen" required /><button className="sec">Reopen</button></form>)}
        <h2>Managers</h2>
        <p>Create a confirmed Supabase Auth user with the same email after adding a manager here.</p>
        <form className="grid card" action={addManager}><label>Email<input name="email" type="email" required /></label><label>Name<input name="name" /></label><button>Add manager</button></form>
        {managers.map(m => <form key={m.id} action={toggleManager} className="inline card"><input type="hidden" name="id" value={m.id} /><span className={m.active ? "" : "void"}>{m.email}</span><button className="sec">{m.active ? "Deactivate" : "Activate"}</button></form>)}
      </>}
    </>
  );
}
