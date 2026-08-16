/** Interactive Expedition Portfolio: a lightweight public GitHub-events reader with resilient refresh states. */
import { useCallback, useEffect, useState } from "react";

export type GitHubActivity = { id: string; title: string; repository: string; date: string; url: string };
type Status = "loading" | "ready" | "error";

const eventTitle = (event: { type: string; payload?: { ref_type?: string; action?: string; size?: number } }) => {
  if (event.type === "PushEvent") return `Pushed ${event.payload?.size ?? 0} commit${event.payload?.size === 1 ? "" : "s"}`;
  if (event.type === "CreateEvent") return `Created ${event.payload?.ref_type ?? "a route"}`;
  if (event.type === "WatchEvent") return "Received a star";
  if (event.type === "IssuesEvent") return `${event.payload?.action ?? "Updated"} an issue`;
  if (event.type === "PullRequestEvent") return `${event.payload?.action ?? "Updated"} a pull request`;
  return event.type.replace(/Event$/, "").replace(/([A-Z])/g, " $1").trim();
};

export function useGithubActivity(username: string) {
  const [items, setItems] = useState<GitHubActivity[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null);

  const refresh = useCallback(async () => {
    setStatus("loading");
    try {
      const response = await fetch(`https://api.github.com/users/${username}/events/public?per_page=6`, { headers: { Accept: "application/vnd.github+json" } });
      if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
      const data = await response.json() as Array<{ id: string; type: string; repo: { name: string; url: string }; created_at: string; payload?: { ref_type?: string; action?: string; size?: number } }>;
      setItems(data.map((event) => ({ id: event.id, title: eventTitle(event), repository: event.repo.name.replace(`${username}/`, ""), date: new Date(event.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }), url: event.repo.url.replace("api.github.com/repos", "github.com") })));
      setStatus("ready");
      setRefreshedAt(new Date());
    } catch {
      setStatus("error");
    }
  }, [username]);

  useEffect(() => { void refresh(); }, [refresh]);
  return { items, status, refreshedAt, refresh };
}
