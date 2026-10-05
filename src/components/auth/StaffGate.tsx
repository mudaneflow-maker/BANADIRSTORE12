import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { StaffRoleContext, normalizeRole, ROLE_CACHE_KEY, type StaffRole } from '@/lib/roles';
import { ShieldCheck, UserCheck, KeyRound, Sparkles } from 'lucide-react';

type Phase = 'checking' | 'login' | 'not_staff' | 'ready';

const DEFAULT_OWNER_EMAIL = 'banadirkow@gmail.com';
const DEFAULT_OWNER_PASSWORD = '586255';

/**
 * The admin system opens for a signed-in staff account.
 * First time owner setup: banadirkow@gmail.com / 586255
 */
export const StaffGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [phase, setPhase] = useState<Phase>('checking');
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState(DEFAULT_OWNER_EMAIL);
  const [pw, setPw] = useState(DEFAULT_OWNER_PASSWORD);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [offlineOk, setOfflineOk] = useState(false);
  const [role, setRole] = useState<StaffRole>('owner');

  const check = async () => {
    const cached = localStorage.getItem(ROLE_CACHE_KEY);
    if (cached) setRole(normalizeRole(cached));
    const { data } = await supabase.auth.getSession();
    if (!data.session) return setPhase('login');
    if (!navigator.onLine) return setPhase('ready');
    const { data: r, error } = await supabase.rpc('claim_first_owner');
    if (error) return setPhase('ready');
    if (!(r as { staff?: boolean })?.staff) return setPhase('not_staff');
    const { data: me } = await supabase.from('staff_members').select('role').eq('user_id', data.session.user.id).maybeSingle();
    if (me) {
      const nr = normalizeRole(me.role);
      setRole(nr);
      localStorage.setItem(ROLE_CACHE_KEY, nr);
    }
    setPhase('ready');
  };

  useEffect(() => { void check(); }, []);

  const handleQuickOwnerLogin = async () => {
    setEmail(DEFAULT_OWNER_EMAIL);
    setPw(DEFAULT_OWNER_PASSWORD);
    setErr('');
    setBusy(true);

    try {
      // 1. Try sign in first
      let res = await supabase.auth.signInWithPassword({
        email: DEFAULT_OWNER_EMAIL,
        password: DEFAULT_OWNER_PASSWORD,
      });

      // 2. If user doesn't exist, auto create the owner account!
      if (res.error && /invalid login|user not found|invalid credentials/i.test(res.error.message)) {
        const upRes = await supabase.auth.signUp({
          email: DEFAULT_OWNER_EMAIL,
          password: DEFAULT_OWNER_PASSWORD,
          options: { emailRedirectTo: window.location.origin },
        });
        if (upRes.data.session) {
          res = upRes;
        } else {
          // If requires confirmation or offline, sign in locally as owner
          setRole('owner');
          localStorage.setItem(ROLE_CACHE_KEY, 'owner');
          setOfflineOk(true);
          setPhase('ready');
          setBusy(false);
          return;
        }
      }

      if (res.data?.session) {
        setRole('owner');
        localStorage.setItem(ROLE_CACHE_KEY, 'owner');
        setPhase('checking');
        void check();
      } else {
        // Direct local owner fallback
        setRole('owner');
        localStorage.setItem(ROLE_CACHE_KEY, 'owner');
        setOfflineOk(true);
        setPhase('ready');
      }
    } catch {
      setRole('owner');
      localStorage.setItem(ROLE_CACHE_KEY, 'owner');
      setOfflineOk(true);
      setPhase('ready');
    } finally {
      setBusy(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setBusy(true);

    // If logging in with the default owner credentials
    if (email.trim().toLowerCase() === DEFAULT_OWNER_EMAIL.toLowerCase() && pw === DEFAULT_OWNER_PASSWORD) {
      await handleQuickOwnerLogin();
      return;
    }

    const res = mode === 'in'
      ? await supabase.auth.signInWithPassword({ email: email.trim(), password: pw })
      : await supabase.auth.signUp({ email: email.trim(), password: pw, options: { emailRedirectTo: window.location.origin } });
    setBusy(false);

    if (res.error) {
      const m = res.error.message;
      setErr(/invalid login/i.test(m) ? 'Email ama password khaldan.' : /already registered/i.test(m) ? 'Email-kan akoon ayuu leeyahay — gal.' : /at least 6/i.test(m) ? 'Password-ku waa inuu ahaadaa ugu yaraan 6 xaraf.' : /weak|pwned|leaked|compromised/i.test(m) ? 'Password-kan waa mid daciif ah ama hore u baxay — dooro mid adag.' : m);
      return;
    }
    if (!res.data.session) {
      setErr('Akoonka waa la sameeyay. Gal hadda.');
      setMode('in');
      return;
    }
    setPhase('checking');
    void check();
  };

  if (phase === 'ready' || offlineOk) return <StaffRoleContext.Provider value={role}>{children}</StaffRoleContext.Provider>;

  const shell = (body: React.ReactNode) => (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-950 px-4 sm:px-6">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 sm:p-7 shadow-2xl space-y-4">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400 text-2xl shadow-md">⚡</div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">BANADIR STORE</h1>
          <p className="text-xs text-slate-500 mt-0.5">Admin & Store Operations Portal</p>
        </div>
        {body}
      </div>
    </div>
  );

  if (phase === 'checking') return shell(<p className="text-center text-sm text-slate-500 py-6">Waa la hubinayaa akoonka...</p>);

  if (phase === 'not_staff') return shell(
    <div className="space-y-3 text-center text-sm py-2">
      <p className="font-bold text-rose-700">Akoonkan weli looma oggolaan system-ka.</p>
      <p className="text-xs text-slate-600">Owner-ka ha kugu daro: Settings → System Management → Shaqaalaha.</p>
      <button onClick={() => { void supabase.auth.signOut().then(() => setPhase('login')); }} className="w-full rounded-xl bg-slate-900 py-2.5 font-bold text-white text-xs">Ka bax</button>
    </div>
  );

  return shell(
    <div className="space-y-4">
      {/* 1-CLICK QUICK OWNER LOGIN */}
      <button
        type="button"
        onClick={handleQuickOwnerLogin}
        disabled={busy}
        className="w-full rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 p-3 font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98"
      >
        <Sparkles className="w-4 h-4 text-slate-900" />
        {busy ? "Waa la galayaa..." : "Gal Sida Owner (1-Click Login)"}
      </button>

      {/* DEFAULT CREDENTIALS SUMMARY BOX */}
      <div className="rounded-xl border border-amber-200/80 bg-amber-50/70 p-3 text-left space-y-1">
        <div className="flex items-center justify-between text-[11px] font-bold text-amber-950">
          <span>Akoonka Owner-ka (Rasmiga ah):</span>
          <span className="text-[10px] bg-amber-200/80 px-1.5 py-0.5 rounded text-amber-900 font-mono">Owner</span>
        </div>
        <div className="grid grid-cols-2 gap-1 text-[11px] font-mono text-slate-700">
          <div>Email: <span className="font-bold text-slate-900">{DEFAULT_OWNER_EMAIL}</span></div>
          <div>Password: <span className="font-bold text-slate-900">{DEFAULT_OWNER_PASSWORD}</span></div>
        </div>
        <div className="text-[10px] text-slate-500 font-sans pt-0.5">
          PIN-ka Lacagta: <strong className="font-mono text-slate-800">8125</strong> (30s auto-lock & Face ID)
        </div>
      </div>

      <div className="relative flex py-1 items-center">
        <div className="flex-grow border-t border-slate-200"></div>
        <span className="flex-shrink mx-3 text-[10px] font-bold uppercase text-slate-400">ama geli xogtaada</span>
        <div className="flex-grow border-t border-slate-200"></div>
      </div>

      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="banadirkow@gmail.com"
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-900"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Password</label>
          <input
            type="password"
            required
            minLength={6}
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="586255"
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-900"
          />
        </div>

        {err && <p className="text-xs font-bold text-rose-600 text-center">{err}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-slate-900 hover:bg-slate-800 py-2.5 font-bold text-amber-300 disabled:opacity-50 text-xs shadow-sm transition-all"
        >
          {busy ? "..." : mode === 'in' ? 'Gal Akoonka' : 'Samee Akoon Owner ah'}
        </button>

        <button
          type="button"
          onClick={() => { setMode(mode === 'in' ? 'up' : 'in'); setErr(''); }}
          className="w-full text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors text-center"
        >
          {mode === 'in' ? 'Akoon cusub ma rabtaa? Samee' : 'Akoon horay ayaad u leedahay? Gal'}
        </button>

        <button
          type="button"
          onClick={() => {
            setRole('owner');
            localStorage.setItem(ROLE_CACHE_KEY, 'owner');
            setOfflineOk(true);
          }}
          className="w-full rounded-xl border border-slate-200 py-2 text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition-colors"
        >
          {!navigator.onLine ? 'Internet ma jiro — sii wad offline' : 'Sii wad offline (Owner Mode)'}
        </button>
      </form>
    </div>
  );
};
