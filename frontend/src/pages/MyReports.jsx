import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { FileText, AlertCircle, Search } from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function ScoreCircle({ score, tier }) {
  const pct = Math.round(score * 100);
  const cfg = {
    strong:   { ring: '#22c55e', text: '#15803d', bg: '#f0fdf4' },
    possible: { ring: '#f59e0b', text: '#b45309', bg: '#fffbeb' },
    weak:     { ring: '#94a3b8', text: '#64748b', bg: '#f8fafc' },
  }[tier] ?? { ring: '#94a3b8', text: '#64748b', bg: '#f8fafc' };

  return (
    <div
      className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 font-bold text-xs"
      style={{ border: `4px solid ${cfg.ring}`, color: cfg.text, background: cfg.bg }}
    >
      {pct}%
    </div>
  );
}

function TierPill({ tier }) {
  const cfg = {
    strong:   { label: 'Strong', bg: '#dcfce7', color: '#15803d' },
    possible: { label: 'Possible', bg: '#fef3c7', color: '#b45309' },
    weak:     { label: 'Weak', bg: '#f1f5f9', color: '#64748b' },
  }[tier] ?? { label: tier, bg: '#f1f5f9', color: '#64748b' };
  return (
    <span
      className="text-xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {cfg.label}
    </span>
  );
}



class ChatErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-xl">
            <h1 className="text-red-500 font-bold mb-2">Chat Error</h1>
            <pre className="text-xs bg-gray-100 p-2 rounded">{this.state.error?.toString()}</pre>
            <button onClick={this.props.onClose} className="mt-4 px-4 py-2 bg-gray-200 rounded">Close</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function ChatModal({ lostId, foundId, myUserId, onClose }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    const { data } = await api.getMessages(lostId, foundId);
    if (data) setMessages(data.messages);
    setLoading(false);
  }, [lostId, foundId]);

  useEffect(() => {
    fetchMessages();
    const intervalId = setInterval(fetchMessages, 3000);
    return () => clearInterval(intervalId);
  }, [fetchMessages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const msg = text;
    setText('');
    await api.sendMessage(lostId, foundId, msg);
    fetchMessages();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg h-[500px] overflow-hidden animate-scale-in flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50 shrink-0">
          <h2 className="font-bold text-lg" style={{ color: '#002045' }}>Match Chat</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-gray-50/50">
          {loading && <p className="text-xs text-gray-400 text-center">Loading chat...</p>}
          {!loading && messages.length === 0 && (
            <p className="text-xs text-gray-400 text-center my-auto">Say hello! You are now connected.</p>
          )}
          {messages.map((m) => {
            const isMine = m.sender_id === myUserId;
            return (
              <div key={m.id} className={`flex flex-col max-w-[80%] ${isMine ? 'self-end items-end' : 'self-start items-start'}`}>
                <span className="text-[10px] text-gray-400 mb-0.5 px-1">{isMine ? 'You' : m.sender_email}</span>
                <div className={`px-3 py-2 rounded-2xl text-sm ${isMine ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'}`}>
                  {m.message}
                </div>
              </div>
            );
          })}
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-200 flex gap-3 shrink-0">
          <input
            type="text"
            value={text}
            autoFocus
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 text-sm outline-none focus:border-indigo-500 transition-colors"
          />
          <button type="submit" disabled={!text.trim()} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors">
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Match Card ───────────────────────────────────────────────────────────────

function FeedMatchCard({ match, onDismiss, onResolved, user }) {
  const { myReport, candidate, score, tier, reasons, breakdown } = match;
  const [expanded, setExpanded] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  // Determine which report is the "found" one to get the contact
  const amILost = myReport.type === 'lost';
  const contactEmail = amILost ? candidate.contact : myReport.contact;

  return (
    <>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
        {/* Card Header (My Item vs Their Item) */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 rounded-t-xl flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-3">
            {myReport.image_url && (
              <img src={myReport.image_url} alt="My item" className="w-12 h-12 rounded-lg object-cover shadow-sm border border-gray-200 shrink-0" />
            )}
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Your {myReport.type} Item</span>
              <span className="font-semibold text-sm text-gray-900 capitalize">{myReport.category}</span>
              <span className="text-xs text-gray-500 line-clamp-1 max-w-[200px]">{myReport.description}</span>
            </div>
          </div>
          
          <div className="hidden sm:flex flex-col items-center px-4 shrink-0">
            <div className="h-0.5 w-16 bg-gray-300 rounded-full relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-50/50 px-1">
                <span className="material-symbols-outlined text-indigo-400" style={{fontSize: 20}}>compare_arrows</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex flex-col gap-1 text-right">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Matched {candidate.type} Item</span>
              <span className="font-semibold text-sm text-gray-900 capitalize">{candidate.category}</span>
              <span className="text-xs text-gray-500 line-clamp-1 max-w-[200px]">{candidate.description}</span>
            </div>
            {candidate.image_url && (
              <img src={candidate.image_url} alt="Matched item" className="w-12 h-12 rounded-lg object-cover shadow-sm border border-gray-200 shrink-0" />
            )}
          </div>
        </div>

        {/* Card Body */}
        <div className="p-4">
          <div className="flex gap-4">
            {/* Left: match details */}
            <div className="flex-1 min-w-0">
              {/* Header row */}
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <TierPill tier={tier} />
              </div>

              {/* Meta */}
              <div className="flex items-center gap-3 text-xs text-gray-500 mb-3 flex-wrap">
                <span className="flex items-center gap-1"><span className="material-symbols-outlined" style={{ fontSize: 14 }}>location_on</span>{candidate.location}</span>
                <span className="flex items-center gap-1"><span className="material-symbols-outlined" style={{ fontSize: 14 }}>schedule</span>{formatDate(candidate.event_date)}</span>
                {candidate.color && <span className="flex items-center gap-1"><span className="material-symbols-outlined" style={{ fontSize: 14 }}>palette</span>{candidate.color}</span>}
              </div>

              {/* Reason chips */}
              {reasons.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {reasons.map((r, i) => (
                    <span key={i} className="text-xs px-2.5 py-0.5 rounded-full font-medium" style={{ background: '#eff6ff', color: '#1d4ed8' }}>{r}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Right: score + actions */}
            <div className="flex flex-col items-end justify-between gap-3 pl-4 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-400 hidden sm:block">Match Score</span>
                <ScoreCircle score={score} tier={tier} />
              </div>

              <div className="flex flex-col items-end gap-2">

                <div className="flex gap-1.5 flex-wrap justify-end">
                  <button onClick={() => setExpanded((e) => !e)} className="px-3 py-1.5 text-xs border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors font-medium shadow-sm">
                    {expanded ? 'Hide' : 'Review'}
                  </button>

                  {contactEmail ? (
                    <a
                      href={`mailto:${contactEmail}`}
                      className="px-3 py-1.5 text-xs text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors font-medium flex items-center gap-1 shadow-sm"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>mail</span> Email
                    </a>
                  ) : null}

                  <button
                    onClick={() => setChatOpen(!chatOpen)}
                    className="px-3 py-1.5 text-xs text-white rounded-lg transition-colors font-medium flex items-center gap-1 shadow-sm"
                    style={{ background: '#002045' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>chat</span> {chatOpen ? 'Close Chat' : 'Open Chat'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Expanded signal breakdown */}
          {expanded && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Signal Breakdown</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: 'Text similarity',    value: breakdown.text,     weight: '×0.35' },
                  { label: 'Category match',     value: breakdown.category, weight: '×0.25' },
                  { label: 'Location overlap',   value: breakdown.location, weight: '×0.15' },
                  { label: 'Time plausibility',  value: breakdown.time,     weight: '×0.15' },
                  { label: 'Color match',        value: breakdown.color,    weight: '×0.10' },
                ].map((sig) => (
                  <div key={sig.label}>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{sig.label}</span>
                      <span className="font-mono font-semibold tabular-nums">{Math.round(sig.value * 100)}% {sig.weight}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${sig.value * 100}%`, background: '#4f46e5' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chat Modal */}
          {chatOpen && (
            <ChatErrorBoundary onClose={() => setChatOpen(false)}>
              <ChatModal lostId={amILost ? myReport.id : candidate.id} foundId={amILost ? candidate.id : myReport.id} myUserId={user.id} onClose={() => setChatOpen(false)} />
            </ChatErrorBoundary>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MyReports() {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMatches = useCallback(async () => {
    const { data, error: err } = await api.getAllMatches();
    if (err) setError(err);
    else { setMatches(data.matches); setError(''); }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMatches();
    // Poll every 10 seconds so new reports show up automatically
    const intervalId = setInterval(fetchMatches, 10000);
    // Also refetch when the tab/window becomes visible again (e.g. after navigating away and back)
    const handleVisibility = () => { if (document.visibilityState === 'visible') fetchMatches(); };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchMatches]);


  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold mb-1.5" style={{ fontFamily: 'Fraunces, serif', color: 'var(--color-indigo-dark)' }}>
          My Matches
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          A consolidated feed of potential matches for all your submitted reports.
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {!loading && !error && matches.length === 0 && (
        <div className="text-center py-16 rounded-2xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <FileText className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--color-text-muted)' }} />
          <p className="font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>No matches found yet</p>
          <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
            We'll keep looking. Check back later to see if your items find a match!
          </p>
        </div>
      )}

      {!loading && !error && matches.length > 0 && (
        <div className="space-y-4">
          {matches.map((m) => (
            <FeedMatchCard
              key={`${m.myReport.id}-${m.candidate.id}`}
              match={m}
              user={user}
              onDismiss={() => {}}
              onResolved={() => {}}
            />
          ))}
        </div>
      )}
    </div>
  );
}
