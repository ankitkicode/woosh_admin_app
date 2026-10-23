import { useState, useEffect } from 'react';
import {
  Send,
  BellRing,
  History,
  Users,
  Car,
  Smartphone,
  MapPin,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Megaphone,
  Radio,
  UserCheck
} from 'lucide-react';
import { apiClient } from '../../../common/utils/apiClient';
import { Badge } from '../../../common/components/Badge';
import { Button } from '../../../common/components/Button';

interface BroadcastRecord {
  _id: string;
  title: string;
  body: string;
  target: 'ALL' | 'PASSENGERS' | 'RIDERS';
  city: string;
  platform: string;
  type: string;
  imageUrl?: string;
  sentByName?: string;
  sentBy?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  sentCount: number;
  createdAt: string;
}

interface CityOption {
  _id: string;
  name: string;
}

export function BroadcastsPage() {
  const [activeTab, setActiveTab] = useState<'compose' | 'direct' | 'history'>('compose');

  // Cities list from backend
  const [cities, setCities] = useState<CityOption[]>([]);

  // Compose State
  const [target, setTarget] = useState<'ALL' | 'PASSENGERS' | 'RIDERS'>('ALL');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [platform, setPlatform] = useState<string>('ALL');
  const [notifType, setNotifType] = useState<string>('ANNOUNCEMENT');
  const [title, setTitle] = useState<string>('');
  const [body, setBody] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');

  const [isSending, setIsSending] = useState(false);
  const [sendSuccessMsg, setSendSuccessMsg] = useState<string | null>(null);
  const [sendErrorMsg, setSendErrorMsg] = useState<string | null>(null);

  // Direct User Push State
  const [directPhone, setDirectPhone] = useState('');
  const [directTitle, setDirectTitle] = useState('');
  const [directBody, setDirectBody] = useState('');
  const [directType, setDirectType] = useState('GENERAL');
  const [isDirectSending, setIsDirectSending] = useState(false);
  const [directSuccessMsg, setDirectSuccessMsg] = useState<string | null>(null);
  const [directErrorMsg, setDirectErrorMsg] = useState<string | null>(null);

  // History State
  const [history, setHistory] = useState<BroadcastRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historyTargetFilter, setHistoryTargetFilter] = useState<string>('ALL');
  const [selectedLog, setSelectedLog] = useState<BroadcastRecord | null>(null);

  // Load cities on mount
  useEffect(() => {
    fetchOperatingCities();
    fetchHistory();
  }, []);

  const fetchOperatingCities = async () => {
    try {
      const res = await apiClient('/cities').catch(() => apiClient('/admin/cities'));
      const list = res?.data?.cities || res?.data || res || [];
      if (Array.isArray(list)) {
        setCities(list);
      }
    } catch {
      // Fallback defaults
      setCities([
        { _id: '1', name: 'Bhopal' },
        { _id: '2', name: 'Indore' },
        { _id: '3', name: 'Jabalpur' },
        { _id: '4', name: 'Gwalior' },
      ]);
    }
  };

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      const res = await apiClient('/admin/notifications/broadcasts').catch(() =>
        apiClient('/notifications/broadcasts')
      );
      const data = res?.data?.broadcasts || res?.data || res || [];
      if (Array.isArray(data)) {
        setHistory(data);
      }
    } catch (err) {
      console.error('Failed to load broadcast history', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Handle Send Broadcast
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      setSendErrorMsg('Title and Message Body are required');
      return;
    }

    setIsSending(true);
    setSendSuccessMsg(null);
    setSendErrorMsg(null);

    try {
      const payload = {
        target,
        title: title.trim(),
        body: body.trim(),
        city: selectedCity || undefined,
        platform: platform !== 'ALL' ? platform : undefined,
        type: notifType,
        imageUrl: imageUrl.trim() || undefined,
      };

      const res = await apiClient.post('/admin/notifications/broadcast', payload).catch(() =>
        apiClient.post('/notifications/broadcast', payload)
      );

      const msg = res?.message || `Broadcast notification delivered successfully!`;
      setSendSuccessMsg(msg);
      setTitle('');
      setBody('');
      setImageUrl('');
      fetchHistory();
    } catch (err: any) {
      setSendErrorMsg(err?.message || 'Failed to dispatch broadcast. Check network or server logs.');
    } finally {
      setIsSending(false);
    }
  };

  // Handle Direct Push
  const handleDirectPush = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directPhone.trim() || !directTitle.trim() || !directBody.trim()) {
      setDirectErrorMsg('Phone number, Title and Body are required');
      return;
    }

    setIsDirectSending(true);
    setDirectSuccessMsg(null);
    setDirectErrorMsg(null);

    try {
      const payload = {
        phoneNumber: directPhone.trim(),
        title: directTitle.trim(),
        body: directBody.trim(),
        type: directType,
      };

      const res = await apiClient.post('/admin/notifications/send-user', payload).catch(() =>
        apiClient.post('/notifications/send-user', payload)
      );

      setDirectSuccessMsg(res?.message || 'Push message sent to user successfully');
      setDirectTitle('');
      setDirectBody('');
    } catch (err: any) {
      setDirectErrorMsg(err?.message || 'Failed to send direct notification.');
    } finally {
      setIsDirectSending(false);
    }
  };

  // Delete Broadcast
  const handleDeleteBroadcast = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this broadcast log?')) return;
    try {
      await apiClient.delete(`/admin/notifications/broadcasts/${id}`).catch(() =>
        apiClient.delete(`/notifications/broadcasts/${id}`)
      );
      setHistory(prev => prev.filter(item => item._id !== id));
      if (selectedLog?._id === id) setSelectedLog(null);
    } catch {
      alert('Failed to delete broadcast record');
    }
  };

  // Filtered History
  const filteredHistory = history.filter(item => {
    const matchesTarget = historyTargetFilter === 'ALL' || item.target === historyTargetFilter;
    const matchesSearch =
      !historySearch ||
      item.title?.toLowerCase().includes(historySearch.toLowerCase()) ||
      item.body?.toLowerCase().includes(historySearch.toLowerCase()) ||
      item.city?.toLowerCase().includes(historySearch.toLowerCase());
    return matchesTarget && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner - Woosh Theme */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-woosh-border p-5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-woosh-primary-light flex items-center justify-center text-woosh-primary shadow-sm">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-woosh-dark">Broadcast & Push Notifications</h1>
              <Badge variant="success" dot>Live FCM Push</Badge>
            </div>
            <p className="text-sm text-woosh-muted mt-0.5">
              Broadcast instant announcements, promotional alerts & safety notifications to passengers and riders.
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('compose')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'compose'
                ? 'bg-woosh-primary text-white shadow-sm'
                : 'text-woosh-muted hover:text-woosh-dark'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            New Broadcast
          </button>
          <button
            onClick={() => setActiveTab('direct')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'direct'
                ? 'bg-woosh-primary text-white shadow-sm'
                : 'text-woosh-muted hover:text-woosh-dark'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            Direct User Push
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'history'
                ? 'bg-woosh-primary text-white shadow-sm'
                : 'text-woosh-muted hover:text-woosh-dark'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Sent History
          </button>
        </div>
      </div>

      {/* TAB 1: COMPOSE BROADCAST */}
      {activeTab === 'compose' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form (7 Cols) */}
          <div className="lg:col-span-7 bg-white border border-woosh-border rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-bold text-woosh-dark mb-5 flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-woosh-primary" />
              Compose Campaign Broadcast
            </h2>

            {sendSuccessMsg && (
              <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-600" />
                <div className="text-xs font-semibold">{sendSuccessMsg}</div>
              </div>
            )}

            {sendErrorMsg && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600" />
                <div className="text-xs font-semibold">{sendErrorMsg}</div>
              </div>
            )}

            <form onSubmit={handleSendBroadcast} className="space-y-5">
              {/* Target Audience Segment */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-woosh-muted mb-2">
                  Target Audience Segment
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setTarget('ALL')}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                      target === 'ALL'
                        ? 'border-woosh-primary bg-woosh-primary-light/40 text-woosh-primary font-bold ring-1 ring-woosh-primary shadow-sm'
                        : 'border-woosh-border bg-woosh-surface text-woosh-muted hover:border-gray-300 hover:text-woosh-dark'
                    }`}
                  >
                    <Users className="w-5 h-5 mb-1.5 text-woosh-primary" />
                    <span className="text-xs font-bold">All Users</span>
                    <span className="text-[10px] text-gray-500 mt-0.5">Riders + Passengers</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTarget('PASSENGERS')}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                      target === 'PASSENGERS'
                        ? 'border-woosh-primary bg-woosh-primary-light/40 text-woosh-primary font-bold ring-1 ring-woosh-primary shadow-sm'
                        : 'border-woosh-border bg-woosh-surface text-woosh-muted hover:border-gray-300 hover:text-woosh-dark'
                    }`}
                  >
                    <Users className="w-5 h-5 mb-1.5 text-blue-500" />
                    <span className="text-xs font-bold">Passengers</span>
                    <span className="text-[10px] text-gray-500 mt-0.5">Customer App</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTarget('RIDERS')}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                      target === 'RIDERS'
                        ? 'border-woosh-primary bg-woosh-primary-light/40 text-woosh-primary font-bold ring-1 ring-woosh-primary shadow-sm'
                        : 'border-woosh-border bg-woosh-surface text-woosh-muted hover:border-gray-300 hover:text-woosh-dark'
                    }`}
                  >
                    <Car className="w-5 h-5 mb-1.5 text-emerald-600" />
                    <span className="text-xs font-bold">Riders Fleet</span>
                    <span className="text-[10px] text-gray-500 mt-0.5">Driver Partners</span>
                  </button>
                </div>
              </div>

              {/* City & Platform Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-woosh-muted mb-1.5">
                    Target City
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <select
                      value={selectedCity}
                      onChange={e => setSelectedCity(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-white border border-woosh-border rounded-xl text-woosh-dark text-xs font-medium focus:outline-none focus:border-woosh-primary focus:ring-1 focus:ring-woosh-primary"
                    >
                      <option value="">All Operating Cities</option>
                      {cities.map(c => (
                        <option key={c._id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-woosh-muted mb-1.5">
                    App Platform
                  </label>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <select
                      value={platform}
                      onChange={e => setPlatform(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-white border border-woosh-border rounded-xl text-woosh-dark text-xs font-medium focus:outline-none focus:border-woosh-primary focus:ring-1 focus:ring-woosh-primary"
                    >
                      <option value="ALL">All Platforms (Android + iOS)</option>
                      <option value="android">Android Only</option>
                      <option value="ios">iOS Only</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Notification Type */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-woosh-muted mb-1.5">
                  Campaign Type
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['ANNOUNCEMENT', 'PROMOTION', 'SYSTEM_ALERT', 'SAFETY'].map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setNotifType(t)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border text-center transition-all ${
                        notifType === t
                          ? 'border-woosh-primary bg-woosh-primary-light/50 text-woosh-primary font-bold shadow-sm'
                          : 'border-woosh-border bg-white text-woosh-muted hover:text-woosh-dark'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title Input */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-woosh-dark">
                    Notification Title <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-gray-400">{title.length}/60 chars</span>
                </div>
                <input
                  type="text"
                  maxLength={60}
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. 🌧️ Heavy Rain Alert: Drive Safely & Earn Extra"
                  className="w-full px-4 py-2.5 bg-white border border-woosh-border rounded-xl text-woosh-dark text-xs focus:outline-none focus:border-woosh-primary focus:ring-1 focus:ring-woosh-primary"
                />
              </div>

              {/* Message Body Input */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-woosh-dark">
                    Message Body <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-gray-400">{body.length}/240 chars</span>
                </div>
                <textarea
                  rows={4}
                  maxLength={240}
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  placeholder="Type clear and concise message to be displayed directly on lockscreen..."
                  className="w-full px-4 py-2.5 bg-white border border-woosh-border rounded-xl text-woosh-dark text-xs focus:outline-none focus:border-woosh-primary focus:ring-1 focus:ring-woosh-primary"
                />
              </div>

              {/* Banner Image URL (Optional) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-woosh-muted mb-1.5">
                  Banner Image URL (Optional)
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  placeholder="https://images.woosh.app/banners/promo.png"
                  className="w-full px-4 py-2.5 bg-white border border-woosh-border rounded-xl text-woosh-dark text-xs focus:outline-none focus:border-woosh-primary focus:ring-1 focus:ring-woosh-primary"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSending || !title.trim() || !body.trim()}
                className="w-full py-3.5 bg-woosh-primary hover:bg-woosh-primary-hover text-white font-bold text-sm shadow-md"
              >
                {isSending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    Broadcasting to Active Devices...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Dispatch Push Broadcast Now
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* Right Preview Card (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border border-woosh-border rounded-2xl p-6 shadow-sm">
              <h3 className="text-xs font-bold text-woosh-dark uppercase tracking-wider mb-5 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-woosh-primary" />
                Live Mobile Device Preview
              </h3>

              {/* Phone Mockup Frame */}
              <div className="w-full max-w-[310px] mx-auto rounded-[36px] border-4 border-slate-800 bg-slate-950 p-3.5 shadow-xl overflow-hidden relative">
                {/* Notch */}
                <div className="w-24 h-4 bg-slate-800 rounded-b-xl mx-auto mb-4" />

                {/* Clock */}
                <div className="text-center mb-6">
                  <span className="text-3xl font-extralight text-white tracking-tight">10:42</span>
                  <div className="text-[11px] text-slate-400 font-medium mt-0.5">Thursday, October 22</div>
                </div>

                {/* Lockscreen Notification Bubble */}
                <div className="rounded-2xl bg-white/95 backdrop-blur-md p-3.5 border border-white/20 shadow-lg space-y-2 text-slate-800">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded-md bg-woosh-primary flex items-center justify-center text-white font-black text-[9px]">
                        W
                      </div>
                      <span className="font-bold text-slate-900">WOOSH</span>
                      <span>•</span>
                      <span className="text-woosh-primary font-bold text-[10px] uppercase">{notifType}</span>
                    </div>
                    <span>now</span>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                      {title.trim() || 'Notification Title Preview'}
                    </h4>
                    <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-3 leading-relaxed">
                      {body.trim() || 'This is how your broadcast message will look on passengers and riders mobile lockscreens.'}
                    </p>
                  </div>

                  {imageUrl.trim() && (
                    <div className="rounded-lg overflow-hidden border border-slate-200 mt-2 max-h-24">
                      <img
                        src={imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e: any) => (e.target.style.display = 'none')}
                      />
                    </div>
                  )}
                </div>

                <div className="mt-8 text-center text-[10px] text-slate-500 pb-2">
                  Swipe up to open Woosh App
                </div>
              </div>

              {/* Delivery Insights Box */}
              <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
                <div className="font-bold text-slate-800 flex items-center gap-2">
                  <BellRing className="w-3.5 h-3.5 text-woosh-primary" />
                  Delivery Guarantees:
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li>Automatic batching in 500-token chunks via Google Firebase Admin.</li>
                  <li>Permanent record written to each recipient's in-app notification center.</li>
                  <li>High-priority wake-up flag for instant sound and vibration on Android & iOS.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DIRECT USER PUSH */}
      {activeTab === 'direct' && (
        <div className="max-w-2xl mx-auto bg-white border border-woosh-border rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-woosh-dark mb-1 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-woosh-primary" />
            Send Direct Push to Specific User
          </h2>
          <p className="text-xs text-woosh-muted mb-6">
            Dispatch an individual notification directly to a specific passenger or rider by phone number.
          </p>

          {directSuccessMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-600" />
              <div className="text-xs font-semibold">{directSuccessMsg}</div>
            </div>
          )}

          {directErrorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600" />
              <div className="text-xs font-semibold">{directErrorMsg}</div>
            </div>
          )}

          <form onSubmit={handleDirectPush} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-woosh-dark mb-1.5">
                User Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={directPhone}
                onChange={e => setDirectPhone(e.target.value)}
                placeholder="+919876543210 or 9876543210"
                className="w-full px-4 py-2.5 bg-white border border-woosh-border rounded-xl text-woosh-dark text-xs focus:outline-none focus:border-woosh-primary focus:ring-1 focus:ring-woosh-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-woosh-dark mb-1.5">
                Type
              </label>
              <select
                value={directType}
                onChange={e => setDirectType(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-woosh-border rounded-xl text-woosh-dark text-xs focus:outline-none focus:border-woosh-primary focus:ring-1 focus:ring-woosh-primary"
              >
                <option value="GENERAL">General Notice</option>
                <option value="KYC_UPDATE">KYC Document Status</option>
                <option value="PAYMENT">Wallet & Payout Update</option>
                <option value="SAFETY_WARNING">Safety Warning</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-woosh-dark mb-1.5">
                Notification Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={directTitle}
                onChange={e => setDirectTitle(e.target.value)}
                placeholder="e.g. KYC Documents Approved"
                className="w-full px-4 py-2.5 bg-white border border-woosh-border rounded-xl text-woosh-dark text-xs focus:outline-none focus:border-woosh-primary focus:ring-1 focus:ring-woosh-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-woosh-dark mb-1.5">
                Message Body <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                value={directBody}
                onChange={e => setDirectBody(e.target.value)}
                placeholder="Type your direct message to this user..."
                className="w-full px-4 py-2.5 bg-white border border-woosh-border rounded-xl text-woosh-dark text-xs focus:outline-none focus:border-woosh-primary focus:ring-1 focus:ring-woosh-primary"
              />
            </div>

            <Button
              type="submit"
              disabled={isDirectSending || !directPhone.trim() || !directTitle.trim() || !directBody.trim()}
              className="w-full py-3.5 bg-woosh-primary hover:bg-woosh-primary-hover text-white font-bold text-sm shadow-md"
            >
              {isDirectSending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  Sending Direct Push...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Push to User
                </>
              )}
            </Button>
          </form>
        </div>
      )}

      {/* TAB 3: SENT BROADCAST HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-white border border-woosh-border rounded-2xl p-6 shadow-sm space-y-5">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-72">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search campaigns..."
                  value={historySearch}
                  onChange={e => setHistorySearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-woosh-border rounded-xl text-woosh-dark text-xs focus:outline-none focus:border-woosh-primary"
                />
              </div>

              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl border border-gray-200">
                {['ALL', 'PASSENGERS', 'RIDERS'].map(f => (
                  <button
                    key={f}
                    onClick={() => setHistoryTargetFilter(f)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      historyTargetFilter === f
                        ? 'bg-woosh-primary text-white shadow-sm'
                        : 'text-woosh-muted hover:text-woosh-dark'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchHistory}
              className="text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${historyLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-woosh-border">
            <table className="w-full text-left text-xs text-woosh-dark">
              <thead className="bg-gray-50/80 text-[11px] uppercase font-bold text-woosh-muted border-b border-woosh-border">
                <tr>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Campaign Title & Body</th>
                  <th className="py-3 px-4">Audience</th>
                  <th className="py-3 px-4">Target City</th>
                  <th className="py-3 px-4">Sent Count</th>
                  <th className="py-3 px-4">Dispatched By</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {historyLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-woosh-muted">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-woosh-primary" />
                      Loading broadcast archives...
                    </td>
                  </tr>
                ) : filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-woosh-muted">
                      No broadcast campaigns found matching filters.
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map(b => (
                    <tr key={b._id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap text-xs text-woosh-muted">
                        {new Date(b.createdAt).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-bold text-woosh-dark text-xs line-clamp-1">{b.title}</div>
                        <div className="text-[11px] text-woosh-muted mt-0.5 line-clamp-1">{b.body}</div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge
                          variant={
                            b.target === 'ALL'
                              ? 'neutral'
                              : b.target === 'PASSENGERS'
                              ? 'info'
                              : 'success'
                          }
                        >
                          {b.target}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-woosh-dark font-medium">
                        {b.city || 'All Cities'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full text-[11px]">
                          {b.sentCount || 0} Delivered
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-woosh-muted text-[11px]">
                        {b.sentByName || b.sentBy?.name || 'Admin'}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleDeleteBroadcast(b._id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Broadcast Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
