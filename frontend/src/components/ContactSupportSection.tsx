import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  createSupportTicket,
  fetchMySupportTickets,
  type SupportTicket,
} from "../lib/api";
import { isLoggedIn } from "../lib/session";

export function ContactSupportSection() {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!isLoggedIn()) return;
    try {
      const data = await fetchMySupportTickets();
      setTickets(data.tickets);
    } catch {
      /* ignore until signed in / network ready */
    }
  }, []);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  if (!isLoggedIn()) return null;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setOk(null);
    setBusy(true);
    try {
      await createSupportTicket(subject.trim(), message.trim());
      setSubject("");
      setMessage("");
      setOk("Message sent — we’ll reply here when we can.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="profile-support">
      {!open ? (
        <button type="button" className="btn scores-close" onClick={() => setOpen(true)}>
          Contact support
        </button>
      ) : (
        <>
          <div className="profile-support__head">
            <h3>Contact support</h3>
            <button type="button" className="profile-support__back" onClick={() => setOpen(false)}>
              Back
            </button>
          </div>
          <p className="profile-support__lead">
            Send a message to the team. Replies show up here in Settings.
          </p>
          <form className="profile-support__form" onSubmit={(e) => void onSubmit(e)}>
            <label>
              Subject
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={120}
                required
                placeholder="e.g. Missing gems"
              />
            </label>
            <label>
              Message
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={4000}
                required
                rows={4}
                placeholder="Describe what happened…"
              />
            </label>
            {error && <p className="profile-support__err">{error}</p>}
            {ok && <p className="profile-support__ok">{ok}</p>}
            <button type="submit" className="btn scores-close" disabled={busy}>
              {busy ? "Sending…" : "Send message"}
            </button>
          </form>

          {tickets.length > 0 && (
            <ul className="profile-support__list">
              {tickets.map((t) => (
                <li key={t.id} className="profile-support__ticket">
                  <div className="profile-support__ticket-top">
                    <strong>{t.subject}</strong>
                    <span className={`profile-support__status profile-support__status--${t.status}`}>
                      {t.status}
                    </span>
                  </div>
                  <p>{t.message}</p>
                  {t.admin_reply && (
                    <div className="profile-support__reply">
                      <span>Support reply</span>
                      <p>{t.admin_reply}</p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
