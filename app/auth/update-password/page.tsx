import service from "../../../service.mjs";
import UpdatePasswordForm from "./UpdatePasswordForm";

export const dynamic = "force-dynamic";

export default function Page() {
  const input = service.input();
  return <UpdatePasswordForm supabaseUrl={input.supabaseUrl} supabaseAnonKey={input.supabaseAnonKey.expose()} />;
}
