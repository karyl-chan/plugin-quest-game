/**
 * Discord copy (role descriptions, flavour) carries `**bold**`
 * markers. The WebUI renders plain text, so strip them.
 */
export function stripBold(s: string): string {
  return s.replace(/\*\*/g, "");
}
