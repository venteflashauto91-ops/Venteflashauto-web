import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, BarChart3, Users, Lock, LogOut, Plus, Trash2, Eye, EyeOff, Save, RefreshCw, ChevronDown, ChevronUp, MapPin, Calendar, Edit2, X, SlidersHorizontal, Globe, Zap, Upload, ImageIcon } from 'lucide-react';
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
        <div className="flex gap-1 mb-6 bg-[#1a1d2e] rounded-lg p-1 w-fit flex-wrap">
          {[
            { id: 'settings', label: 'Configuration', icon: Settings },
            { id: 'form', label: 'Formulaire', icon: SlidersHorizontal },
            { id: 'ranges', label: 'Fourchettes', icon: BarChart3 },
            { id: 'garages', label: 'Garages', icon: MapPin },
            { id: 'appointments', label: 'RDV', icon: Calendar },
            { id: 'leads', label: 'Leads', icon: Users },
            { id: 'seo', label: 'SEO Pages', icon: Globe },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)} data-testid={`tab-${id}`}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition ${tab === id ? 'bg-[#ff4605] text-white' : 'text-gray-400 hover:text-white'}`}>
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {tab === 'settings' && <SettingsTab authHeaders={authHeaders} />}
        {tab === 'form' && <FormConfigTab authHeaders={authHeaders} />}
        {tab === 'ranges' && <RangesTab authHeaders={authHeaders} />}
        {tab === 'garages' && <GaragesTab authHeaders={authHeaders} />}
        {tab === 'appointments' && <AppointmentsTab authHeaders={authHeaders} />}
        {tab === 'leads' && <LeadsTab authHeaders={authHeaders} />}
        {tab === 'seo' && <SeoTab authHeaders={authHeaders} />}
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

/* ── Form Config Tab ── */
function FormConfigTab({ authHeaders }) {
  const [config, setConfig] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const FIELD_ORDER = [
    { key: 'additional_info', label: 'Informations complementaires', desc: 'Les 4 questions (importe, premier proprietaire, carnet, factures)' },
    { key: 'photos', label: 'Photos du vehicule', desc: 'Upload de photos du vehicule' },
    { key: 'firstname', label: 'Prenom', desc: 'Prenom du client' },
    { key: 'lastname', label: 'Nom', desc: 'Nom de famille du client' },
    { key: 'email', label: 'Email', desc: 'Adresse email du client' },
    { key: 'phone', label: 'Telephone', desc: 'Numero de telephone du client' },
    { key: 'postal_code', label: 'Code postal', desc: 'Code postal du client' },
  ];

  const load = useCallback(async () => {
    const r = await fetch(`${API}/api/admin/form-config`, { headers: authHeaders });
    if (r.ok) setConfig(await r.json());
  }, [authHeaders]);

  useEffect(() => { load(); }, [load]);

  const toggleField = (fieldKey, prop) => {
    setConfig(prev => ({
      ...prev,
      fields: {
        ...prev.fields,
        [fieldKey]: {
          ...prev.fields[fieldKey],
          [prop]: !prev.fields[fieldKey][prop],
          // If disabling, also make not required
          ...(prop === 'enabled' && prev.fields[fieldKey].enabled ? { required: false } : {}),
        },
      },
    }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    const r = await fetch(`${API}/api/admin/form-config`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: config.fields }),
    });
    setSaving(false);
    if (r.ok) setSaved(true);
  };

  if (!config) return <p className="text-gray-500 text-sm">Chargement...</p>;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-white font-['Mulish'] font-bold text-lg">Configuration du formulaire</h2>
          <p className="text-gray-500 text-xs mt-1">Activez/desactivez les champs et rendez-les obligatoires ou optionnels</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-[#ff4605] hover:bg-[#e63e00] text-white font-bold rounded-lg h-9 px-4 text-sm" data-testid="save-form-config">
          {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
          {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </Button>
      </div>
      {saved && <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-green-400 text-sm mb-4" data-testid="form-config-saved">Configuration sauvegardee</div>}

      <div className="space-y-2">
        {FIELD_ORDER.map(({ key, label, desc }) => {
          const field = config.fields[key] || { enabled: true, required: false };
          return (
            <div key={key} className={`bg-[#1a1d2e] rounded-lg border border-white/5 p-4 transition ${!field.enabled ? 'opacity-50' : ''}`} data-testid={`form-field-${key}`}>
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">{label}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{desc}</p>
                </div>
                <div className="flex items-center gap-4 shrink-0 ml-4">
                  {/* Required toggle */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-16 text-right">Obligatoire</span>
                    <button
                      data-testid={`toggle-required-${key}`}
                      onClick={() => field.enabled && toggleField(key, 'required')}
                      disabled={!field.enabled}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${field.required && field.enabled ? 'bg-[#ff4605]' : 'bg-gray-700'} ${!field.enabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${field.required && field.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                  {/* Enabled toggle */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Actif</span>
                    <button
                      data-testid={`toggle-enabled-${key}`}
                      onClick={() => toggleField(key, 'enabled')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${field.enabled ? 'bg-green-500' : 'bg-gray-700'}`}
                    >
                      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${field.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 bg-[#1a1d2e] rounded-lg border border-white/5 p-4">
        <p className="text-xs text-gray-500">
          Les champs desactives ne seront pas affiches dans le formulaire.
          Les champs obligatoires devront etre remplis pour soumettre l'estimation.
        </p>
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
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);

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

  const testAutobiz = async () => {
    setTesting(true); setTestResult(null);
    try {
      const r = await fetch(`${API}/api/admin/test-autobiz`, { method: 'POST', headers: authHeaders });
      if (r.ok) setTestResult(await r.json());
      else setTestResult({ success: false, error: 'Erreur serveur' });
    } catch { setTestResult({ success: false, error: 'Erreur reseau' }); }
    setTesting(false);
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
        <div className="mt-4 flex items-center gap-3">
          <Button onClick={testAutobiz} disabled={testing} data-testid="test-autobiz-btn" variant="outline"
            className="border-white/10 text-gray-300 hover:text-white hover:border-white/20 rounded-lg px-4 h-9 text-sm">
            <RefreshCw className={`w-3.5 h-3.5 mr-2 ${testing ? 'animate-spin' : ''}`} />
            {testing ? 'Test en cours...' : 'Tester la connexion'}
          </Button>
          {testResult && (
            <div data-testid="test-autobiz-result" className={`text-xs px-3 py-1.5 rounded-lg ${testResult.success ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
              {testResult.success
                ? `Connexion OK (token recu)`
                : `Echec: ${testResult.response_code || testResult.error || 'Erreur inconnue'}${testResult.response_message ? ` — ${testResult.response_message}` : ''}`
              }
              {testResult.status_code && !testResult.success && <span className="ml-2 opacity-60">HTTP {testResult.status_code}</span>}
            </div>
          )}
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
        <Toggle label="Activer Webhook (estimation)" field="enable_webhook" />
        {settings.enable_webhook && <Field label="URL du webhook estimation" field="webhook_url" />}
        <div className="mt-3 pt-3 border-t border-white/5">
          <Toggle label="Activer Webhook (confirmation RDV)" field="enable_webhook_appointment" />
          {settings.enable_webhook_appointment && <Field label="URL du webhook RDV" field="webhook_appointment_url" />}
        </div>
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

/* ── Garages Tab ── */
function GaragesTab({ authHeaders }) {
  const [garages, setGarages] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', address: '', postal_code: '', city: '', phone: '', email: '', hours: '', active: true, display_order: 0, notes: '', zone: '' });

  const load = useCallback(async () => {
    const r = await fetch(`${API}/api/admin/garages`, { headers: authHeaders });
    if (r.ok) { const d = await r.json(); setGarages(d.garages); }
  }, [authHeaders]);
  useEffect(() => { load(); }, [load]);

  const resetForm = () => { setForm({ name: '', address: '', postal_code: '', city: '', phone: '', email: '', hours: '', active: true, display_order: 0, notes: '', zone: '' }); setEditing(null); };

  const save = async () => {
    if (!form.name) return;
    if (editing) {
      await fetch(`${API}/api/admin/garages/${editing}`, { method: 'PUT', headers: authHeaders, body: JSON.stringify(form) });
    } else {
      await fetch(`${API}/api/admin/garages`, { method: 'POST', headers: authHeaders, body: JSON.stringify(form) });
    }
    resetForm(); load();
  };

  const del = async (id) => { await fetch(`${API}/api/admin/garages/${id}`, { method: 'DELETE', headers: authHeaders }); load(); };
  const edit = (g) => { setEditing(g.id); setForm({ name: g.name, address: g.address, postal_code: g.postal_code, city: g.city, phone: g.phone, email: g.email, hours: g.hours, active: g.active, display_order: g.display_order, notes: g.notes || '', zone: g.zone || '' }); };
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="max-w-4xl space-y-6">
      <Section title={editing ? 'Modifier le garage' : 'Ajouter un garage'} desc="Garages partenaires affiches aux clients apres l'estimation">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div><label className="text-xs text-gray-500 mb-1 block">Nom *</label><Input data-testid="garage-name" value={form.name} onChange={e => upd('name', e.target.value)} className="h-9 bg-[#1a1d2e] border-white/10 text-white rounded-lg" /></div>
          <div><label className="text-xs text-gray-500 mb-1 block">Adresse</label><Input data-testid="garage-address" value={form.address} onChange={e => upd('address', e.target.value)} className="h-9 bg-[#1a1d2e] border-white/10 text-white rounded-lg" /></div>
          <div><label className="text-xs text-gray-500 mb-1 block">Code postal</label><Input data-testid="garage-postal" value={form.postal_code} onChange={e => upd('postal_code', e.target.value)} className="h-9 bg-[#1a1d2e] border-white/10 text-white rounded-lg" maxLength={5} /></div>
          <div><label className="text-xs text-gray-500 mb-1 block">Ville</label><Input data-testid="garage-city" value={form.city} onChange={e => upd('city', e.target.value)} className="h-9 bg-[#1a1d2e] border-white/10 text-white rounded-lg" /></div>
          <div><label className="text-xs text-gray-500 mb-1 block">Telephone</label><Input data-testid="garage-phone" value={form.phone} onChange={e => upd('phone', e.target.value)} className="h-9 bg-[#1a1d2e] border-white/10 text-white rounded-lg" /></div>
          <div><label className="text-xs text-gray-500 mb-1 block">Email</label><Input data-testid="garage-email" value={form.email} onChange={e => upd('email', e.target.value)} className="h-9 bg-[#1a1d2e] border-white/10 text-white rounded-lg" /></div>
          <div><label className="text-xs text-gray-500 mb-1 block">Horaires</label><Input data-testid="garage-hours" value={form.hours} onChange={e => upd('hours', e.target.value)} placeholder="Lun-Ven 9h-18h" className="h-9 bg-[#1a1d2e] border-white/10 text-white rounded-lg" /></div>
          <div><label className="text-xs text-gray-500 mb-1 block">Ordre affichage</label><Input data-testid="garage-order" type="number" value={form.display_order} onChange={e => upd('display_order', parseInt(e.target.value) || 0)} className="h-9 bg-[#1a1d2e] border-white/10 text-white rounded-lg" /></div>
          <div className="md:col-span-2"><label className="text-xs text-gray-500 mb-1 block">Notes</label><Input data-testid="garage-notes" value={form.notes} onChange={e => upd('notes', e.target.value)} className="h-9 bg-[#1a1d2e] border-white/10 text-white rounded-lg" /></div>
        </div>
        <div className="flex items-center gap-4 mt-4">
          <label className="text-sm text-gray-300 flex items-center gap-2">
            <input type="checkbox" checked={form.active} onChange={e => upd('active', e.target.checked)} className="rounded" /> Actif
          </label>
          <Button onClick={save} data-testid="save-garage-btn" className="bg-[#ff4605] hover:bg-[#e63e00] text-white rounded-lg px-5 h-9"><Save className="w-4 h-4 mr-1" /> {editing ? 'Mettre a jour' : 'Ajouter'}</Button>
          {editing && <Button onClick={resetForm} variant="ghost" className="text-gray-400 h-9">Annuler</Button>}
        </div>
      </Section>

      <Section title="Garages existants" desc={`${garages.length} garage(s)`}>
        <div className="space-y-2">
          {garages.map(g => (
            <div key={g.id} data-testid={`admin-garage-${g.id}`} className={`flex items-center gap-3 p-3 rounded-lg border ${g.active ? 'border-white/5 bg-[#0f1117]' : 'border-red-500/20 bg-red-500/5'}`}>
              <div className={`w-2 h-2 rounded-full shrink-0 ${g.active ? 'bg-green-400' : 'bg-red-400'}`} />
              <div className="flex-1 min-w-0">
                <span className="text-white text-sm font-medium">{g.name}</span>
                <span className="text-gray-500 text-xs ml-2">{g.postal_code} {g.city}</span>
              </div>
              <span className="text-xs text-gray-500">{g.phone}</span>
              <span className="text-xs text-gray-600">#{g.display_order}</span>
              <button onClick={() => edit(g)} className="text-gray-500 hover:text-white"><Edit2 className="w-3.5 h-3.5" /></button>
              <button onClick={() => del(g.id)} className="text-gray-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
          {garages.length === 0 && <p className="text-gray-500 text-sm text-center py-4">Aucun garage</p>}
        </div>
      </Section>
    </div>
  );
}

/* ── Appointments Config Tab ── */
function AppointmentsTab({ authHeaders }) {
  const [config, setConfig] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [newSlot, setNewSlot] = useState('');
  const [newDisabledDate, setNewDisabledDate] = useState('');

  const load = useCallback(async () => {
    const r = await fetch(`${API}/api/admin/appointment-config`, { headers: authHeaders });
    if (r.ok) setConfig(await r.json());
  }, [authHeaders]);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true); setMsg('');
    const r = await fetch(`${API}/api/admin/appointment-config`, { method: 'POST', headers: authHeaders, body: JSON.stringify(config) });
    setMsg(r.ok ? 'Sauvegarde' : 'Erreur');
    setSaving(false); setTimeout(() => setMsg(''), 3000);
  };

  if (!config) return <div className="text-gray-400">Chargement...</div>;

  const DAYS = [{ id: 1, name: 'Lun' }, { id: 2, name: 'Mar' }, { id: 3, name: 'Mer' }, { id: 4, name: 'Jeu' }, { id: 5, name: 'Ven' }, { id: 6, name: 'Sam' }, { id: 7, name: 'Dim' }];
  const toggleDay = (d) => setConfig(c => ({ ...c, active_days: c.active_days.includes(d) ? c.active_days.filter(x => x !== d) : [...c.active_days, d].sort() }));
  const addSlot = () => { if (newSlot && !config.slots.includes(newSlot)) { setConfig(c => ({ ...c, slots: [...c.slots, newSlot].sort() })); setNewSlot(''); } };
  const removeSlot = (s) => setConfig(c => ({ ...c, slots: c.slots.filter(x => x !== s) }));
  const addDisabled = () => { if (newDisabledDate && !config.disabled_dates.includes(newDisabledDate)) { setConfig(c => ({ ...c, disabled_dates: [...c.disabled_dates, newDisabledDate].sort() })); setNewDisabledDate(''); } };
  const removeDisabled = (d) => setConfig(c => ({ ...c, disabled_dates: c.disabled_dates.filter(x => x !== d) }));

  return (
    <div className="max-w-2xl space-y-6">
      <Section title="Jours ouvrables" desc="Jours ou les rendez-vous sont possibles">
        <div className="flex gap-2">
          {DAYS.map(d => (
            <button key={d.id} onClick={() => toggleDay(d.id)} data-testid={`day-${d.id}`}
              className={`px-3 py-2 rounded-lg text-xs font-bold border transition ${config.active_days.includes(d.id) ? 'bg-[#ff4605] border-[#ff4605] text-white' : 'border-white/10 text-gray-500'}`}>{d.name}</button>
          ))}
        </div>
      </Section>

      <Section title="Creneaux horaires" desc="Heures disponibles pour les RDV">
        <div className="flex flex-wrap gap-2 mb-3">
          {config.slots.map(s => (
            <span key={s} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0f1117] border border-white/5 text-sm text-gray-300">
              {s} <button onClick={() => removeSlot(s)} className="text-gray-500 hover:text-red-400 ml-1"><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <Input data-testid="new-slot" type="time" value={newSlot} onChange={e => setNewSlot(e.target.value)} className="h-9 bg-[#1a1d2e] border-white/10 text-white rounded-lg w-32" />
          <Button onClick={addSlot} data-testid="add-slot-btn" className="h-9 bg-[#ff4605] hover:bg-[#e63e00] text-white rounded-lg px-4"><Plus className="w-4 h-4" /></Button>
        </div>
      </Section>

      <Section title="Parametres" desc="Configuration des creneaux">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-xs text-gray-500 mb-1 block">Duree creneau (min)</label><Input type="number" value={config.slot_duration} onChange={e => setConfig(c => ({ ...c, slot_duration: parseInt(e.target.value) || 60 }))} className="h-9 bg-[#1a1d2e] border-white/10 text-white rounded-lg" /></div>
          <div><label className="text-xs text-gray-500 mb-1 block">Max RDV par creneau</label><Input data-testid="max-per-slot" type="number" value={config.max_per_slot} onChange={e => setConfig(c => ({ ...c, max_per_slot: parseInt(e.target.value) || 1 }))} className="h-9 bg-[#1a1d2e] border-white/10 text-white rounded-lg" /></div>
        </div>
      </Section>

      <Section title="Dates desactivees" desc="Jours feries, fermetures exceptionnelles">
        <div className="flex flex-wrap gap-2 mb-3">
          {(config.disabled_dates || []).map(d => (
            <span key={d} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
              {d} <button onClick={() => removeDisabled(d)} className="hover:text-red-300 ml-1"><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <Input data-testid="new-disabled-date" type="date" value={newDisabledDate} onChange={e => setNewDisabledDate(e.target.value)} className="h-9 bg-[#1a1d2e] border-white/10 text-white rounded-lg w-44" />
          <Button onClick={addDisabled} data-testid="add-disabled-btn" className="h-9 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg px-4"><Plus className="w-4 h-4" /></Button>
        </div>
      </Section>

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={saving} data-testid="save-appt-config-btn" className="bg-[#ff4605] hover:bg-[#e63e00] text-white font-bold rounded-lg px-6"><Save className="w-4 h-4 mr-2" /> {saving ? 'Sauvegarde...' : 'Sauvegarder'}</Button>
        {msg && <span className={`text-sm ${msg.includes('Erreur') ? 'text-red-400' : 'text-green-400'}`}>{msg}</span>}
      </div>
    </div>
  );
}

/* ── Leads Tab ── */
function LeadsTab({ authHeaders }) {
  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [expanded, setExpanded] = useState(null);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState('all');
  const [garages, setGarages] = useState([]);

  // ── Advanced search ──
  const [showSearch, setShowSearch] = useState(false);
  const [search, setSearch] = useState('');
  const [searchFields, setSearchFields] = useState({
    plate: '', email: '', phone: '', postal_code: '', make: '',
    garage_id: '', date_from: '', date_to: '', is_drivable: '',
  });
  const updateSearch = (k, v) => setSearchFields(p => ({ ...p, [k]: v }));

  const load = useCallback(async () => {
    const params = new URLSearchParams({ limit: '200' });
    if (filter === 'estimated') params.set('lead_status', 'estimated');
    if (filter === 'appointed') params.set('lead_status', 'appointment_scheduled');
    if (filter === 'no_rdv') params.set('has_appointment', 'false');
    if (search.trim()) params.set('search', search.trim());
    // Advanced filters
    Object.entries(searchFields).forEach(([k, v]) => {
      if (v && v !== '') {
        if (k === 'is_drivable') params.set(k, v === 'yes' ? 'true' : 'false');
        else params.set(k, v);
      }
    });
    const r = await fetch(`${API}/api/admin/leads?${params}`, { headers: authHeaders });
    if (r.ok) { const d = await r.json(); setLeads(d.leads); setTotal(d.total); }
    const sr = await fetch(`${API}/api/admin/stats`, { headers: authHeaders });
    if (sr.ok) setStats(await sr.json());
  }, [authHeaders, filter, search, searchFields]);

  useEffect(() => { load(); }, [load]);

  // Load garages for filter dropdown
  useEffect(() => {
    fetch(`${API}/api/admin/garages`, { headers: authHeaders })
      .then(r => r.ok ? r.json() : { garages: [] })
      .then(d => setGarages(d.garages || []))
      .catch(() => {});
  }, [authHeaders]);

  const clearSearch = () => {
    setSearch('');
    setSearchFields({ plate: '', email: '', phone: '', postal_code: '', make: '', garage_id: '', date_from: '', date_to: '', is_drivable: '' });
  };

  const hasActiveFilters = search.trim() || Object.values(searchFields).some(v => v !== '');

  const StatusBadge = ({ status }) => {
    const colors = {
      estimated: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      appointment_scheduled: 'bg-green-500/10 text-green-400 border-green-500/20',
    };
    const labels = { estimated: 'Estime', appointment_scheduled: 'RDV pris' };
    return status ? (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${colors[status] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
        {labels[status] || status}
      </span>
    ) : <span className="text-[10px] text-gray-600">legacy</span>;
  };

  return (
    <div className="max-w-5xl">
      {/* Stats bar */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6" data-testid="leads-stats">
          <div className="bg-[#1a1d2e] rounded-lg border border-white/5 p-4">
            <p className="text-xs text-gray-500">Total leads</p>
            <p className="text-2xl font-bold text-white">{stats.total_leads}</p>
          </div>
          <div className="bg-[#1a1d2e] rounded-lg border border-white/5 p-4">
            <p className="text-xs text-blue-400">Estimes (sans RDV)</p>
            <p className="text-2xl font-bold text-blue-400">{stats.estimated_leads}</p>
          </div>
          <div className="bg-[#1a1d2e] rounded-lg border border-white/5 p-4">
            <p className="text-xs text-green-400">RDV pris</p>
            <p className="text-2xl font-bold text-green-400">{stats.appointed_leads}</p>
          </div>
          <div className="bg-[#1a1d2e] rounded-lg border border-white/5 p-4">
            <p className="text-xs text-[#ff4605]">Taux conversion</p>
            <p className="text-2xl font-bold text-[#ff4605]">{stats.conversion_rate}%</p>
          </div>
        </div>
      )}

      {/* Search bar + Filters */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Input data-testid="search-leads" placeholder="Rechercher (nom, email, plaque, marque...)" value={search} onChange={e => setSearch(e.target.value)}
              className="h-9 bg-[#1a1d2e] border-white/10 text-white placeholder:text-gray-600 rounded-lg pl-3 pr-8 text-sm" />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button onClick={() => setShowSearch(!showSearch)} data-testid="toggle-advanced-search"
            className={`h-9 px-3 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition ${showSearch ? 'bg-[#ff4605]/10 border-[#ff4605]/30 text-[#ff4605]' : 'border-white/10 text-gray-400 hover:text-white'}`}>
            <SlidersHorizontal className="w-3.5 h-3.5" /> Filtres
            {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-[#ff4605]" />}
          </button>
          <Button onClick={load} variant="ghost" className="text-gray-400 hover:text-white h-9 px-3 text-xs" data-testid="refresh-leads">
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Advanced search panel */}
        {showSearch && (
          <div className="bg-[#1a1d2e] rounded-xl border border-white/5 p-4 animate-fade-in-up" data-testid="advanced-search-panel">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-gray-500 mb-1 block uppercase tracking-wide">Plaque</label>
                <Input data-testid="filter-plate" placeholder="AA123BB" value={searchFields.plate} onChange={e => updateSearch('plate', e.target.value)}
                  className="h-8 bg-[#0f1117] border-white/10 text-white rounded-lg text-xs" />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 mb-1 block uppercase tracking-wide">Email</label>
                <Input data-testid="filter-email" placeholder="jean@..." value={searchFields.email} onChange={e => updateSearch('email', e.target.value)}
                  className="h-8 bg-[#0f1117] border-white/10 text-white rounded-lg text-xs" />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 mb-1 block uppercase tracking-wide">Telephone</label>
                <Input data-testid="filter-phone" placeholder="06..." value={searchFields.phone} onChange={e => updateSearch('phone', e.target.value)}
                  className="h-8 bg-[#0f1117] border-white/10 text-white rounded-lg text-xs" />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 mb-1 block uppercase tracking-wide">Code postal</label>
                <Input data-testid="filter-postal" placeholder="75011" value={searchFields.postal_code} onChange={e => updateSearch('postal_code', e.target.value)}
                  className="h-8 bg-[#0f1117] border-white/10 text-white rounded-lg text-xs" maxLength={5} />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 mb-1 block uppercase tracking-wide">Marque</label>
                <Input data-testid="filter-make" placeholder="Renault" value={searchFields.make} onChange={e => updateSearch('make', e.target.value)}
                  className="h-8 bg-[#0f1117] border-white/10 text-white rounded-lg text-xs" />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 mb-1 block uppercase tracking-wide">Roulant</label>
                <select data-testid="filter-drivable" value={searchFields.is_drivable} onChange={e => updateSearch('is_drivable', e.target.value)}
                  className="w-full h-8 px-2 bg-[#0f1117] border border-white/10 text-white rounded-lg text-xs appearance-none">
                  <option value="">Tous</option>
                  <option value="yes">Oui</option>
                  <option value="no">Non</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 mb-1 block uppercase tracking-wide">Garage</label>
                <select data-testid="filter-garage" value={searchFields.garage_id} onChange={e => updateSearch('garage_id', e.target.value)}
                  className="w-full h-8 px-2 bg-[#0f1117] border border-white/10 text-white rounded-lg text-xs appearance-none">
                  <option value="">Tous</option>
                  {garages.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 mb-1 block uppercase tracking-wide">Date du</label>
                <Input data-testid="filter-date-from" type="date" value={searchFields.date_from} onChange={e => updateSearch('date_from', e.target.value)}
                  className="h-8 bg-[#0f1117] border-white/10 text-white rounded-lg text-xs" />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 mb-1 block uppercase tracking-wide">Date au</label>
                <Input data-testid="filter-date-to" type="date" value={searchFields.date_to} onChange={e => updateSearch('date_to', e.target.value)}
                  className="h-8 bg-[#0f1117] border-white/10 text-white rounded-lg text-xs" />
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
              <span className="text-[10px] text-gray-600">{total} resultat{total > 1 ? 's' : ''}</span>
              {hasActiveFilters && (
                <button onClick={clearSearch} data-testid="clear-filters" className="text-xs text-gray-400 hover:text-[#ff4605] flex items-center gap-1 transition">
                  <X className="w-3 h-3" /> Effacer les filtres
                </button>
              )}
            </div>
          </div>
        )}

        {/* Status tabs */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1 bg-[#1a1d2e] rounded-lg p-1">
            {[
              { id: 'all', label: 'Tous' },
              { id: 'estimated', label: 'Estimes' },
              { id: 'appointed', label: 'RDV pris' },
              { id: 'no_rdv', label: 'Sans RDV' },
            ].map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)} data-testid={`filter-${f.id}`}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${filter === f.id ? 'bg-[#ff4605] text-white' : 'text-gray-400 hover:text-white'}`}>
                {f.label}
              </button>
            ))}
          </div>
          <span className="text-gray-500 text-xs">{total} resultat{total > 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className="space-y-2">
        {leads.map(lead => {
          const isOpen = expanded === lead.id;
          const c = lead.client || {};
          const v = lead.vehicle || {};
          const p = lead.pricing || {};
          return (
            <div key={lead.id} className="bg-[#1a1d2e] rounded-lg border border-white/5 overflow-hidden" data-testid={`lead-${lead.id}`}>
              <button onClick={() => setExpanded(isOpen ? null : lead.id)} className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-white/[0.02] transition">
                <div className={`w-2 h-2 rounded-full shrink-0 ${lead.is_drivable ? 'bg-green-400' : 'bg-orange-400'}`} />
                <div className="flex-1 min-w-0">
                  <span className="text-white text-sm font-medium">{c.firstname} {c.lastname}</span>
                  <span className="text-gray-500 text-xs ml-3">{c.email}</span>
                </div>
                <StatusBadge status={lead.lead_status} />
                <div className="text-sm text-gray-300 shrink-0 hidden md:block">{v.make} {v.model}</div>
                <div className="text-sm font-bold text-[#ff4605] shrink-0 w-24 text-right">{p.final_price ? `${Number(p.final_price).toLocaleString('fr-FR')} EUR` : '—'}</div>
                <div className="text-xs text-gray-500 shrink-0 w-28 text-right hidden sm:block">{lead.created_at?.slice(0, 16).replace('T', ' ')}</div>
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
                  <Detail label="Statut" value={lead.lead_status || 'legacy'} />
                  <Detail label="Telephone" value={c.phone} />
                  <Detail label="Code postal" value={c.postal_code} />
                  <Detail label="Source" value={lead.source} />
                  <Detail label="Base prix" value={p.base_price ? `${Number(p.base_price).toLocaleString('fr-FR')} EUR` : '—'} />
                  <Detail label="Range prix" value={p.range_price ? `${Number(p.range_price).toLocaleString('fr-FR')} EUR` : '—'} />
                  <Detail label="Remise %" value={p.discount_percent != null ? `${p.discount_percent}%` : '—'} />
                  {lead.garage_name && <Detail label="Garage" value={lead.garage_name} />}
                  {lead.appointment_date && <Detail label="RDV" value={`${lead.appointment_date} ${lead.appointment_time || ''}`} />}
                  {lead.webhook_estimation && <Detail label="Webhook estimation" value={lead.webhook_estimation.sent ? 'Envoye' : `Echec: ${lead.webhook_estimation.error || lead.webhook_estimation.reason || '?'}`} />}
                  {lead.webhook_appointment && <Detail label="Webhook RDV" value={lead.webhook_appointment.sent ? 'Envoye' : `Echec: ${lead.webhook_appointment.error || lead.webhook_appointment.reason || '?'}`} />}
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

/* ── SEO Pages Tab ── */
function SeoTab({ authHeaders }) {
  const [pages, setPages] = useState([]);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch(`${API}/api/admin/seo-pages`, { headers: authHeaders });
    if (r.ok) { const d = await r.json(); setPages(d.pages || []); }
  }, [authHeaders]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    setSaving(true);
    const isNew = !editing.id;
    const url = isNew ? `${API}/api/admin/seo-pages` : `${API}/api/admin/seo-pages/${editing.id}`;
    const method = isNew ? 'POST' : 'PUT';
    const r = await fetch(url, { method, headers: { ...authHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify(editing) });
    setSaving(false);
    if (r.ok) { setEditing(null); load(); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette page SEO ?')) return;
    await fetch(`${API}/api/admin/seo-pages/${id}`, { method: 'DELETE', headers: authHeaders });
    load();
  };

  const TYPE_LABELS = { national: 'National', department: 'Departement', city: 'Ville' };
  const TYPE_COLORS = { national: 'text-purple-400 bg-purple-500/10 border-purple-500/20', department: 'text-blue-400 bg-blue-500/10 border-blue-500/20', city: 'text-green-400 bg-green-500/10 border-green-500/20' };

  // ── City page generator ──
  const [showGenerator, setShowGenerator] = useState(false);
  const [gen, setGen] = useState({ city: '', deptSlug: 'essonne', deptName: 'Essonne', deptCode: '91', nearby: '' });

  const generateCityPage = () => {
    const city = gen.city.trim();
    if (!city) return;
    const slug = city.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const nearbyList = gen.nearby.split(',').map(n => n.trim()).filter(Boolean).map(n => ({
      slug: n.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      name: n,
    }));

    // Varied sentence patterns
    const intros = [
      `Vous souhaitez vendre votre voiture a ${city} ? Vente Flash Auto vous propose un service de rachat rapide et transparent. Situee dans le departement de ${gen.deptName}, ${city} beneficie de notre reseau de garages partenaires pour une reprise sans tracas. Obtenez une estimation gratuite en quelques clics et finalisez la vente en toute simplicite.`,
      `Habitants de ${city}, vendez votre vehicule simplement grace a Vente Flash Auto. Notre plateforme de rachat automobile est disponible dans ${gen.deptName} et vous permet d'obtenir un prix juste en moins de 2 minutes. Fini les petites annonces, fini les negociations : nous nous occupons de tout.`,
      `${city}, dans le ${gen.deptCode}, est desormais couverte par le service Vente Flash Auto. Que vous ayez une citadine, un SUV ou un utilitaire, notre service de rachat vous garantit une estimation gratuite et une reprise rapide dans un centre partenaire proche de chez vous.`,
    ];
    const s1Contents = [
      `La vente de votre vehicule a ${city} se fait en 3 etapes simples. Commencez par entrer votre plaque d'immatriculation pour obtenir une estimation instantanee. Ensuite, choisissez un creneau dans notre garage partenaire le plus proche. Enfin, presentez votre vehicule, validez le prix et recevez votre paiement sous 48 heures.`,
      `Vendre votre voiture depuis ${city} n'a jamais ete aussi simple. Saisissez votre immatriculation, recevez une offre basee sur le marche, puis rendez-vous dans un centre proche pour finaliser la transaction. Le processus complet peut etre fait en moins de 48h.`,
      `Depuis ${city}, vendez votre auto en 3 etapes claires. Estimez gratuitement en ligne, prenez rendez-vous dans un centre du ${gen.deptCode}, et finalisez la vente avec paiement rapide par virement securise.`,
    ];
    const s2Contents = [
      `Le prix de rachat de votre vehicule depend de sa marque, son modele, son annee, son kilometrage et son etat. A ${city}, nous evaluons tous les types de vehicules. Notre estimation en ligne est gratuite, sans engagement, et basee sur les prix reels du marche automobile.`,
      `Chaque vehicule est unique. A ${city}, les proprietaires nous confient aussi bien des citadines que des vehicules familiaux ou des utilitaires. Notre algorithme calcule un prix competitif base sur les tendances actuelles du marche et la cote Autobiz.`,
      `La valeur de votre voiture a ${city} est calculee selon plusieurs criteres : marque, modele, annee, kilometrage et etat general. Notre estimation gratuite vous donne un prix fiable en moins de 2 minutes, base sur les donnees du marche en temps reel.`,
    ];
    const s3Contents = [
      `Voiture d'occasion, vehicule avec fort kilometrage, voiture en panne, vehicule accidente ou sans controle technique... A ${city}, nous etudions chaque demande. Meme si votre voiture ne roule plus, demandez une estimation adaptee a votre situation.`,
      `Reprise de voiture d'occasion recente ou ancienne, vehicule diesel ou essence, voiture electrique, auto avec plus de 200 000 km, vehicule en panne... A ${city}, aucun cas n'est exclu. Tentez l'estimation, vous pourriez etre surpris par notre offre.`,
      `Vehicule d'occasion classique, auto immobilisee depuis longtemps, voiture accidentee non reparee, vehicule sans CT a jour... A ${city} comme dans tout le ${gen.deptCode}, nous trouvons une solution pour chaque situation de reprise automobile.`,
    ];
    const s4Contents = [
      `Estimation rapide en 2 minutes depuis chez vous. Service 100% gratuit et sans engagement. Paiement securise sous 24 a 48h. Accompagnement personnalise. Garages partenaires accessibles depuis ${city}. Expertise locale et connaissance du marche de ${gen.deptName}.`,
      `Un service de proximite accessible depuis ${city}. Une estimation fiable en 2 minutes. Aucune obligation d'accepter notre offre. Un processus transparent du debut a la fin. Paiement par virement sous 48h. Des conseillers disponibles pour vous guider.`,
      `Proximite : des centres proches de ${city}. Rapidite : estimation en 2 minutes, vente en 48h. Transparence : pas de frais caches. Liberte : acceptez ou refusez sans consequence. Expertise : des centaines de vehicules deja rachetes dans le ${gen.deptCode}.`,
    ];
    const nearbyNames = nearbyList.map(n => n.name).join(', ');
    const s5Content = nearbyNames
      ? `${city} est situee dans le departement de ${gen.deptName}, a proximite de ${nearbyNames}. Notre reseau de garages partenaires couvre l'ensemble du departement. Decouvrez nos pages dediees aux villes voisines pour trouver le centre le plus proche de chez vous.`
      : `${city} est situee dans le departement de ${gen.deptName}. Notre couverture locale vous offre plusieurs options de centres partenaires. Retrouvez nos services dans les villes proches et choisissez le lieu le plus pratique.`;

    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

    const faqVariants = [
      [
        { question: `Est-ce que je peux vendre ma voiture sans controle technique a ${city} ?`, answer: `Oui, nous rachetons les vehicules sans CT valide a ${city}. L'estimation sera adaptee en fonction de l'etat reel du vehicule.` },
        { question: `Combien de temps pour vendre sa voiture a ${city} ?`, answer: `L'estimation en ligne prend 2 minutes. Le rendez-vous peut etre pris sous 24h et le paiement est effectue sous 48h apres accord.` },
        { question: `L'estimation est-elle gratuite a ${city} ?`, answer: `Oui, 100% gratuite et sans engagement. Vous n'avez rien a payer, que vous acceptiez ou non l'offre proposee.` },
        { question: `Rachetez-vous les vehicules en panne a ${city} ?`, answer: `Oui, nous evaluons et rachetons les vehicules en panne mecanique ou electrique a ${city}. Un expert peut se deplacer si necessaire.` },
        { question: `Comment se passe le paiement a ${city} ?`, answer: `Apres validation de l'offre en centre, le paiement est effectue par virement bancaire securise sous 24 a 48h. Pas de cheque, pas d'especes.` },
      ],
      [
        { question: `Peut-on vendre une voiture sans CT a ${city} ?`, answer: `Oui, le controle technique n'est pas requis pour nous vendre votre vehicule. Nous ajustons notre proposition selon l'etat du vehicule.` },
        { question: `En combien de temps puis-je vendre ma voiture a ${city} ?`, answer: `Comptez 2 minutes pour l'estimation en ligne, puis 24 a 48h pour finaliser la vente en centre et recevoir le paiement.` },
        { question: `L'estimation est-elle vraiment gratuite et sans engagement ?`, answer: `Absolument. Aucun frais de dossier, aucune commission. Vous restez libre a chaque etape du processus.` },
        { question: `Achetez-vous les vieilles voitures a ${city} ?`, answer: `Oui, l'age du vehicule n'est pas un critere d'exclusion. Nous evaluons tous les modeles, y compris les plus anciens.` },
        { question: `Quel est le mode de paiement utilise ?`, answer: `Nous procedons exclusivement par virement bancaire securise sous 24 a 48h. C'est simple, rapide et sans risque.` },
      ],
    ];

    const generated = {
      slug, type: 'city', city_name: city,
      department_slug: gen.deptSlug, department_name: gen.deptName, department_code: gen.deptCode,
      seo_title: `Rachat voiture a ${city} - Estimation gratuite | Vente Flash Auto`,
      meta_description: `Vente Flash Auto rachete votre voiture a ${city} rapidement. Estimation gratuite en ligne, reprise sans engagement et paiement sous 48h.`,
      h1: `Rachat voiture a ${city} - Estimation gratuite et reprise rapide`,
      intro: pick(intros),
      hero_image: '', city_image: '', section_images: [], gallery_vehicles: [],
      sections: [
        { title: `Comment vendre sa voiture rapidement a ${city} ?`, content: pick(s1Contents) },
        { title: `Combien vaut votre voiture a ${city} ?`, content: pick(s2Contents) },
        { title: `Nous rachetons aussi les vehicules particuliers a ${city}`, content: pick(s3Contents) },
        { title: `Pourquoi choisir Vente Flash Auto a ${city} ?`, content: pick(s4Contents) },
        { title: `Nos solutions de reprise auto a ${city} et en ${gen.deptName}`, content: s5Content },
      ],
      faq: pick(faqVariants),
      nearby_cities: nearbyList,
      cta_text: `Estimez votre voiture a ${city}`,
      trust_block: true, vehicles_block: true, active: true, noindex: false, canonical_override: '',
    };

    setEditing(generated);
    setShowGenerator(false);
    setGen({ city: '', deptSlug: gen.deptSlug, deptName: gen.deptName, deptCode: gen.deptCode, nearby: '' });
  };

  // Image upload helper
  const [uploading, setUploading] = useState(false);
  const uploadImage = async (file, purpose) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const slugParam = editing?.slug || editing?.city_name || 'page';
      const r = await fetch(`${API}/api/admin/seo-upload?slug=${encodeURIComponent(slugParam)}&purpose=${encodeURIComponent(purpose)}`, {
        method: 'POST',
        headers: { Authorization: authHeaders.Authorization },
        body: fd,
      });
      if (!r.ok) { const err = await r.json().catch(() => ({})); alert(err.detail || 'Erreur upload'); setUploading(false); return null; }
      const data = await r.json();
      setUploading(false);
      return data.url;
    } catch { setUploading(false); alert('Erreur upload'); return null; }
  };

  // Editing form
  if (editing) {
    return (
      <div className="max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-bold text-lg">{editing.id ? 'Modifier la page' : 'Nouvelle page SEO'}</h2>
          <div className="flex gap-2">
            <Button onClick={() => setEditing(null)} variant="ghost" className="text-gray-400 h-8 text-xs">Annuler</Button>
            <Button onClick={handleSave} disabled={saving || uploading} className="bg-[#ff4605] text-white h-8 text-xs px-4" data-testid="seo-save">
              {saving ? <RefreshCw className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />} Sauvegarder
            </Button>
          </div>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <SeoField label="Slug" value={editing.slug} onChange={v => setEditing({ ...editing, slug: v })} />
            <div>
              <label className="text-[10px] text-gray-500 mb-1 block uppercase">Type</label>
              <select value={editing.type || 'city'} onChange={e => setEditing({ ...editing, type: e.target.value })}
                className="w-full h-8 px-2 bg-[#0f1117] border border-white/10 text-white rounded-lg text-xs appearance-none">
                <option value="national">National</option>
                <option value="department">Departement</option>
                <option value="city">Ville</option>
              </select>
            </div>
            <SeoField label="Nom ville" value={editing.city_name} onChange={v => setEditing({ ...editing, city_name: v })} />
            <SeoField label="Dept slug" value={editing.department_slug} onChange={v => setEditing({ ...editing, department_slug: v })} />
            <SeoField label="Dept nom" value={editing.department_name} onChange={v => setEditing({ ...editing, department_name: v })} />
            <SeoField label="Dept code" value={editing.department_code} onChange={v => setEditing({ ...editing, department_code: v })} />
          </div>
          <SeoField label="SEO Title" value={editing.seo_title} onChange={v => setEditing({ ...editing, seo_title: v })} full />
          <SeoField label="Meta Description" value={editing.meta_description} onChange={v => setEditing({ ...editing, meta_description: v })} full />
          <SeoField label="H1" value={editing.h1} onChange={v => setEditing({ ...editing, h1: v })} full />
          <SeoArea label="Introduction" value={editing.intro} onChange={v => setEditing({ ...editing, intro: v })} />
          <SeoField label="CTA Text" value={editing.cta_text} onChange={v => setEditing({ ...editing, cta_text: v })} full />
          <SeoField label="Canonical Override (optionnel)" value={editing.canonical_override} onChange={v => setEditing({ ...editing, canonical_override: v })} full />

          {/* ── Images ── */}
          <div className="border-t border-white/5 pt-4">
            <label className="text-xs text-gray-400 font-bold uppercase mb-3 block">Images</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SeoImageUpload
                label="Image Hero"
                value={editing.hero_image}
                onChange={url => setEditing({ ...editing, hero_image: url })}
                onUpload={f => uploadImage(f, 'hero')}
                uploading={uploading}
              />
              <SeoImageUpload
                label="Image Ville"
                value={editing.city_image}
                onChange={url => setEditing({ ...editing, city_image: url })}
                onUpload={f => uploadImage(f, 'city')}
                uploading={uploading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <ToggleSmall label="Actif" checked={editing.active !== false} onChange={v => setEditing({ ...editing, active: v })} />
            <ToggleSmall label="Noindex" checked={!!editing.noindex} onChange={v => setEditing({ ...editing, noindex: v })} />
            <ToggleSmall label="Bloc confiance" checked={editing.trust_block !== false} onChange={v => setEditing({ ...editing, trust_block: v })} />
            <ToggleSmall label="Bloc vehicules" checked={editing.vehicles_block !== false} onChange={v => setEditing({ ...editing, vehicles_block: v })} />
          </div>

          {/* Sections with image upload */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-gray-400 font-bold uppercase">Sections</label>
              <button onClick={() => setEditing({ ...editing, sections: [...(editing.sections || []), { title: '', content: '' }] })} className="text-[#ff4605] text-xs">+ Ajouter</button>
            </div>
            {(editing.sections || []).map((s, i) => {
              const sectionImg = (editing.section_images || []).find(si => si.section_index === i);
              return (
                <div key={i} className="bg-[#0f1117] rounded-lg p-3 mb-2 border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">Section {i + 1}</span>
                    <button onClick={() => {
                      const newSections = editing.sections.filter((_, j) => j !== i);
                      const newImgs = (editing.section_images || []).filter(si => si.section_index !== i).map(si => si.section_index > i ? { ...si, section_index: si.section_index - 1 } : si);
                      setEditing({ ...editing, sections: newSections, section_images: newImgs });
                    }} className="text-red-400 text-xs">Supprimer</button>
                  </div>
                  <Input placeholder="Titre" value={s.title} onChange={e => { const ns = [...editing.sections]; ns[i] = { ...ns[i], title: e.target.value }; setEditing({ ...editing, sections: ns }); }}
                    className="h-7 bg-transparent border-white/10 text-white rounded text-xs mb-2" />
                  <textarea placeholder="Contenu" value={s.content} onChange={e => { const ns = [...editing.sections]; ns[i] = { ...ns[i], content: e.target.value }; setEditing({ ...editing, sections: ns }); }}
                    className="w-full min-h-[60px] bg-transparent border border-white/10 text-white rounded text-xs p-2 resize-y mb-2" />
                  <SeoImageUpload
                    label={`Image section ${i + 1}`}
                    value={sectionImg?.url}
                    onChange={url => {
                      const imgs = (editing.section_images || []).filter(si => si.section_index !== i);
                      if (url) imgs.push({ section_index: i, url });
                      setEditing({ ...editing, section_images: imgs });
                    }}
                    onUpload={f => uploadImage(f, `section-${i}`)}
                    uploading={uploading}
                    compact
                  />
                </div>
              );
            })}
          </div>

          {/* Gallery Vehicles */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-gray-400 font-bold uppercase">Vehicules galerie</label>
              <button onClick={() => setEditing({ ...editing, gallery_vehicles: [...(editing.gallery_vehicles || []), { image: '', model: '', city: '', delay: 'Rachete en 24h' }] })} className="text-[#ff4605] text-xs">+ Ajouter</button>
            </div>
            {(editing.gallery_vehicles || []).map((v, i) => (
              <div key={i} className="bg-[#0f1117] rounded-lg p-3 mb-2 border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">Vehicule {i + 1}</span>
                  <div className="flex gap-2">
                    {i > 0 && <button onClick={() => { const nv = [...editing.gallery_vehicles]; [nv[i-1], nv[i]] = [nv[i], nv[i-1]]; setEditing({ ...editing, gallery_vehicles: nv }); }} className="text-gray-500 text-xs hover:text-white">&#8593;</button>}
                    {i < (editing.gallery_vehicles || []).length - 1 && <button onClick={() => { const nv = [...editing.gallery_vehicles]; [nv[i], nv[i+1]] = [nv[i+1], nv[i]]; setEditing({ ...editing, gallery_vehicles: nv }); }} className="text-gray-500 text-xs hover:text-white">&#8595;</button>}
                    <button onClick={() => setEditing({ ...editing, gallery_vehicles: editing.gallery_vehicles.filter((_, j) => j !== i) })} className="text-red-400 text-xs">X</button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <Input placeholder="Modele (ex: Peugeot 3008)" value={v.model} onChange={e => { const nv = [...editing.gallery_vehicles]; nv[i] = { ...nv[i], model: e.target.value }; setEditing({ ...editing, gallery_vehicles: nv }); }}
                    className="h-7 bg-transparent border-white/10 text-white rounded text-xs" />
                  <Input placeholder="Ville" value={v.city} onChange={e => { const nv = [...editing.gallery_vehicles]; nv[i] = { ...nv[i], city: e.target.value }; setEditing({ ...editing, gallery_vehicles: nv }); }}
                    className="h-7 bg-transparent border-white/10 text-white rounded text-xs" />
                  <Input placeholder="Delai" value={v.delay} onChange={e => { const nv = [...editing.gallery_vehicles]; nv[i] = { ...nv[i], delay: e.target.value }; setEditing({ ...editing, gallery_vehicles: nv }); }}
                    className="h-7 bg-transparent border-white/10 text-white rounded text-xs" />
                </div>
                <SeoImageUpload
                  label="Photo vehicule"
                  value={v.image}
                  onChange={url => { const nv = [...editing.gallery_vehicles]; nv[i] = { ...nv[i], image: url }; setEditing({ ...editing, gallery_vehicles: nv }); }}
                  onUpload={f => uploadImage(f, `vehicle-${i}`)}
                  uploading={uploading}
                  compact
                />
              </div>
            ))}
          </div>

          {/* FAQ */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-gray-400 font-bold uppercase">FAQ</label>
              <button onClick={() => setEditing({ ...editing, faq: [...(editing.faq || []), { question: '', answer: '' }] })} className="text-[#ff4605] text-xs">+ Ajouter</button>
            </div>
            {(editing.faq || []).map((f, i) => (
              <div key={i} className="bg-[#0f1117] rounded-lg p-3 mb-2 border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">FAQ {i + 1}</span>
                  <button onClick={() => setEditing({ ...editing, faq: editing.faq.filter((_, j) => j !== i) })} className="text-red-400 text-xs">Supprimer</button>
                </div>
                <Input placeholder="Question" value={f.question} onChange={e => { const nf = [...editing.faq]; nf[i] = { ...nf[i], question: e.target.value }; setEditing({ ...editing, faq: nf }); }}
                  className="h-7 bg-transparent border-white/10 text-white rounded text-xs mb-2" />
                <textarea placeholder="Reponse" value={f.answer} onChange={e => { const nf = [...editing.faq]; nf[i] = { ...nf[i], answer: e.target.value }; setEditing({ ...editing, faq: nf }); }}
                  className="w-full min-h-[50px] bg-transparent border border-white/10 text-white rounded text-xs p-2 resize-y" />
              </div>
            ))}
          </div>
          {/* Nearby cities / cities_list */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-gray-400 font-bold uppercase">Villes proches / liees</label>
              <button onClick={() => {
                const key = editing.type === 'department' ? 'cities_list' : 'nearby_cities';
                setEditing({ ...editing, [key]: [...(editing[key] || []), { slug: '', name: '' }] });
              }} className="text-[#ff4605] text-xs">+ Ajouter</button>
            </div>
            {(editing.type === 'department' ? editing.cities_list : editing.nearby_cities || [])?.map((c, i) => {
              const key = editing.type === 'department' ? 'cities_list' : 'nearby_cities';
              return (
                <div key={i} className="flex gap-2 mb-2">
                  <Input placeholder="Slug" value={c.slug} onChange={e => { const nc = [...editing[key]]; nc[i] = { ...nc[i], slug: e.target.value }; setEditing({ ...editing, [key]: nc }); }}
                    className="h-7 bg-[#0f1117] border-white/10 text-white rounded text-xs flex-1" />
                  <Input placeholder="Nom affiche" value={c.name} onChange={e => { const nc = [...editing[key]]; nc[i] = { ...nc[i], name: e.target.value }; setEditing({ ...editing, [key]: nc }); }}
                    className="h-7 bg-[#0f1117] border-white/10 text-white rounded text-xs flex-1" />
                  <button onClick={() => { const nc = editing[key].filter((_, j) => j !== i); setEditing({ ...editing, [key]: nc }); }} className="text-red-400 text-xs px-2">X</button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-white font-bold text-lg">{pages.length} page{pages.length > 1 ? 's' : ''} SEO</h2>
        <div className="flex gap-2">
          <Button onClick={load} variant="ghost" className="text-gray-400 h-8 text-xs"><RefreshCw className="w-3.5 h-3.5" /></Button>
          <Button onClick={() => setShowGenerator(!showGenerator)}
            className={`h-8 text-xs px-3 ${showGenerator ? 'bg-green-600 text-white' : 'bg-[#1a1d2e] text-gray-300 border border-white/10'}`} data-testid="seo-generator-toggle">
            <Zap className="w-3.5 h-3.5 mr-1" /> Generer une ville
          </Button>
          <Button onClick={() => setEditing({ slug: '', type: 'city', city_name: '', department_slug: 'essonne', department_name: 'Essonne', department_code: '91', seo_title: '', meta_description: '', h1: '', intro: '', sections: [{ title: '', content: '' }], faq: [{ question: '', answer: '' }], nearby_cities: [], cta_text: '', trust_block: true, vehicles_block: true, active: true, noindex: false, canonical_override: '' })}
            className="bg-[#ff4605] text-white h-8 text-xs px-3" data-testid="seo-new-page">
            <Plus className="w-3.5 h-3.5 mr-1" /> Page vide
          </Button>
        </div>
      </div>

      {/* City generator panel */}
      {showGenerator && (
        <div className="bg-gradient-to-r from-green-900/20 to-[#1a1d2e] rounded-xl border border-green-500/20 p-5 mb-6 animate-fade-in-up" data-testid="seo-generator-panel">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-green-400" />
            <h3 className="text-white font-bold text-sm">Generateur rapide de page ville</h3>
            <span className="text-[10px] text-green-400/60 ml-2">Remplit automatiquement le template avec contenu unique</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div>
              <label className="text-[10px] text-gray-400 mb-1 block uppercase">Nom de la ville *</label>
              <Input data-testid="gen-city-name" placeholder="Ex: Massy" value={gen.city} onChange={e => setGen({ ...gen, city: e.target.value })}
                className="h-8 bg-[#0f1117] border-white/10 text-white rounded-lg text-xs" />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 mb-1 block uppercase">Departement slug</label>
              <Input data-testid="gen-dept-slug" placeholder="essonne" value={gen.deptSlug} onChange={e => setGen({ ...gen, deptSlug: e.target.value })}
                className="h-8 bg-[#0f1117] border-white/10 text-white rounded-lg text-xs" />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 mb-1 block uppercase">Departement nom</label>
              <Input data-testid="gen-dept-name" placeholder="Essonne" value={gen.deptName} onChange={e => setGen({ ...gen, deptName: e.target.value })}
                className="h-8 bg-[#0f1117] border-white/10 text-white rounded-lg text-xs" />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 mb-1 block uppercase">Code dept</label>
              <Input data-testid="gen-dept-code" placeholder="91" value={gen.deptCode} onChange={e => setGen({ ...gen, deptCode: e.target.value })}
                className="h-8 bg-[#0f1117] border-white/10 text-white rounded-lg text-xs" />
            </div>
          </div>
          <div className="mb-4">
            <label className="text-[10px] text-gray-400 mb-1 block uppercase">Villes proches (separees par virgule)</label>
            <Input data-testid="gen-nearby" placeholder="Ex: Palaiseau, Orsay, Longjumeau" value={gen.nearby} onChange={e => setGen({ ...gen, nearby: e.target.value })}
              className="h-8 bg-[#0f1117] border-white/10 text-white rounded-lg text-xs" />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-gray-600">Le generateur cree le slug, le H1, le title SEO, la meta description, 5 sections, 5 FAQ et les liens internes automatiquement.</p>
            <Button onClick={generateCityPage} disabled={!gen.city.trim()} className="bg-green-600 hover:bg-green-700 text-white h-9 px-5 text-sm font-bold rounded-lg disabled:opacity-40" data-testid="gen-submit">
              <Zap className="w-4 h-4 mr-1.5" /> Generer
            </Button>
          </div>
        </div>
      )}
      <div className="space-y-2">
        {pages.map(p => (
          <div key={p.id} className="bg-[#1a1d2e] rounded-lg border border-white/5 px-4 py-3 flex items-center gap-3" data-testid={`seo-page-${p.slug}`}>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${TYPE_COLORS[p.type] || ''}`}>{TYPE_LABELS[p.type] || p.type}</span>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{p.h1 || p.seo_title || p.slug}</p>
              <p className="text-gray-500 text-xs truncate">/rachat-voiture{p.slug !== 'rachat-voiture' ? '/' + p.slug : ''}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {!p.active && <span className="text-[10px] text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded">Inactif</span>}
              {p.noindex && <span className="text-[10px] text-yellow-400 border border-yellow-500/20 px-1.5 py-0.5 rounded">Noindex</span>}
            </div>
            <div className="flex gap-1 shrink-0">
              <Button onClick={() => setEditing({ ...p })} variant="ghost" className="text-gray-400 hover:text-white h-7 w-7 p-0" data-testid={`seo-edit-${p.slug}`}><Edit2 className="w-3.5 h-3.5" /></Button>
              <Button onClick={() => handleDelete(p.id)} variant="ghost" className="text-gray-400 hover:text-red-400 h-7 w-7 p-0"><Trash2 className="w-3.5 h-3.5" /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SeoField({ label, value, onChange, full }) {
  return (
    <div className={full ? 'col-span-full' : ''}>
      <label className="text-[10px] text-gray-500 mb-1 block uppercase tracking-wide">{label}</label>
      <Input value={value || ''} onChange={e => onChange(e.target.value)} className="h-8 bg-[#0f1117] border-white/10 text-white rounded-lg text-xs" />
    </div>
  );
}
function SeoArea({ label, value, onChange }) {
  return (
    <div>
      <label className="text-[10px] text-gray-500 mb-1 block uppercase tracking-wide">{label}</label>
      <textarea value={value || ''} onChange={e => onChange(e.target.value)} className="w-full min-h-[80px] bg-[#0f1117] border border-white/10 text-white rounded-lg text-xs p-2 resize-y" />
    </div>
  );
}
function ToggleSmall({ label, checked, onChange }) {
  return (
    <div className="flex items-center justify-between bg-[#0f1117] rounded-lg border border-white/5 px-3 py-2">
      <span className="text-xs text-gray-400">{label}</span>
      <button onClick={() => onChange(!checked)} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? 'bg-green-500' : 'bg-gray-700'}`}>
        <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-4.5' : 'translate-x-0.5'}`}
          style={{ transform: checked ? 'translateX(18px)' : 'translateX(2px)' }} />
      </button>
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

function SeoImageUpload({ label, value, onChange, onUpload, uploading, compact }) {
  const inputRef = useRef(null);
  const resolved = value ? (value.startsWith('http') ? value : `${API}${value}`) : '';

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await onUpload(file);
    if (url) onChange(url);
    if (inputRef.current) inputRef.current.value = '';
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {resolved ? (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <img src={resolved} alt={label} className="w-8 h-8 rounded object-cover shrink-0 border border-white/10" />
            <span className="text-[10px] text-gray-500 truncate flex-1">{value}</span>
            <button onClick={() => onChange('')} className="text-red-400 text-xs shrink-0">X</button>
          </div>
        ) : (
          <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer hover:text-[#ff4605] transition">
            <Upload className="w-3 h-3" /> {uploading ? 'Upload...' : label}
            <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp" onChange={handleFile} className="hidden" disabled={uploading} />
          </label>
        )}
      </div>
    );
  }

  return (
    <div className="bg-[#0f1117] rounded-lg border border-white/5 p-3">
      <label className="text-[10px] text-gray-500 mb-2 block uppercase tracking-wide">{label}</label>
      {resolved ? (
        <div className="flex items-start gap-3">
          <img src={resolved} alt={label} className="w-24 h-16 rounded-lg object-cover border border-white/10" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-gray-600 truncate mb-2">{value}</p>
            <div className="flex gap-2">
              <label className="text-xs text-[#ff4605] cursor-pointer hover:underline flex items-center gap-1">
                <Upload className="w-3 h-3" /> Remplacer
                <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp" onChange={handleFile} className="hidden" disabled={uploading} />
              </label>
              <button onClick={() => onChange('')} className="text-xs text-red-400 hover:underline flex items-center gap-1">
                <Trash2 className="w-3 h-3" /> Supprimer
              </button>
            </div>
          </div>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-lg p-4 cursor-pointer hover:border-[#ff4605]/30 transition group">
          <ImageIcon className="w-6 h-6 text-gray-600 group-hover:text-[#ff4605] transition mb-1" />
          <span className="text-xs text-gray-500 group-hover:text-gray-400">{uploading ? 'Upload en cours...' : 'Cliquer pour uploader'}</span>
          <span className="text-[10px] text-gray-700 mt-1">JPG, PNG, WebP · Max 5 Mo</span>
          <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp" onChange={handleFile} className="hidden" disabled={uploading} />
        </label>
      )}
    </div>
  );
}

export default AdminPage;
