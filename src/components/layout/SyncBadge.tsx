import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { Cloud, CloudOff, RefreshCw, AlertTriangle, LogIn } from 'lucide-react';
import { getSyncStatus, subscribeSync, pendingCount, flush } from '../../lib/cloud-sync';
import { staffSignIn, staffSignUp } from '../../lib/portal-publish';

export const SyncBadge: React.FC = () => {
  const status = useSyncExternalStore(subscribeSync, getSyncStatus, () => 'synced' as const);
  const [remote, setRemote] = useState(false);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    const h = () => setRemote(true);
    window.addEventListener('benadir-remote-update', h);
    return () => window.removeEventListener('benadir-remote-update', h);
  }, []);

  const map = {
    synced: { Icon: Cloud, text: 'Online', cls: 'bg-emerald-600 text-white border-emerald-600 shadow-sm', dot: 'bg-lime-300' },
    syncing: { Icon: RefreshCw, text: 'Waa la kaydinayaa...', cls: 'bg-sky-600 text-white border-sky-600 shadow-sm', dot: 'bg-sky-200' },
    pending: { Icon: RefreshCw, text: `${pendingCount()} sugaya`, cls: 'bg-amber-500 text-white border-amber-500 shadow-sm', dot: 'bg-amber-100' },
    offline: { Icon: CloudOff, text: `Offline — ${pendingCount()} sugaya`, cls: 'bg-slate-700 text-white border-slate-700 shadow-sm', dot: 'bg-slate-300' },
    error: { Icon: AlertTriangle, text: 'Cilad — dib ayaa loo isku dayayaa', cls: 'bg-rose-600 text-white border-rose-600 shadow-sm', dot: 'bg-rose-200' },
    signed_out: { Icon: LogIn, text: 'Gal si xogta online loo kaydiyo', cls: 'bg-rose-600 text-white border-rose-600 shadow-sm', dot: 'bg-rose-200' },
  }[status];

  const submit = async (mode: 'in' | 'up') => {
    setErr('');
    const res = mode === 'in' ? await staffSignIn(email, pw) : await staffSignUp(email, pw);
    if (res) setErr(res);
    else { setOpen(false); void flush(); }
  };

  return (
    <div className="relative flex items-center gap-2">
      {remote && (
        <button onClick={() => location.reload()} className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-lime-400 text-black">
          Xog cusub — cusboonaysii
        </button>
      )}
      <button
        onClick={() => (status === 'signed_out' ? setOpen((o) => !o) : void flush())}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold ${map.cls}`}
      >
        <span className={`h-2 w-2 rounded-full ${map.dot} ${status === 'synced' ? 'animate-pulse' : ''}`} aria-hidden />
        <map.Icon className={`w-3.5 h-3.5 ${status === 'syncing' ? 'animate-spin' : ''}`} />
        <span>{map.text}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-50 w-72 bg-white border border-slate-200 rounded-xl shadow-xl p-3 space-y-2">
          <div className="text-xs font-bold text-slate-800">Gal akoonka shaqaalaha</div>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg" />
          <input value={pw} onChange={(e) => setPw(e.target.value)} type="password" placeholder="Password" className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg" />
          {err && <div className="text-[11px] text-rose-600">{err}</div>}
          <div className="flex gap-2">
            <button onClick={() => submit('in')} className="flex-1 py-2 text-xs font-bold bg-slate-900 text-lime-400 rounded-lg">Gal</button>
            <button onClick={() => submit('up')} className="flex-1 py-2 text-xs font-bold bg-slate-100 text-slate-700 rounded-lg">Akoon cusub</button>
          </div>
        </div>
      )}
    </div>
  );
};
