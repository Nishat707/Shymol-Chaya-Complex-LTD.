import { getAppConfig } from "@/lib/app-config";
import UpdatePasswordForm from "./UpdatePasswordForm";

export const dynamic = "force-dynamic";

export default function Page() {
  const config = getAppConfig();
  return <UpdatePasswordForm supabaseUrl={config.supabaseUrl} supabaseAnonKey={config.supabaseAnonKey} />;
}
