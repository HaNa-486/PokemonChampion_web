"use client";

import { FormEvent, useEffect, useState } from "react";

type Override = { id: string; entityType: string; entityId: string; fieldPath: string; locale: string | null; newValue: unknown; reason: string; status: string; createdBy: string };

export function AdminConsole() {
  const [entries, setEntries] = useState<Override[]>([]);
  const [message, setMessage] = useState("Loading overrides…");

  const refresh = async () => {
    const response = await fetch("/api/v1/admin/overrides", { cache: "no-store" });
    const body = await response.json();
    if (!response.ok) { setMessage(body.error?.message ?? "Unable to load overrides."); return; }
    setEntries(body.data); setMessage(body.data.length ? "" : "No overrides yet.");
  };
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/v1/admin/overrides", { cache: "no-store", signal: controller.signal }).then(async (response) => ({ response, body: await response.json() })).then(({ response, body }) => {
      if (!response.ok) { setMessage(body.error?.message ?? "Unable to load overrides."); return; }
      setEntries(body.data); setMessage(body.data.length ? "" : "No overrides yet.");
    }).catch((error) => { if (error.name !== "AbortError") setMessage("Unable to load overrides."); });
    return () => controller.abort();
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setMessage("Saving…");
    const form = new FormData(event.currentTarget);
    let newValue: unknown = form.get("newValue");
    try { newValue = JSON.parse(String(newValue)); } catch { /* keep plain text */ }
    const response = await fetch("/api/v1/admin/overrides", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ entityType: form.get("entityType"), entityId: form.get("entityId"), fieldPath: form.get("fieldPath"), locale: form.get("locale") || null, newValue, reason: form.get("reason") }) });
    const body = await response.json();
    if (!response.ok) { setMessage(body.error?.message ?? "Unable to save override."); return; }
    event.currentTarget.reset(); setMessage("Draft saved."); await refresh();
  };

  return <div className="admin-grid"><section className="panel admin-form"><h2>Create draft override</h2><p>Drafts never change public data until a separate publish action is implemented and audited.</p><form onSubmit={submit}><label>Entity type<select name="entityType" required><option value="pokemon">Pokémon</option><option value="move">Move</option><option value="ability">Ability</option><option value="item">Item</option></select></label><label>Entity ID<input name="entityId" required /></label><label>Field path<input name="fieldPath" required placeholder="descriptionZhHant" /></label><label>Locale<select name="locale"><option value="">Not localized</option><option value="en">English</option><option value="zh-Hant">繁體中文</option></select></label><label>New value<textarea name="newValue" required rows={4} /></label><label>Reason<textarea name="reason" required rows={3} /></label><button className="primary-button" type="submit">Save draft</button></form><p role="status">{message}</p></section><section className="panel admin-list"><h2>Recent overrides</h2>{entries.map((entry) => <article key={entry.id}><div><b>{entry.entityType}:{entry.entityId}</b><span>{entry.status}</span></div><code>{entry.fieldPath}</code><p>{entry.reason}</p><small>{entry.createdBy}</small></article>)}</section></div>;
}
