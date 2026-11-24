export function Msg({ sp }: { sp: { err?: string; ok?: string } }) {
  if (sp.err) return <div className="msg err" role="alert">{sp.err}</div>;
  if (sp.ok) return <div className="msg ok">Saved.</div>;
  return null;
}
