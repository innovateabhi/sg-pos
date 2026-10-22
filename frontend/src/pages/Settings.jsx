import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Store, 
  Receipt, 
  Percent, 
  CheckCircle, 
  Save, 
  RefreshCw 
} from 'lucide-react';
import api from '../services/api';

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Form State
  const [restaurantName, setRestaurantName] = useState('Saffron Grill');
  const [tagline, setTagline] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gstin, setGstin] = useState('');
  const [taxRate, setTaxRate] = useState(5.0);
  const [taxEnabled, setTaxEnabled] = useState(1);
  const [defaultOrderType, setDefaultOrderType] = useState('dine_in');
  const [receiptFooter, setReceiptFooter] = useState('');

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/settings.php');
      if (res?.success && res.data) {
        const d = res.data;
        setRestaurantName(d.restaurant_name || 'Saffron Grill');
        setTagline(d.tagline || '');
        setAddress(d.address || '');
        setPhone(d.phone || '');
        setEmail(d.email || '');
        setGstin(d.gstin || '');
        setTaxRate(Number(d.tax_rate ?? 5.0));
        setTaxEnabled(Number(d.tax_enabled ?? 1));
        setDefaultOrderType(d.default_order_type || 'dine_in');
        setReceiptFooter(d.receipt_footer || '');
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const payload = {
        restaurant_name: restaurantName,
        tagline,
        address,
        phone,
        email,
        gstin,
        tax_rate: taxRate,
        tax_enabled: taxEnabled,
        default_order_type: defaultOrderType,
        receipt_footer: receiptFooter,
      };

      const res = await api.post('/api/settings.php', payload);
      if (res?.success) {
        setMessage('Settings saved successfully and persisted to database!');
      }
    } catch (err) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-400">Loading settings...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Restaurant Settings & Billing Preferences</h1>
          <p className="text-xs text-slate-500">Configure outlet brand info, GST tax rate, and thermal receipt headers</p>
        </div>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Brand & Contact Info */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Store className="w-4 h-4 text-amber-600" />
            <h2 className="text-sm font-bold text-slate-900">Outlet Profile & Contact Details</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Restaurant Trade Name *</label>
              <input
                type="text"
                required
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                className="w-full py-2 px-3 rounded-xl border border-slate-300 font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Brand Tagline</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Authentic Tandoor & Indian Flavours"
                className="w-full py-2 px-3 rounded-xl border border-slate-300"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Restaurant Physical Address</label>
              <textarea
                rows="2"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Near IQ City Medical College, Bijra More, Durgapur, West Bengal 713206"
                className="w-full py-2 px-3 rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Billing Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98321 45678"
                className="w-full py-2 px-3 rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Contact Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@saffrongrill.in"
                className="w-full py-2 px-3 rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">GSTIN (Tax ID Number)</label>
              <input
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                placeholder="19AABCS1234F1Z9"
                className="w-full py-2 px-3 rounded-xl border border-slate-300 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Billing & Tax Settings */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Percent className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900">Billing, GST Tax & Thermal Preferences</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">GST Tax Rate (%)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
                className="w-full py-2 px-3 rounded-xl border border-slate-300 font-bold"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Default Indian restaurant GST is 5%</span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Tax Status</label>
              <select
                value={taxEnabled}
                onChange={(e) => setTaxEnabled(Number(e.target.value))}
                className="w-full py-2 px-3 rounded-xl border border-slate-300 bg-white"
              >
                <option value={1}>Enabled (Auto-apply to bills)</option>
                <option value={0}>Disabled (0% Tax)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Default Order Type in POS</label>
              <select
                value={defaultOrderType}
                onChange={(e) => setDefaultOrderType(e.target.value)}
                className="w-full py-2 px-3 rounded-xl border border-slate-300 bg-white"
              >
                <option value="dine_in">Dine-In (With Table)</option>
                <option value="takeaway">Takeaway (Direct)</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="block font-bold text-slate-700 mb-1">Receipt Footer Note</label>
              <textarea
                rows="2"
                value={receiptFooter}
                onChange={(e) => setReceiptFooter(e.target.value)}
                placeholder="Thank you for dining at Saffron Grill! Visit again soon."
                className="w-full py-2 px-3 rounded-xl border border-slate-300"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="py-3 px-6 rounded-xl bg-[#E99A24] hover:bg-[#CF7C12] text-slate-950 font-bold text-sm shadow-md shadow-amber-500/20 flex items-center gap-2 transition active:scale-98 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
