import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Key,
  LogOut,
  Plus,
  Edit2,
  Trash2,
  Star,
  Search,
  CheckCircle,
  Clock,
  TrendingUp,
  Users,
  DollarSign,
  Layers,
  Sparkles,
  X,
  Lock,
  Eye,
  EyeOff,
  ExternalLink,
  Menu,
  ChevronRight
} from 'lucide-react';
import { apiService } from '../services/api';

export default function AdminDashboard({ onLogout, showToast }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'plans' | 'orders'
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Data states
  const [stats, setStats] = useState({ totalRevenue: 0, totalCustomers: 0, activePlans: 0, totalOrders: 0 });
  const [plans, setPlans] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null); // null for new, plan object for edit
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  // Plan Form State
  const [planForm, setPlanForm] = useState({
    id: '',
    name: '',
    duration_days: 365,
    duration_label: '365 Days Access',
    price: 199,
    original_price: 499,
    badge: 'Popular',
    is_popular: false,
    canva_invite_link: '',
    features: ''
  });

  // Password Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  // Load Data
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [fetchedPlans, fetchedOrders, fetchedStats] = await Promise.all([
        apiService.getPlans(),
        apiService.getOrders(),
        apiService.getAdminStats()
      ]);
      setPlans(fetchedPlans);
      setOrders(fetchedOrders);
      setStats(fetchedStats);
    } catch (err) {
      if (showToast) showToast('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Open Add Plan Modal
  const handleOpenAddPlan = () => {
    setEditingPlan(null);
    setPlanForm({
      id: '',
      name: '',
      duration_days: 365,
      duration_label: '365 Days Access',
      price: 199,
      original_price: 499,
      badge: 'Best Seller',
      is_popular: false,
      canva_invite_link: 'https://www.canva.com/brand/join?token=new_invite',
      features: "100M+ Premium Stock Photos\nMagic Studio AI Tools\nBackground Remover in 1 Click\nInstant Email Activation"
    });
    setPlanModalOpen(true);
  };

  // Open Edit Plan Modal
  const handleOpenEditPlan = (plan) => {
    setEditingPlan(plan);
    setPlanForm({
      id: plan.id,
      name: plan.name,
      duration_days: plan.duration_days || 365,
      duration_label: plan.duration_label || `${plan.duration_days} Days Access`,
      price: plan.price,
      original_price: plan.original_price || plan.price * 2,
      badge: plan.badge || '',
      is_popular: !!plan.is_popular,
      canva_invite_link: plan.canva_invite_link || '',
      features: Array.isArray(plan.features) ? plan.features.join('\n') : plan.features || ''
    });
    setPlanModalOpen(true);
  };

  // Save Plan Submission
  const handleSavePlanSubmit = async (e) => {
    e.preventDefault();
    try {
      const featuresArray = typeof planForm.features === 'string'
        ? planForm.features.split('\n').filter(f => f.trim().length > 0)
        : planForm.features;

      const payload = {
        ...planForm,
        price: Number(planForm.price),
        original_price: Number(planForm.original_price),
        duration_days: Number(planForm.duration_days),
        features: featuresArray
      };

      const updatedPlans = await apiService.savePlan(payload);
      setPlans(updatedPlans);
      setPlanModalOpen(false);
      loadDashboardData();
      if (showToast) showToast(editingPlan ? 'Plan updated successfully!' : 'New plan added!');
    } catch (err) {
      if (showToast) showToast('Error saving plan', 'error');
    }
  };

  // Delete Plan
  const handleDeletePlan = async (planId) => {
    if (!window.confirm('Are you sure you want to delete this plan?')) return;
    try {
      const updated = await apiService.deletePlan(planId);
      setPlans(updated);
      loadDashboardData();
      if (showToast) showToast('Plan deleted');
    } catch (err) {
      if (showToast) showToast('Error deleting plan', 'error');
    }
  };

  // Toggle Popular
  const handleTogglePopular = async (planId) => {
    try {
      const updated = await apiService.togglePopularPlan(planId);
      setPlans(updated);
      if (showToast) showToast('Popular status updated');
    } catch (err) {
      if (showToast) showToast('Error toggling status', 'error');
    }
  };

  // Password Change Submission
  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword) {
      if (showToast) showToast('Current password is required', 'error');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      if (showToast) showToast('New passwords do not match', 'error');
      return;
    }
    if (passwordForm.newPassword.length < 3) {
      if (showToast) showToast('Password must be at least 3 characters long', 'error');
      return;
    }

    try {
      const res = await apiService.changePassword('admin', passwordForm.currentPassword, passwordForm.newPassword);
      if (res && res.success) {
        setPasswordModalOpen(false);
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        if (showToast) showToast(res.message || 'Password updated successfully!');
      } else {
        if (showToast) showToast(res?.error || 'Failed to change password', 'error');
      }
    } catch (err) {
      if (showToast) showToast(err.message || 'Failed to change password', 'error');
    }
  };

  // Filtered orders
  const filteredOrders = orders.filter(o => 
    o.customer_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.plan_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col md:flex-row">
      
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 glass-nav border-r border-white/10 p-6 shrink-0 justify-between min-h-screen sticky top-0">
        <div className="space-y-8">
          
          {/* Logo Header */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 p-[1px]">
              <div className="w-full h-full bg-[#050816] rounded-[11px] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
            <div>
              <h2 className="font-extrabold text-base text-white tracking-tight">CANVA STORE</h2>
              <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">ADMIN PORTAL</span>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="space-y-1.5">
            {[
              { id: 'overview', label: 'Overview', icon: LayoutDashboard },
              { id: 'plans', label: 'Plan Management', icon: Package },
              { id: 'orders', label: 'Customer Orders', icon: ShoppingBag },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/30 shadow-lg shadow-cyan-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>

        </div>

        {/* Bottom Actions */}
        <div className="space-y-2 pt-6 border-t border-white/10">
          <button
            onClick={() => setPasswordModalOpen(true)}
            className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl font-medium text-xs text-slate-400 hover:text-white hover:bg-white/5 transition"
          >
            <Key className="w-4 h-4 text-cyan-400" />
            <span>Change Password</span>
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl font-medium text-xs text-red-400 hover:bg-red-500/10 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Navbar */}
      <div className="md:hidden glass-nav p-4 flex items-center justify-between border-b border-white/10 sticky top-0 z-40">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-sm text-white">ADMIN DASHBOARD</span>
        </div>
        <button
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-300"
        >
          {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileSidebarOpen && (
        <div className="md:hidden glass-modal border-b border-white/10 p-4 space-y-3 animate-in slide-in-from-top duration-200">
          {[
            { id: 'overview', label: 'Overview', icon: LayoutDashboard },
            { id: 'plans', label: 'Plan Management', icon: Package },
            { id: 'orders', label: 'Customer Orders', icon: ShoppingBag },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-semibold text-sm ${
                activeTab === tab.id ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-300'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </button>
          ))}
          <div className="pt-3 border-t border-white/10 space-y-2">
            <button
              onClick={() => { setPasswordModalOpen(true); setMobileSidebarOpen(false); }}
              className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs text-slate-300"
            >
              <Key className="w-4 h-4 text-cyan-400" />
              <span>Change Password</span>
            </button>
            <button
              onClick={onLogout}
              className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs text-red-400"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Body */}
      <main className="flex-1 p-4 sm:p-8 lg:p-10 max-w-7xl mx-auto w-full">
        
        {/* Top Action Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {activeTab === 'overview' && 'Store Analytics Overview'}
              {activeTab === 'plans' && 'Canva Subscription Plans'}
              {activeTab === 'orders' && 'Customer Orders & Sales'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Private SaaS Store Management Control Center
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>Storefront Live</span>
            </div>
            
            {activeTab === 'plans' && (
              <button
                onClick={handleOpenAddPlan}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 hover:opacity-95 transition flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Plan</span>
              </button>
            )}
          </div>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            
            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: 'Total Revenue', value: `₹${stats.totalRevenue}`, icon: DollarSign, color: 'from-emerald-500 to-teal-500', glow: 'glow-cyan' },
                { title: 'Total Customers', value: stats.totalCustomers, icon: Users, color: 'from-cyan-500 to-blue-500', glow: 'glow-cyan' },
                { title: 'Active Plans', value: stats.activePlans, icon: Layers, color: 'from-purple-500 to-indigo-500', glow: 'glow-purple' },
                { title: 'Total Orders', value: stats.totalOrders, icon: ShoppingBag, color: 'from-amber-500 to-orange-500', glow: 'glow-amber' }
              ].map((card, i) => (
                <div key={i} className="glass-card p-6 rounded-3xl border border-white/10 relative overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{card.title}</span>
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} p-[1px]`}>
                      <div className="w-full h-full bg-[#050816] rounded-[11px] flex items-center justify-center text-white">
                        <card.icon className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                  <h3 className="text-3xl font-extrabold text-white tracking-tight">{card.value}</h3>
                  <div className="mt-3 flex items-center space-x-1 text-emerald-400 text-xs font-semibold">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Active Store Data</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Sales List */}
            <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white">Recent Customer Activity</h3>
                <button onClick={() => setActiveTab('orders')} className="text-xs font-bold text-cyan-400 hover:underline flex items-center space-x-1">
                  <span>View All Orders</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {orders.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">No orders recorded yet.</div>
              ) : (
                <div className="space-y-3">
                  {orders.slice(0, 5).map((order) => (
                    <div key={order.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between gap-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold text-xs border border-cyan-500/20">
                          {order.customer_email?.[0]?.toUpperCase() || 'C'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{order.customer_email}</p>
                          <p className="text-xs text-slate-400">{order.plan_name} • {order.payment_method}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-extrabold text-emerald-400">₹{order.amount}</span>
                        <p className="text-[10px] text-slate-400 font-mono">{order.id}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 2: PLAN MANAGEMENT */}
        {activeTab === 'plans' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <div key={plan.id} className={`glass-card p-6 rounded-3xl border ${plan.is_popular ? 'border-cyan-500/40 bg-slate-900/60' : 'border-white/10'} relative flex flex-col justify-between`}>
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-extrabold text-white">{plan.name}</h3>
                      <button
                        onClick={() => handleTogglePopular(plan.id)}
                        className={`p-1.5 rounded-lg border transition ${
                          plan.is_popular ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-white/5 text-slate-500 border-white/10'
                        }`}
                        title="Toggle Popular Status"
                      >
                        <Star className="w-4 h-4 fill-current" />
                      </button>
                    </div>

                    <div className="flex items-baseline space-x-2 mb-4">
                      <span className="text-3xl font-black text-white">₹{plan.price}</span>
                      {plan.original_price && <span className="text-xs text-slate-500 line-through">₹{plan.original_price}</span>}
                      <span className="text-xs text-slate-400">/ {plan.duration_label || `${plan.duration_days} days`}</span>
                    </div>

                    {plan.canva_invite_link && (
                      <div className="p-2.5 rounded-xl bg-slate-950/80 border border-white/5 mb-4 text-[11px] font-mono text-cyan-300 truncate flex items-center justify-between">
                        <span className="truncate">{plan.canva_invite_link}</span>
                        <a href={plan.canva_invite_link} target="_blank" rel="noopener noreferrer" className="ml-2 text-slate-400 hover:text-white">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    )}

                    <div className="space-y-1.5 mb-6 text-xs text-slate-300">
                      {(Array.isArray(plan.features) ? plan.features : []).slice(0, 4).map((f, idx) => (
                        <div key={idx} className="flex items-center space-x-2">
                          <CheckCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span className="truncate">{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-4 border-t border-white/10">
                    <button
                      onClick={() => handleOpenEditPlan(plan)}
                      className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold flex items-center justify-center space-x-1.5 transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeletePlan(plan.id)}
                      className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
                      title="Delete Plan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: CUSTOMER ORDERS */}
        {activeTab === 'orders' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Search input */}
            <div className="relative max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search orders by customer email or order ID..."
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/80 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs sm:text-sm"
              />
            </div>

            {/* Orders Table */}
            <div className="glass-card rounded-3xl border border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-white/5 border-b border-white/10 text-slate-400 uppercase tracking-wider text-[11px] font-semibold">
                    <tr>
                      <th className="py-4 px-6">Order ID</th>
                      <th className="py-4 px-6">Customer Email</th>
                      <th className="py-4 px-6">Purchased Plan</th>
                      <th className="py-4 px-6">Amount</th>
                      <th className="py-4 px-6">Payment</th>
                      <th className="py-4 px-6">Date</th>
                      <th className="py-4 px-6">Invite Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-12 text-center text-slate-400">
                          No matching customer orders found.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-white/5 transition">
                          <td className="py-4 px-6 font-mono font-bold text-cyan-400">{ord.id}</td>
                          <td className="py-4 px-6 font-semibold text-white">{ord.customer_email}</td>
                          <td className="py-4 px-6">{ord.plan_name}</td>
                          <td className="py-4 px-6 font-bold text-emerald-400">₹{ord.amount}</td>
                          <td className="py-4 px-6">{ord.payment_method}</td>
                          <td className="py-4 px-6 text-slate-400">{new Date(ord.created_at).toLocaleDateString()}</td>
                          <td className="py-4 px-6">
                            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                              ACTIVATED
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* PLAN EDIT / ADD MODAL */}
      {planModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in">
          <div className="relative w-full max-w-lg glass-modal rounded-3xl p-6 sm:p-8 border border-white/15 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setPlanModalOpen(false)} className="absolute top-5 right-5 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-extrabold text-white mb-6">
              {editingPlan ? 'Edit Plan Details' : 'Add New Canva Subscription Plan'}
            </h3>

            <form onSubmit={handleSavePlanSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Plan Name</label>
                <input
                  type="text"
                  required
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  placeholder="e.g. 1 Year Canva Pro Access"
                  className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-white/10 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Current Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={planForm.price}
                    onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-white/10 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Original Price (₹)</label>
                  <input
                    type="number"
                    value={planForm.original_price}
                    onChange={(e) => setPlanForm({ ...planForm, original_price: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-white/10 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Duration (Days)</label>
                  <input
                    type="number"
                    required
                    value={planForm.duration_days}
                    onChange={(e) => setPlanForm({ ...planForm, duration_days: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-white/10 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Badge Tag</label>
                  <input
                    type="text"
                    value={planForm.badge}
                    onChange={(e) => setPlanForm({ ...planForm, badge: e.target.value })}
                    placeholder="e.g. Best Seller"
                    className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-white/10 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Canva Team Invite Link</label>
                <input
                  type="url"
                  required
                  value={planForm.canva_invite_link}
                  onChange={(e) => setPlanForm({ ...planForm, canva_invite_link: e.target.value })}
                  placeholder="https://www.canva.com/brand/join?token=..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-white/10 text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Plan Features (One per line)</label>
                <textarea
                  rows="4"
                  value={planForm.features}
                  onChange={(e) => setPlanForm({ ...planForm, features: e.target.value })}
                  placeholder="100M+ Premium Stock Assets&#10;Magic Studio AI Tools&#10;Background Remover"
                  className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-white/10 text-white focus:outline-none focus:border-cyan-500 font-sans"
                ></textarea>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="is_popular"
                  checked={planForm.is_popular}
                  onChange={(e) => setPlanForm({ ...planForm, is_popular: e.target.checked })}
                  className="w-4 h-4 accent-cyan-500 rounded"
                />
                <label htmlFor="is_popular" className="text-slate-300 font-semibold cursor-pointer">
                  Mark as Popular Plan (Glowing Highlight)
                </label>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setPlanModalOpen(false)}
                  className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold shadow-lg shadow-cyan-500/20"
                >
                  Save Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHANGE PASSWORD MODAL */}
      {passwordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in">
          <div className="relative w-full max-w-md glass-modal rounded-3xl p-6 sm:p-8 border border-white/15">
            <button onClick={() => setPasswordModalOpen(false)} className="absolute top-5 right-5 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Change Admin Password</h3>
                <p className="text-xs text-slate-400">Update security credentials</p>
              </div>
            </div>

            <form onSubmit={handleChangePasswordSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPw ? 'text' : 'password'}
                    required
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-white/10 text-white focus:outline-none focus:border-cyan-500 pr-10"
                  />
                  <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    required
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-white/10 text-white focus:outline-none focus:border-cyan-500 pr-10"
                  />
                  <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-white/10 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setPasswordModalOpen(false)}
                  className="px-4 py-3 rounded-xl bg-white/5 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold shadow-lg shadow-cyan-500/20"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
