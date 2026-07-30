export function parseAdminEmails(value: string | undefined): Set<string> {
  return new Set((value ?? "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean));
}

export function isAdminEmail(email: string, value: string | undefined): boolean {
  return parseAdminEmails(value).has(email.trim().toLowerCase());
}
