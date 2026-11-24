import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { taka } from "@/lib/dates";

const navigation = [
  { id: "overview", label: "Overview", group: "WORKSPACE" },
  { id: "flats", label: "Flats", group: "WORKSPACE" },
  { id: "payments", label: "Payments", group: "WORKSPACE" },
  { id: "expenses", label: "Expenses", group: "WORKSPACE" },
  { id: "notices", label: "Notices", group: "WORKSPACE" },
  { id: "settings", label: "Settings", group: "MANAGEMENT" },
  { id: "audit", label: "Audit log", group: "MANAGEMENT" },
  { id: "resident", label: "Resident portal", group: "PORTAL" },
] as const;

type View = (typeof navigation)[number]["id"] | "flat-detail";

const flats = [
  { number: "2A", floor: 2, resident: "Demo Resident A", status: "Occupied", charge: 3000, due: 0 },
  { number: "2B", floor: 2, resident: "Demo Resident B", status: "Occupied", charge: 3000, due: 3000 },
  { number: "3A", floor: 3, resident: "Demo Resident C", status: "Occupied", charge: 3500, due: 1500 },
  { number: "3B", floor: 3, resident: "Demo Resident D", status: "Occupied", charge: 3000, due: 6000 },
  { number: "3C", floor: 3, resident: "—", status: "Vacant", charge: 3000, due: 0 },
  { number: "4A", floor: 4, resident: "Demo Resident E", status: "Occupied", charge: 3000, due: 0 },
];

const payments = [
  { receipt: "SC-2026-0118", flat: "2A", date: "2026-11-18", amount: 6000, method: "Bank transfer", status: "Received" },
  { receipt: "SC-2026-0117", flat: "4A", date: "2026-11-16", amount: 3000, method: "Cash", status: "Received" },
  { receipt: "SC-2026-0116", flat: "3A", date: "2026-11-14", amount: 2000, method: "Mobile financial service", status: "Received" },
  { receipt: "SC-2026-0115", flat: "2B", date: "2026-11-12", amount: 3000, method: "Bank transfer", status: "Received" },
];

const expenses = [
  { date: "2026-11-20", title: "Lift maintenance", category: "Lift Maintenance", amount: 12500, status: "Paid" },
  { date: "2026-11-17", title: "Common-area electricity", category: "Electricity", amount: 8400, status: "Paid" },
  { date: "2026-11-12", title: "Water pump service", category: "Water Management", amount: 4500, status: "Recorded" },
  { date: "2026-11-05", title: "Cleaning supplies", category: "Cleaning and Hygiene", amount: 1850, status: "Paid" },
];

const notices = [
  { title: "Water tank maintenance", priority: "Important", date: "2026-11-25", body: "Water service may be interrupted from 10:00 AM to 1:00 PM." },
  { title: "Monthly residents meeting", priority: "Normal", date: "2026-11-28", body: "Residents are welcome in the community room at 7:00 PM." },
  { title: "Lift inspection", priority: "Urgent", date: "2026-11-22", body: "Please use the stairs while the lift is being inspected." },
];

const money = (amount: number) => taka(amount);
const isView = (value: string): value is View =>
  value === "flat-detail" || navigation.some(item => item.id === value);

function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "good" | "warn" | "bad" | "neutral" }) {
  return <span className={`preview-badge ${tone}`}>{children}</span>;
}

function Heading({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return <div className="preview-heading"><div><p className="preview-eyebrow">{eyebrow}</p><h1>{title}</h1><p>{children}</p></div><Badge tone="neutral">November 2026</Badge></div>;
}

function DemoField({ label, value, type = "text" }: { label: string; value?: string; type?: string }) {
  return <label className="preview-field">{label}<input type={type} value={value ?? ""} readOnly /></label>;
}

function Overview() {
  const cards = [
    { label: "Total flats", value: "50", note: "47 occupied · 3 vacant", icon: "⌂" },
    { label: "Received this month", value: money(146500), note: "Across 39 payments", icon: "↓" },
    { label: "Expenses paid", value: money(82450), note: "12 recorded expenses", icon: "↗" },
    { label: "Available balance", value: money(641200), note: "Opening balance included", icon: "৳" },
    { label: "Outstanding dues", value: money(73500), note: "Across 18 flats", icon: "!" },
  ];
  return <>
    <Heading eyebrow="BUILDING AT A GLANCE" title="Overview">Your building’s financial and occupancy snapshot.</Heading>
    <div className="preview-stats">{cards.map(card => <article className="preview-stat" key={card.label}><span className="preview-stat-icon">{card.icon}</span><p>{card.label}</p><strong>{card.value}</strong><small>{card.note}</small></article>)}</div>
    <div className="preview-columns">
      <section className="preview-panel"><div className="preview-panel-head"><div><h2>Recent payments</h2><p>Latest receipts recorded</p></div><Link href="/preview?tab=payments">View all</Link></div><DataTable headers={["Receipt", "Flat", "Date", "Amount"]}>{payments.slice(0, 3).map(p => <tr key={p.receipt}><td>{p.receipt}</td><td>{p.flat}</td><td>{p.date}</td><td className="numeric">{money(p.amount)}</td></tr>)}</DataTable></section>
      <section className="preview-panel"><div className="preview-panel-head"><div><h2>Outstanding dues</h2><p>Flats needing follow-up</p></div><Link href="/preview?tab=flats">View flats</Link></div><DataTable headers={["Flat", "Resident", "Due"]}>{flats.filter(f => f.due > 0).slice(0, 3).map(f => <tr key={f.number}><td>{f.number}</td><td>{f.resident}</td><td className="numeric">{money(f.due)}</td></tr>)}</DataTable></section>
    </div>
    <section className="preview-panel"><div className="preview-panel-head"><div><h2>Latest notice</h2><p>Building announcement</p></div><Link href="/preview?tab=notices">All notices</Link></div><div className="preview-notice-card"><Badge tone="warn">{notices[0].priority}</Badge><div><strong>{notices[0].title}</strong><p>{notices[0].body}</p></div><time>{notices[0].date}</time></div></section>
  </>;
}

function DataTable({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return <div className="preview-table-wrap"><table className="preview-table"><thead><tr>{headers.map(header => <th key={header}>{header}</th>)}</tr></thead><tbody>{children}</tbody></table></div>;
}

function Flats() {
  return <>
    <Heading eyebrow="PROPERTY DIRECTORY" title="Flats">Occupancy and account balances for the building.</Heading>
    <div className="preview-toolbar"><span>Showing sample rows · 50 flats seeded in the full app</span><button disabled className="preview-button">＋ Add flat</button></div>
    <section className="preview-panel"><DataTable headers={["Flat", "Floor", "Owner / resident", "Status", "Monthly charge", "Outstanding"]}>{flats.map(f => <tr key={f.number}><td><Link href={`/preview?tab=flat-detail&flat=${f.number}`} className="preview-link">{f.number}</Link></td><td>{f.floor}</td><td>{f.resident}</td><td><Badge tone={f.status === "Vacant" ? "neutral" : "good"}>{f.status}</Badge></td><td className="numeric">{money(f.charge)}</td><td className="numeric">{money(f.due)}</td></tr>)}</DataTable></section>
    <p className="preview-footnote">In the connected app, open a flat to edit resident details and review its monthly ledger.</p>
  </>;
}

function FlatDetail({ number }: { number: string }) {
  const flat = flats.find(item => item.number === number) ?? flats[0];
  return <>
    <Heading eyebrow="FLAT DETAILS" title={`Flat ${flat.number}`}>A sample resident profile and monthly ledger.</Heading>
    <div className="preview-columns"><section className="preview-panel"><h2>Property profile</h2><div className="preview-form"><DemoField label="Owner" value={flat.resident} /><DemoField label="Phone" value="+880 1XXX-XXX-XXX" /><DemoField label="Occupancy" value={flat.status} /><DemoField label="Monthly charge" value={money(flat.charge)} /></div><button disabled className="preview-button">Save changes</button></section>
      <section className="preview-panel"><h2>Approved resident accounts</h2><p>{flat.status === "Vacant" ? "No resident account is assigned." : "demo.resident@example.test"}</p><button disabled className="preview-button secondary">＋ Add resident</button></section></div>
    <section className="preview-panel"><h2>Monthly ledger</h2><DataTable headers={["Month", "Charge", "Paid", "Due", "Status"]}><tr><td>2026-11</td><td>{money(flat.charge)}</td><td>{money(flat.due === 0 ? flat.charge : 0)}</td><td>{money(flat.due)}</td><td><Badge tone={flat.due === 0 ? "good" : "warn"}>{flat.due === 0 ? "Paid" : "Unpaid"}</Badge></td></tr><tr><td>2026-10</td><td>{money(flat.charge)}</td><td>{money(flat.charge)}</td><td>{money(0)}</td><td><Badge tone="good">Paid</Badge></td></tr></DataTable></section>
  </>;
}

function Payments() {
  return <>
    <Heading eyebrow="INCOME TRACKING" title="Payments">Receipts and allocations for resident payments.</Heading>
    <section className="preview-panel"><h2>Record payment</h2><div className="preview-form"><DemoField label="Flat" value="2A" /><DemoField label="Amount (৳)" value="3,000" /><DemoField label="Date received" value="2026-11-24" type="date" /><DemoField label="Method" value="Bank transfer" /><DemoField label="Reference" value="DEMO-REF-001" /></div><button disabled className="preview-button">Record payment</button><span className="preview-inline-note">Actions are disabled in this read-only preview.</span></section>
    <section className="preview-panel"><div className="preview-panel-head"><div><h2>Recent receipts</h2><p>Oldest unpaid bills are settled first</p></div><button disabled className="preview-button secondary">Download CSV</button></div><DataTable headers={["Receipt", "Flat", "Date", "Method", "Amount", "Status"]}>{payments.map(p => <tr key={p.receipt}><td>{p.receipt}</td><td>{p.flat}</td><td>{p.date}</td><td>{p.method}</td><td className="numeric">{money(p.amount)}</td><td><Badge tone="good">{p.status}</Badge></td></tr>)}</DataTable></section>
  </>;
}

function Expenses() {
  return <>
    <Heading eyebrow="COST MANAGEMENT" title="Expenses">Track expenses separately from payments made.</Heading>
    <section className="preview-panel"><h2>Record an expense</h2><div className="preview-form"><DemoField label="Title" value="Generator maintenance" /><DemoField label="Category" value="Generator Maintenance" /><DemoField label="Amount (৳)" value="8,500" /><DemoField label="Date" value="2026-11-24" type="date" /><DemoField label="Vendor" value="Demo Services Ltd." /><DemoField label="Status" value="Paid" /></div><button disabled className="preview-button">Add expense</button><span className="preview-inline-note">Actions are disabled in this read-only preview.</span></section>
    <section className="preview-panel"><h2>Recent expenses</h2><DataTable headers={["Date", "Title", "Category", "Amount", "Status"]}>{expenses.map(e => <tr key={e.title}><td>{e.date}</td><td>{e.title}</td><td>{e.category}</td><td className="numeric">{money(e.amount)}</td><td><Badge tone={e.status === "Paid" ? "good" : "warn"}>{e.status}</Badge></td></tr>)}</DataTable></section>
  </>;
}

function Notices() {
  return <>
    <Heading eyebrow="BUILDING UPDATES" title="Notices">Share timely announcements with residents.</Heading>
    <section className="preview-panel"><h2>Compose notice</h2><div className="preview-form"><DemoField label="Title" value="Community announcement" /><DemoField label="Priority" value="Normal" /><DemoField label="Expires on" value="2026-12-01" type="date" /></div><label className="preview-field">Message<textarea value="This is a sample notice for preview purposes." readOnly rows={3} /></label><button disabled className="preview-button">Publish notice</button><span className="preview-inline-note">Actions are disabled in this read-only preview.</span></section>
    {notices.map(notice => <section className="preview-panel preview-notice-list" key={notice.title}><div><Badge tone={notice.priority === "Urgent" ? "bad" : notice.priority === "Important" ? "warn" : "neutral"}>{notice.priority}</Badge><h2>{notice.title}</h2><p>{notice.body}</p></div><time>{notice.date}</time></section>)}
  </>;
}

function Settings() {
  return <>
    <Heading eyebrow="BUILDING CONFIGURATION" title="Settings">Billing and access controls for the management team.</Heading>
    <div className="preview-columns"><section className="preview-panel"><h2>Generate monthly bills</h2><p>Generate one bill per occupied flat for the selected month.</p><div className="preview-form"><DemoField label="Billing month" value="2026-11" /></div><button disabled className="preview-button">Generate bills</button></section>
      <section className="preview-panel"><h2>Default monthly charge</h2><div className="preview-form"><DemoField label="Amount (৳)" value="3,000" /><DemoField label="Effective from" value="2026-01-01" type="date" /></div><button disabled className="preview-button">Save default charge</button></section>
      <section className="preview-panel"><h2>Opening balance</h2><p>Current sample balance: <strong>{money(580000)}</strong></p><button disabled className="preview-button secondary">Update opening balance</button></section>
      <section className="preview-panel"><h2>Month closing</h2><p>Closed months lock financial changes.</p><Badge tone="good">No months closed</Badge></section>
    </div>
    <section className="preview-panel"><h2>Managers</h2><DataTable headers={["Name", "Email", "Role", "Status"]}><tr><td>Demo Super Admin</td><td>admin@example.test</td><td>Super Admin</td><td><Badge tone="good">Active</Badge></td></tr><tr><td>Demo Manager</td><td>manager@example.test</td><td>Manager</td><td><Badge tone="good">Active</Badge></td></tr></DataTable></section>
  </>;
}

function Audit() {
  const rows = [
    ["2026-11-20 14:32", "EXPENSE_PAID", "Expense · Lift maintenance", "Recorded", "Paid", "Demo entry"],
    ["2026-11-18 10:15", "PAYMENT_CREATED", "Payment · SC-2026-0118", "—", money(6000), "Demo entry"],
    ["2026-11-12 16:04", "NOTICE_PUBLISHED", "Notice · Water tank maintenance", "—", "Important", "Demo entry"],
  ];
  return <>
    <Heading eyebrow="ACCOUNTABILITY" title="Audit log">A record of financial and administrative changes.</Heading>
    <section className="preview-panel"><DataTable headers={["Time (Dhaka)", "Action", "Record", "Before", "After", "Reason"]}>{rows.map(row => <tr key={row[1]}>{row.map((cell, index) => <td key={index}>{cell}</td>)}</tr>)}</DataTable></section>
  </>;
}

function Resident() {
  const residentFlat = flats[0];
  return <>
    <Heading eyebrow="RESIDENT PORTAL" title="Welcome, Demo Resident A">A read-only view of your own flat’s account.</Heading>
    <div className="preview-stats"><article className="preview-stat"><p>Your flat</p><strong>{residentFlat.number}</strong><small>Occupied</small></article><article className="preview-stat"><p>Monthly charge</p><strong>{money(residentFlat.charge)}</strong><small>Effective January 2026</small></article><article className="preview-stat"><p>Outstanding balance</p><strong>{money(residentFlat.due)}</strong><small>All bills up to date</small></article></div>
    <section className="preview-panel"><h2>Payment history</h2><DataTable headers={["Month", "Charge", "Paid", "Due", "Status"]}><tr><td>2026-11</td><td>{money(3000)}</td><td>{money(3000)}</td><td>{money(0)}</td><td><Badge tone="good">Paid</Badge></td></tr><tr><td>2026-10</td><td>{money(3000)}</td><td>{money(3000)}</td><td>{money(0)}</td><td><Badge tone="good">Paid</Badge></td></tr><tr><td>2026-09</td><td>{money(3000)}</td><td>{money(3000)}</td><td>{money(0)}</td><td><Badge tone="good">Paid</Badge></td></tr></DataTable></section>
    <section className="preview-panel"><h2>Announcements</h2>{notices.slice(0, 2).map(notice => <div className="preview-notice-card" key={notice.title}><Badge tone={notice.priority === "Important" ? "warn" : "neutral"}>{notice.priority}</Badge><div><strong>{notice.title}</strong><p>{notice.body}</p></div><time>{notice.date}</time></div>)}</section>
  </>;
}

export default async function Preview({ searchParams }: { searchParams: Promise<{ tab?: string; flat?: string }> }) {
  const [{ tab: requestedTab, flat: requestedFlat }, requestHeaders] = await Promise.all([searchParams, headers()]);
  const host = requestHeaders.get("host") ?? "";
  if (process.env.NODE_ENV === "production" || !/^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(host)) notFound();

  const tab: View = requestedTab && isView(requestedTab) ? requestedTab : "overview";
  const title = navigation.find(item => item.id === tab)?.label ?? "Flat details";
  let content: React.ReactNode;
  switch (tab) {
    case "flats": content = <Flats />; break;
    case "flat-detail": content = <FlatDetail number={requestedFlat ?? "2A"} />; break;
    case "payments": content = <Payments />; break;
    case "expenses": content = <Expenses />; break;
    case "notices": content = <Notices />; break;
    case "settings": content = <Settings />; break;
    case "audit": content = <Audit />; break;
    case "resident": content = <Resident />; break;
    default: content = <Overview />;
  }

  return <div className="preview-shell">
    <aside className="preview-sidebar">
      <Link href="/preview" className="preview-brand"><span className="preview-brand-mark">SC</span><span><b>Shymol Chaya</b><small>COMPLEX MANAGEMENT</small></span></Link>
      {["WORKSPACE", "MANAGEMENT", "PORTAL"].map(group => <div className="preview-nav-group" key={group}><p>{group}</p>{navigation.filter(item => item.group === group).map(item => <Link key={item.id} href={`/preview?tab=${item.id}`} className={`preview-nav-link ${tab === item.id ? "active" : ""}`}><span>{item.id === "overview" ? "⌂" : item.id === "flats" ? "▦" : item.id === "payments" ? "↙" : item.id === "expenses" ? "↗" : item.id === "notices" ? "◉" : item.id === "settings" ? "⚙" : item.id === "audit" ? "≡" : "♙"}</span>{item.label}</Link>)}</div>)}
      <div className="preview-sidebar-foot"><span className="preview-live-dot" />Local demo · read only</div>
    </aside>
    <div className="preview-main">
      <header className="preview-topbar"><div><span>SHYMOL CHAYA COMPLEX LTD.</span><strong>{title}</strong></div><Link href="/login" className="preview-signin">Real sign-in</Link></header>
      <main className="preview-content"><div className="preview-banner"><span>DEMO PREVIEW</span><p>Sample data only · changes are disabled · nothing is saved to Supabase</p></div>{content}<footer className="preview-footer">Local preview for Shymol Chaya Complex LTD. · Sample data, not financial records.</footer></main>
    </div>
  </div>;
}
