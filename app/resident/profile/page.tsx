import { db } from "@/lib/db";
import { requireResident } from "@/lib/session";
import { updateResidentProfile } from "@/lib/actions";
import { redirect } from "next/navigation";

export default async function ResidentProfile({ searchParams }: { searchParams: Promise<{ err?: string; ok?: string }> }) {
  const s = await requireResident();
  const resident = await db().orm.public.FlatResident.first({ email: s.email, active: true });
  if (!resident) redirect("/login?error=unauthorized");
  const flat = await db().orm.public.Flat.firstOrThrow({ id: resident.flatId });
  const sp = await searchParams;
  return <><h1>My Profile</h1>{sp.err && <p className="msg err">{decodeURIComponent(sp.err)}</p>}{sp.ok && <p className="msg ok">Profile updated.</p>}<form className="grid card" action={updateResidentProfile}>
    <label>Name<input name="name" defaultValue={resident.name ?? ""} /></label><label>Phone<input name="phone" defaultValue={resident.phone ?? ""} /></label>
    <label>Flat number<input value={flat.number} readOnly /></label><label>Email address<input value={resident.email} readOnly /></label>
    {resident.photoUrl && <label>Profile photo<img src={resident.photoUrl} alt="" style={{ width: 96, height: 96, borderRadius: "50%", objectFit: "cover" }} /></label>}
    <button>Save profile</button>
  </form></>;
}
