import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { taka } from "@/lib/dates";
import { PrintButton } from "@/components/PrintButton";

export default async function Receipt({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await prisma.payment.findUnique({ where: { id }, include: { flat: true, allocations: { include: { charge: true } } } });
  if (!p) notFound();
  return (
    <div className="card" style={{ maxWidth: 520 }}>
      <h1>Shymol Chaya Complex LTD.</h1>
      <p>Payment receipt <b>{p.receiptNo}</b>{p.voidedAt && <> · <b style={{ color: "#b3402f" }}>VOIDED</b></>}</p>
      <p>Flat {p.flat.number} · {p.receivedOn.toISOString().slice(0, 10)} · {p.method.replaceAll("_", " ").toLowerCase()}{p.reference ? ` · Ref ${p.reference}` : ""}</p>
      <table style={{ minWidth: 0 }}><tbody>
        {p.allocations.map(a => <tr key={a.id}><td>{a.charge.month}</td><td className="n">{taka(a.amount.toString())}</td></tr>)}
        <tr><th>Total received</th><th className="n">{taka(p.amount.toString())}</th></tr>
      </tbody></table>
      <p><PrintButton /></p>
    </div>
  );
}
