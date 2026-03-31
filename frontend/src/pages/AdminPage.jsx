import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, BarChart3, Users, Lock, LogOut, Plus, Trash2, Eye, EyeOff, Save, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const API = process.env.REACT_APP_BACKEND_URL;

function AdminPage() {
  const navigate = useNavigate();
  const [token, setToken] = useState(localStorage.getItem('admin_token') || '');
  const [loggedIn, setLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [tab, setTab] = useState('settings');

  // Check token validity on mount
  useEffect(() => {
    if (token) {
      fetch(`${API}/api/admin/stats`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => { if (r.ok) setLoggedIn(true); else { setToken(''); localStorage.removeItem('admin_token'); } })
        .catch(() => { setToken(''); localStorage.removeItem('admin_token'); });
    }
  }, [token]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const r = await fetch(`${API}/api/admin/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
      if (!r.ok) { setLoginError('Mot de passe incorrect'); return; }
      const data = await r.json();
      setToken(data.token);
      localStorage.setItem('admin_token', data.token);
      setLoggedIn(true);
      setPassword('');
    } catch { setLoginError('Erreur de connexion'); }
  };

  const logout = () => { setToken(''); setLoggedIn(false); localStorage.removeItem('admin_token'); };
  const authHeaders = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  if (!loggedIn) return <LoginScreen password={password} setPassword={setPassword} error={loginError} onSubmit={handleLogin} />;

  return (
    <div data-testid="admin-page" className="min-h-screen bg-[#0f1117]">
      <header className="bg-[#1a1d2e] border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#ff4605] flex items-center justify-center">
              <Settings className="w-4 h-4 text-white" />
            </div>
            <span className="font-['Mulish'] font-extrabold text-white text-sm">Admin <span className="text-[#ff4605]">Dashboard</span></span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/')} className="text-xs text-gray-400 hover:text-white transition">Voir le site</button>
            <Button onClick={logout} variant="ghost" className="text-gray-400 hover:text-white h-8 px-3 text-xs" data-testid="admin-logout">
              <LogOut className="w-3.5 h-3.5 mr-1" /> Deconnexion
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-1 mb-6 bg-[#1a1d2e] rounded-lg p-1 w-fit">
          {[
            { id: 'settings', label: 'Configuration', icon: Settings },
            { id: 'ranges', label: 'Fourchettes', icon: BarChart3 },
            { id: 'leads', label: 'Leads', icon: Users },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)} data-testid={`tab-${id}`}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition ${tab === id ? 'bg-[#ff4605] text-white' : 'text-gray-400 hover:text-white'}`}>
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {tab === 'settings' && <SettingsTab authHeaders={authHeaders} />}
        {tab === 'ranges' && <RangesTab authHeaders={authHeaders} />}
        {tab === 'leads' && <LeadsTab authHeaders={authHeaders} />}
      </div>
    </div>
  );
}

/* ── Login Screen ── */
function LoginScreen({ password, setPassword, error, onSubmit }) {
  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#ff4605]/10 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-[#ff4605]" />
          </div>
          <h1 className="font-['Mulish'] text-2xl font-[900] text-white">Administration</h1>
          <p className="text-gray-500 text-sm mt-1">Connectez-vous pour acceder au dashboard</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <Input data-testid="admin-password-input" type="password" placeholder="Mot de passe admin" value={password}
            onChange={e => setPassword(e.target.value)} className="h-12 bg-[#1a1d2e] border-white/10 text-white placeholder:text-gray-500 rounded-xl" />
          {error && <p className="text-red-400 text-sm" data-testid="admin-login-error">{error}</p>}
          <Button type="submit" data-testid="admin-login-btn" disabled={!password} className="w-full h-12 bg-[#ff4605] hover:bg-[#e63e00] text-white font-bold rounded-xl">
            Se connecter
          </Button>
        </form>
      </div>
    </div>
  );
}

/* ── Settings Tab ── */
function SettingsTab({ authHeaders }) {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [showSecrets, setShowSecrets] = useState({});

  const load = useCallback(async () => {
    const r = await fetch(`${API}/api/admin/settings`, { headers: authHeaders });
    if (r.ok) setSettings(await r.json());
  }, [authHeaders]);

  useEffect(() => { load(); }, [load]);

  const update = (key, val) => setSettings(s => ({ ...s, [key]: val }));

  const save = async () => {
    setSaving(true); setMsg('');
    try {
      const r = await fetch(`${API}/api/admin/settings`, { method: 'POST', headers: authHeaders, body: JSON.stringify(settings) });
      if (r.ok) { setSettings(await r.json()); setMsg('Parametres sauvegardes'); }
      else setMsg('Erreur sauvegarde');
    } catch { setMsg('Erreur reseau'); }
    setSaving(false);
    setTimeout(() => setMsg(''), 3000);
  };

  if (!settings) return <div className="text-gray-400">Chargement...</div>;

  const Field = ({ label, field, type = 'text', secret = false }) => (
    <div>
      <label className="text-xs font-medium text-gray-400 mb-1 block">{label}</label>
      <div className="relative">
        <Input data-testid={`setting-${field}`}
          type={secret && !showSecrets[field] ? 'password' : type}
          value={settings[field] ?? ''} onChange={e => update(field, type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
          className="h-10 bg-[#1a1d2e] border-white/10 text-white rounded-lg pr-10" />
        {secret && (
          <button type="button" onClick={() => setShowSecrets(s => ({ ...s, [field]: !s[field] }))} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
            {showSecrets[field] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );

  const Toggle = ({ label, field }) => (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-gray-300">{label}</span>
      <button data-testid={`toggle-${field}`} onClick={() => update(field, !settings[field])}
        className={`w-11 h-6 rounded-full transition relative ${settings[field] ? 'bg-[#ff4605]' : 'bg-gray-600'}`}>
        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition ${settings[field] ? 'left-6' : 'left-1'}`} />
      </button>
    </div>
  );

  return (
    <div className="space-y-6 max-w-2xl">
      <Section title="Autobiz API" desc="Connexion a l'API de cotation vehicule">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Base URL" field="autobiz_base_url" />
          <Field label="Market Value" field="autobiz_market_value" />
          <Field label="Username" field="autobiz_username" secret />
          <Field label="Password" field="autobiz_password" secret />
        </div>
      </Section>

      <Section title="Pricing" desc="Remise par defaut si aucune fourchette ne correspond">
        <Field label="Remise par defaut (%)" field="default_discount_percent" type="number" />
      </Section>

      <Section title="HubSpot CRM" desc="Integration CRM pour la gestion des contacts et deals">
        <Toggle label="Activer HubSpot" field="enable_hubspot" />
        {settings.enable_hubspot && <Field label="API Key" field="hubspot_api_key" secret />}
      </Section>

      <Section title="Webhook" desc="Envoyer les leads vers un service externe">
        <Toggle label="Activer Webhook" field="enable_webhook" />
        {settings.enable_webhook && <Field label="URL du webhook" field="webhook_url" />}
      </Section>

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={saving} data-testid="save-settings-btn" className="bg-[#ff4605] hover:bg-[#e63e00] text-white font-bold rounded-lg px-6">
          <Save className="w-4 h-4 mr-2" /> {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </Button>
        {msg && <span className={`text-sm ${msg.includes('Erreur') ? 'text-red-400' : 'text-green-400'}`}>{msg}</span>}
      </div>
    </div>
  );
}

/* ── Ranges Tab ── */
function RangesTab({ authHeaders }) {
  const [ranges, setRanges] = useState([]);
  const [newRange, setNewRange] = useState({ start_value: '', end_value: '', range_value: '' });

  const load = useCallback(async () => {
    const r = await fetch(`${API}/api/admin/ranges`, { headers: authHeaders });
    if (r.ok) { const d = await r.json(); setRanges(d.ranges); }
  }, [authHeaders]);

  useEffect(() => { load(); }, [load]);

  const addRange = async () => {
    const { start_value, end_value, range_value } = newRange;
    if (start_value === '' || end_value === '' || range_value === '') return;
    await fetch(`${API}/api/admin/ranges`, { method: 'POST', headers: authHeaders, body: JSON.stringify({ start_value: parseFloat(start_value), end_value: parseFloat(end_value), range_value: parseFloat(range_value) }) });
    setNewRange({ start_value: '', end_value: '', range_value: '' });
    load();
  };

  const deleteRange = async (id) => {
    await fetch(`${API}/api/admin/ranges/${id}`, { method: 'DELETE', headers: authHeaders });
    load();
  };

  return (
    <div className="max-w-3xl">
      <Section title="Fourchettes de prix" desc="Pourcentage d'ajustement applique selon la valeur Autobiz. Valeur negative = reduction.">
        <div className="overflow-hidden rounded-lg border border-white/5">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#1a1d2e] text-gray-400 text-xs uppercase">
                <th className="px-4 py-3 text-left">Valeur min</th>
                <th className="px-4 py-3 text-left">Valeur max</th>
                <th className="px-4 py-3 text-left">Ajustement %</th>
                <th className="px-4 py-3 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {ranges.map(r => (
                <tr key={r.id} className="text-gray-300 hover:bg-white/[0.02] transition" data-testid={`range-row-${r.id}`}>
                  <td className="px-4 py-3">{Number(r.start_value).toLocaleString('fr-FR')} EUR</td>
                  <td className="px-4 py-3">{Number(r.end_value).toLocaleString('fr-FR')} EUR</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${r.range_value < 0 ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                      {r.range_value > 0 ? '+' : ''}{r.range_value}%
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => deleteRange(r.id)} data-testid={`delete-range-${r.id}`} className="text-gray-500 hover:text-red-400 transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex gap-2 items-end">
          <div className="flex-1">
            <label className="text-xs text-gray-500 mb-1 block">Min</label>
            <Input data-testid="new-range-start" type="number" placeholder="0" value={newRange.start_value} onChange={e => setNewRange(n => ({ ...n, start_value: e.target.value }))}
              className="h-9 bg-[#1a1d2e] border-white/10 text-white rounded-lg" />
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-500 mb-1 block">Max</label>
            <Input data-testid="new-range-end" type="number" placeholder="5000" value={newRange.end_value} onChange={e => setNewRange(n => ({ ...n, end_value: e.target.value }))}
              className="h-9 bg-[#1a1d2e] border-white/10 text-white rounded-lg" />
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-500 mb-1 block">%</label>
            <Input data-testid="new-range-value" type="number" placeholder="-15" value={newRange.range_value} onChange={e => setNewRange(n => ({ ...n, range_value: e.target.value }))}
              className="h-9 bg-[#1a1d2e] border-white/10 text-white rounded-lg" />
          </div>
          <Button onClick={addRange} data-testid="add-range-btn" className="h-9 bg-[#ff4605] hover:bg-[#e63e00] text-white rounded-lg px-4">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </Section>
    </div>
  );
}

/* ── Leads Tab ── */
function LeadsTab({ authHeaders }) {
  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [expanded, setExpanded] = useState(null);

  const load = useCallback(async () => {
    const r = await fetch(`${API}/api/admin/leads?limit=100`, { headers: authHeaders });
    if (r.ok) { const d = await r.json(); setLeads(d.leads); setTotal(d.total); }
  }, [authHeaders]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-['Mulish'] font-bold text-lg">{total} lead{total > 1 ? 's' : ''}</h2>
        <Button onClick={load} variant="ghost" className="text-gray-400 hover:text-white h-8 px-3 text-xs" data-testid="refresh-leads">
          <RefreshCw className="w-3.5 h-3.5 mr-1" /> Actualiser
        </Button>
      </div>

      <div className="space-y-2">
        {leads.map(lead => {
          const isOpen = expanded === lead.id;
          const c = lead.client || {};
          const v = lead.vehicle || {};
          const p = lead.pricing || {};
          return (
            <div key={lead.id} className="bg-[#1a1d2e] rounded-lg border border-white/5 overflow-hidden" data-testid={`lead-${lead.id}`}>
              <button onClick={() => setExpanded(isOpen ? null : lead.id)} className="w-full px-4 py-3 flex items-center gap-4 text-left hover:bg-white/[0.02] transition">
                <div className={`w-2 h-2 rounded-full shrink-0 ${lead.is_drivable ? 'bg-green-400' : 'bg-orange-400'}`} />
                <div className="flex-1 min-w-0">
                  <span className="text-white text-sm font-medium">{c.firstname} {c.lastname}</span>
                  <span className="text-gray-500 text-xs ml-3">{c.email}</span>
                </div>
                <div className="text-sm text-gray-300 shrink-0">{v.make} {v.model}</div>
                <div className="text-sm font-bold text-[#ff4605] shrink-0 w-24 text-right">{p.final_price ? `${Number(p.final_price).toLocaleString('fr-FR')} EUR` : '—'}</div>
                <div className="text-xs text-gray-500 shrink-0 w-32 text-right">{lead.created_at?.slice(0, 16).replace('T', ' ')}</div>
                {isOpen ? <ChevronUp className="w-4 h-4 text-gray-500 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />}
              </button>
              {isOpen && (
                <div className="px-4 pb-4 pt-2 border-t border-white/5 grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <Detail label="Plaque" value={lead.plate} />
                  <Detail label="Annee" value={v.year} />
                  <Detail label="KM" value={lead.mileage ? `${Number(lead.mileage).toLocaleString('fr-FR')} km` : '—'} />
                  <Detail label="Carburant" value={v.fuel} />
                  <Detail label="Boite" value={v.gearbox} />
                  <Detail label="Roulant" value={lead.is_drivable ? 'Oui' : 'Non'} />
                  <Detail label="Telephone" value={c.phone} />
                  <Detail label="Code postal" value={c.postal_code} />
                  <Detail label="Source" value={lead.source} />
                  <Detail label="Base prix" value={p.base_price ? `${Number(p.base_price).toLocaleString('fr-FR')} EUR` : '—'} />
                  <Detail label="Range prix" value={p.range_price ? `${Number(p.range_price).toLocaleString('fr-FR')} EUR` : '—'} />
                  <Detail label="Remise %" value={p.discount_percent != null ? `${p.discount_percent}%` : '—'} />
                  {lead.tracking?.utm_source && <Detail label="UTM Source" value={lead.tracking.utm_source} />}
                  {lead.tracking?.gclid && <Detail label="GCLID" value={lead.tracking.gclid} />}
                  <Detail label="ID" value={lead.id} />
                </div>
              )}
            </div>
          );
        })}
        {leads.length === 0 && <p className="text-gray-500 text-sm text-center py-8">Aucun lead</p>}
      </div>
    </div>
  );
}

/* ── Helpers ── */
function Section({ title, desc, children }) {
  return (
    <div className="bg-[#1a1d2e] rounded-xl border border-white/5 p-5 md:p-6">
      <h3 className="font-['Mulish'] font-bold text-white mb-1">{title}</h3>
      {desc && <p className="text-xs text-gray-500 mb-4">{desc}</p>}
      {children}
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <span className="text-gray-500">{label}</span>
      <p className="text-gray-300 font-medium truncate">{value || '—'}</p>
    </div>
  );
}

export default AdminPage;
