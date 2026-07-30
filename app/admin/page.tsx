import { requireChatGPTUser, chatGPTSignOutPath } from "../chatgpt-auth";
import { isAdminEmail } from "../../lib/admin-auth";
import { AdminConsole } from "../../components/AdminConsole";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requireChatGPTUser("/admin");
  const allowed = isAdminEmail(user.email, process.env.ADMIN_EMAILS);
  return <main className="admin-shell"><header className="admin-header"><div><p className="eyebrow">CONTROL PLANE</p><h1>Champions Lab admin</h1><p>Signed in as {user.email}</p></div><div className="admin-actions"><Link href="/">Back to app</Link><a href={chatGPTSignOutPath("/")}>Sign out</a></div></header>{allowed ? <AdminConsole /> : <section className="panel admin-denied"><h2>Access denied</h2><p>Your account is authenticated but is not listed in the server-side <code>ADMIN_EMAILS</code> allowlist.</p></section>}</main>;
}
