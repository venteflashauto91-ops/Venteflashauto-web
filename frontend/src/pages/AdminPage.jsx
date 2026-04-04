import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, BarChart3, Users, Lock, LogOut, Plus, Trash2, Eye, EyeOff, Save, RefreshCw, ChevronDown, ChevronUp, MapPin, Calendar, Edit2, X, SlidersHorizontal } from 'lucide-react';
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

function Detail({ label, value }) {
  return (
    <div>
      <span className="text-gray-500">{label}</span>
      <p className="text-gray-300 font-medium truncate">{value || '—'}</p>
    </div>
  );
}

export default AdminPage;
