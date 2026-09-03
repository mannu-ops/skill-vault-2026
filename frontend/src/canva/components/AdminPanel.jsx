import React, { useState, useEffect } from 'react';
import {
  Plus, Edit, Trash2, Crown, Users, TrendingUp, DollarSign,
  Search, Copy, Check, Sparkles, ExternalLink, X, RefreshCw, Layers, Link as LinkIcon, Key,
  ChevronLeft, ChevronRight, Phone
} from 'lucide-react';
import {
  createPlan, updatePlan, deletePlan, fetchPlans,
  createActivation, updateActivation, deleteActivation, fetchActivations, changeAdminPassword,
  fetchPaymentAnalytics
} from '../utils/api.js';

export default function AdminPanel({ 
  loggedInAdmin = { username: 'SkillVault Admin', name: 'Primary Owner' }, 
  plans: propPlans, 
  setPlans: propSetPlans, 
  activations: propActivations, 
  setActivations: propSetActivations, 
  onSwitchToStore, 
  onLogout,
  embedded = false
}) {
  const [internalPlans, setInternalPlans] = useState([]);
  const [internalActivations, setInternalActivations] = useState([]);

  const plans = propPlans !== undefined ? propPlans : internalPlans;
  const setPlans = propSetPlans || setInternalPlans;
  const activations = propActivations !== undefined ? propActivations : internalActivations;
  const setActivations = propSetActivations || setInternalActivations;

  // Auto-fetch data if not provided by parent
  useEffect(() => {
    if (propPlans === undefined) {
      fetchPlans().then(data => setPlans(data || []));
    }
    if (propActivations === undefined) {
      fetchActivations().then(data => setActivations(data || []));
    }
  }, [propPlans, propActivations]);

  const [activeTab, setActiveTab] = useState('plans'); // 'plans' | 'users' | 'analytics'
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [copiedStoreLink, setCopiedStoreLink] = useState(false);

  // Payment Analytics State
  const [paymentAnalytics, setPaymentAnalytics] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);

  // Load Payment Analytics & Refresh Data on Tab Change
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      const [res, actsData, plansData] = await Promise.all([
        fetchPaymentAnalytics(),
        fetchActivations(),
        fetchPlans()
      ]);
      if (isMounted) {
        if (res) {
          setPaymentAnalytics(res.analytics);
          setPaymentHistory(res.payments || []);
        }
        if (actsData && propActivations === undefined) {
          setActivations(actsData);
        }
        if (plansData && propPlans === undefined) {
          setPlans(plansData);
        }
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, [activeTab]);

  // Pagination State for Activations Table
  const [activationsPage, setActivationsPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    setActivationsPage(1);
  }, [searchTerm, activeTab]);

  // Toast Notification State
  const [toast, setToast] = useState({ isOpen: false, type: 'success', message: '' });

  // Confirmation & Result Modal States
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: '', id: null, title: '', details: '', confirmText: 'Confirm', payload: null });
  const [resultModal, setResultModal] = useState({ isOpen: false, status: 'success', title: '', message: '' });

  // Change Password Modal State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '' });
  const [passwordError, setPasswordError] = useState('');
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  // Plan Modal State
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const [planError, setPlanError] = useState('');
  const [editingPlan, setEditingPlan] = useState(null);
  const [planForm, setPlanForm] = useState({
    name: '',
    duration: '365 Days Access',
    price: '',
    originalPrice: '',
    badge: '',
    inviteLink: 'https://www.canva.com/brand/join?token=INVITE_TEAM_TOKEN',
    features: 'Full Canva Pro Unlock, Magic Studio AI Access, 100M+ Stock Assets',
    not_included: ''
  });

  // Activation Modal State (Create & Edit)
  const [isActivationModalOpen, setIsActivationModalOpen] = useState(false);
  const [isSavingActivation, setIsSavingActivation] = useState(false);
  const [activationError, setActivationError] = useState('');
  const [editingActivation, setEditingActivation] = useState(null);
  const [activationForm, setActivationForm] = useState({
    email: '',
    phone: '',
    planName: '1 Year Canva Pro',
    amount: '199',
    paymentMethod: 'Manual Admin Grant',
    inviteLink: 'https://www.canva.com/brand/join?token=PRO_ANNUAL_INVITE'
  });

  // Lock body scroll when any modal is open
  useEffect(() => {
    if (confirmModal.isOpen || isPlanModalOpen || isActivationModalOpen || isPasswordModalOpen || resultModal.isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [confirmModal.isOpen, isPlanModalOpen, isActivationModalOpen, isPasswordModalOpen, resultModal.isOpen]);

  const showToast = (type, message) => {
    setToast({ isOpen: true, type, message });
    setTimeout(() => {
      setToast({ isOpen: false, type: 'success', message: '' });
    }, 3200);
  };

  const storeFullUrl = `${window.location.origin}/canva`;

  const handleCopyStoreLink = () => {
    navigator.clipboard.writeText(storeFullUrl);
    setCopiedStoreLink(true);
    showToast('success', 'Canva Storefront URL copied to clipboard!');
    setTimeout(() => setCopiedStoreLink(false), 2000);
  };

  // Open Password Modal
  const handleOpenPasswordModal = () => {
    setPasswordForm({ oldPassword: '', newPassword: '' });
    setPasswordError('');
    setIsPasswordModalOpen(true);
  };

  useEffect(() => {
    const handleOpenModal = () => {
      handleOpenPasswordModal();
    };
    window.addEventListener('open-change-password', handleOpenModal);
    return () => {
      window.removeEventListener('open-change-password', handleOpenModal);
    };
  }, []);

  // Submit Password Change
  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!passwordForm.oldPassword || !passwordForm.newPassword) {
      setPasswordError('Both old and new passwords are required!');
      return;
    }
    if (passwordForm.newPassword.length < 3) {
      setPasswordError('New password must be at least 3 characters!');
      return;
    }

    setIsSubmittingPassword(true);
    setPasswordError('');

    try {
      const usernameToUpdate = loggedInAdmin?.username || 'admin';
      const res = await changeAdminPassword(
        usernameToUpdate,
        passwordForm.oldPassword,
        passwordForm.newPassword
      );

      if (res && res.success) {
        setIsPasswordModalOpen(false);
        setPasswordForm({ oldPassword: '', newPassword: '' });
        setResultModal({
          isOpen: true,
          status: 'success',
          title: 'Password Updated Successfully!',
          message: `Password for admin account '${usernameToUpdate}' has been updated successfully.`
        });
      } else {
        setPasswordError(res?.error || 'Incorrect old password or update failed!');
      }
    } catch (err) {
      setPasswordError('Failed to update password');
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  // Calculate statistics
  const totalRevenue = activations.reduce((sum, item) => sum + Number(item.amount || item.amountPaidInr || item.amount_paid_inr || 0), 0);

  const filteredPlans = plans.filter(p =>
    (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.duration || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredActivations = activations.filter(item => {
    const email = (item.email || item.user_email || '').toLowerCase();
    const plan = (item.planName || item.plan_name || '').toLowerCase();
    const phone = (item.phone || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    return email.includes(search) || plan.includes(search) || phone.includes(search);
  });

  // Open modal for Creating plan
  const handleOpenCreatePlan = () => {
    setEditingPlan(null);
    setPlanError('');
    setPlanForm({
      name: '',
      duration: '365 Days Access',
      price: '',
      originalPrice: '',
      badge: '',
      inviteLink: 'https://www.canva.com/brand/join?token=INVITE_TEAM_TOKEN',
      features: 'Full Canva Pro Unlock, Magic Studio AI Access, 100M+ Stock Assets',
      not_included: ''
    });
    setIsPlanModalOpen(true);
  };
  const handleOpenAddPlan = handleOpenCreatePlan;

  // Open modal for Editing plan
  const handleOpenEditPlan = (plan) => {
    setEditingPlan(plan);
    setPlanError('');
    setPlanForm({
      name: plan.name || '',
      duration: plan.duration || '365 Days Access',
      price: plan.price || '',
      originalPrice: plan.originalPrice || '',
      badge: plan.badge || '',
      inviteLink: plan.inviteLink || 'https://www.canva.com/brand/join?token=INVITE_TEAM_TOKEN',
      features: Array.isArray(plan.features) ? plan.features.join(', ') : (plan.features || ''),
      not_included: Array.isArray(plan.not_included || plan.notIncluded) ? (plan.not_included || plan.notIncluded).join(', ') : (plan.not_included || plan.notIncluded || '')
    });
    setIsPlanModalOpen(true);
  };

  // Direct Plan Save (Create or Update)
  const handleSavePlan = async (e) => {
    e.preventDefault();
    if (!planForm.name || !planForm.price) {
      setPlanError('Plan Name and Price are required.');
      return;
    }

    setIsSavingPlan(true);
    setPlanError('');

    try {
      let formattedFeatures = [];
      if (Array.isArray(planForm.features)) {
        formattedFeatures = planForm.features;
      } else if (typeof planForm.features === 'string') {
        formattedFeatures = planForm.features.split(',').map(f => f.trim()).filter(Boolean);
      }
      if (formattedFeatures.length === 0) {
        formattedFeatures = ['Full Canva Pro Access', 'Instant Email Delivery'];
      }

      let formattedNotIncluded = [];
      if (Array.isArray(planForm.not_included)) {
        formattedNotIncluded = planForm.not_included;
      } else if (typeof planForm.not_included === 'string') {
        formattedNotIncluded = planForm.not_included.split(',').map(f => f.trim()).filter(Boolean);
      }

      let link = (planForm.inviteLink || '').trim();
      if (!link) {
        link = 'https://www.canva.com/brand/join?token=DEFAULT_INVITE';
      } else if (!link.startsWith('http://') && !link.startsWith('https://')) {
        link = 'https://' + link;
      }

      const numPrice = Math.max(0, Number(planForm.price) || 199);
      const numOriginalPrice = Math.max(numPrice, Number(planForm.originalPrice) || (numPrice * 2));

      const payload = {
        name: planForm.name.trim(),
        duration: planForm.duration?.trim() || '365 Days Access',
        price: numPrice,
        originalPrice: numOriginalPrice,
        badge: planForm.badge?.trim() || null,
        inviteLink: link,
        features: formattedFeatures,
        not_included: formattedNotIncluded
      };

      if (editingPlan) {
        const ok = await updatePlan(editingPlan.id, payload);
        if (!ok) throw new Error('Failed to update plan. Please try again.');
        showToast('success', `Plan '${payload.name}' updated successfully!`);
      } else {
        const created = await createPlan(payload);
        if (!created) throw new Error('Failed to save plan to database.');
        showToast('success', `New plan '${payload.name}' created successfully!`);
      }

      const updatedPlans = await fetchPlans();
      setPlans(updatedPlans || []);
      setIsPlanModalOpen(false);
      setEditingPlan(null);
    } catch (err) {
      console.error('Plan save error:', err);
      setPlanError(err.message || 'Error saving plan');
      showToast('error', err.message || 'Failed to save plan');
    } finally {
      setIsSavingPlan(false);
    }
  };

  // Request Confirmation for Deleting Plan
  const requestDeletePlan = (plan) => {
    if (plans.length <= 1) {
      setResultModal({
        isOpen: true,
        status: 'error',
        title: 'Action Restricted',
        message: 'You must maintain at least one active plan on your storefront!'
      });
      return;
    }
    setConfirmModal({
      isOpen: true,
      type: 'delete_plan',
      id: plan.id,
      title: `Confirm Delete '${plan.name}'?`,
      details: 'Are you sure you want to remove this plan from your storefront? Customers will no longer be able to purchase it.',
      confirmText: 'Yes, Delete Plan',
      payload: plan
    });
  };

  // Request Confirmation for Deleting Activation Record
  const requestDeleteActivation = (activation) => {
    setConfirmModal({
      isOpen: true,
      type: 'delete_activation',
      id: activation.id,
      title: `Confirm Remove Order Record?`,
      details: `Are you sure you want to remove order record for '${activation.email}'?`,
      confirmText: 'Yes, Delete Order',
      payload: activation
    });
  };

  // Open modal for Creating Activation
  const handleOpenCreateActivation = () => {
    setEditingActivation(null);
    setActivationError('');
    setActivationForm({
      email: '',
      phone: '',
      planName: plans[0]?.name || '1 Year Canva Pro',
      amount: plans[0]?.price || '199',
      paymentMethod: 'Manual Admin Grant',
      inviteLink: plans[0]?.inviteLink || 'https://www.canva.com/brand/join?token=PRO_ANNUAL_INVITE'
    });
    setIsActivationModalOpen(true);
  };

  // Open modal for Editing Activation
  const handleOpenEditActivation = (item) => {
    setEditingActivation(item);
    setActivationError('');
    setActivationForm({
      email: item.email || '',
      phone: item.phone || '',
      planName: item.planName || 'Canva Pro Access',
      amount: item.amount || '199',
      paymentMethod: item.paymentMethod || 'Manual Admin Grant',
      inviteLink: item.inviteLink || 'https://www.canva.com/brand/join?token=DEFAULT_INVITE'
    });
    setIsActivationModalOpen(true);
  };

  // Direct Activation Save (Create or Update)
  const handleSaveActivation = async (e) => {
    e.preventDefault();
    if (!activationForm.email || !activationForm.email.includes('@')) {
      setActivationError('Valid customer email is required.');
      return;
    }

    setIsSavingActivation(true);
    setActivationError('');

    try {
      const payload = {
        email: activationForm.email.trim(),
        phone: (activationForm.phone || '').trim(),
        planName: activationForm.planName.trim(),
        amount: Math.max(0, Number(activationForm.amount) || 199),
        paymentMethod: activationForm.paymentMethod.trim() || 'Manual Admin Grant',
        inviteLink: (activationForm.inviteLink || '').trim() || 'https://www.canva.com/brand/join?token=DEFAULT_INVITE'
      };

      if (editingActivation) {
        const ok = await updateActivation(editingActivation.id, payload);
        if (!ok) throw new Error('Failed to update activation record.');
        showToast('success', `Activation for '${payload.email}' updated!`);
      } else {
        const created = await createActivation(payload);
        if (!created) throw new Error('Failed to create activation record.');
        showToast('success', `Activation for '${payload.email}' added!`);
      }

      const updated = await fetchActivations();
      setActivations(updated || []);
      setIsActivationModalOpen(false);
      setEditingActivation(null);
    } catch (err) {
      console.error('Activation save error:', err);
      setActivationError(err.message || 'Error saving activation');
      showToast('error', err.message || 'Failed to save activation');
    } finally {
      setIsSavingActivation(false);
    }
  };

  // Request Confirmation for Logout
  const requestLogout = () => {
    setConfirmModal({
      isOpen: true,
      type: 'logout',
      title: 'Confirm Admin Logout?',
      details: 'Are you sure you want to end your active session and log out?',
      confirmText: 'Yes, Logout'
    });
  };

  // Confirm Executed Action via API
  const handleConfirmAction = async () => {
    const currentType = confirmModal.type;
    const currentPayload = confirmModal.payload;
    const currentId = confirmModal.id;
    setConfirmModal({ isOpen: false, type: '', id: null, title: '', details: '', confirmText: '', payload: null });

    if (currentType === 'create_plan' || currentType === 'update_plan') {
      const formattedFeatures = planForm.features
        .split(',')
        .map(f => f.trim())
        .filter(f => f.length > 0);

      const payload = {
        name: planForm.name,
        duration: planForm.duration || '30 Days Access',
        price: Number(planForm.price),
        originalPrice: Number(planForm.originalPrice || planForm.price * 5),
        badge: planForm.badge || null,
        inviteLink: planForm.inviteLink || 'https://www.canva.com/brand/join?token=INVITE_TEAM_TOKEN',
        features: formattedFeatures.length > 0 ? formattedFeatures : ['Full Canva Pro Access', 'Instant Email Delivery']
      };

      if (currentType === 'update_plan' && editingPlan) {
        await updatePlan(editingPlan.id, payload);
        const updatedPlans = await fetchPlans();
        setPlans(updatedPlans);
        setIsPlanModalOpen(false);
        setResultModal({
          isOpen: true,
          status: 'success',
          title: 'Plan Updated Successfully!',
          message: `Plan '${planForm.name}' for ₹${planForm.price} has been updated in database.`
        });
      } else {
        await createPlan(payload);
        const updatedPlans = await fetchPlans();
        setPlans(updatedPlans);
        setIsPlanModalOpen(false);
        setResultModal({
          isOpen: true,
          status: 'success',
          title: 'New Plan Created Successfully!',
          message: `Plan '${planForm.name}' for ₹${planForm.price} is now live on your storefront!`
        });
      }
    } else if (currentType === 'delete_plan') {
      await deletePlan(currentId);
      const updatedPlans = await fetchPlans();
      setPlans(updatedPlans);
      setResultModal({
        isOpen: true,
        status: 'success',
        title: 'Plan Deleted Successfully!',
        message: `Plan '${currentPayload?.name || 'Selected plan'}' was permanently removed.`
      });
    } else if (currentType === 'delete_activation') {
      await deleteActivation(currentId);
      const updatedActivations = await fetchActivations();
      setActivations(updatedActivations);
      setResultModal({
        isOpen: true,
        status: 'success',
        title: 'Order Record Removed!',
        message: `Customer order history for '${currentPayload?.email || 'customer'}' was deleted.`
      });
    } else if (currentType === 'logout') {
      if (onLogout) onLogout();
    }
  };

  const handleCopyLink = (id, link) => {
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className={embedded ? "space-y-5 w-full text-slate-100" : "min-h-screen bg-[#07080D] text-slate-100 p-3 sm:p-8 space-y-5 sm:space-y-8 max-w-7xl mx-auto"}>

      {/* Toast Banner */}
      {toast.isOpen && (
        <div className="fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl glass-panel border border-cyan-500/40 text-cyan-300 text-xs font-bold shadow-2xl animate-fade-in flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>{toast.message}</span>
        </div>
      )}


      {/* Navigation Tabs Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-2 rounded-2xl border border-white/10">
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('plans')}
            className={`shrink-0 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-heading font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${activeTab === 'plans'
              ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
          >
            <Layers className="w-4 h-4 shrink-0" />
            <span>Plans ({plans.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`shrink-0 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-heading font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${activeTab === 'users'
              ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>Activations ({activations.length})</span>
          </button>


        </div>

        {activeTab === 'plans' && (
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-1 sm:pt-0 border-t sm:border-t-0 border-white/5">
            <button
              onClick={handleOpenAddPlan}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 font-bold text-xs text-white flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Insert New Plan</span>
            </button>
          </div>
        )}
      </div>

      {/* TAB 1: MANAGE CANVA PLANS */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="glass-card rounded-2xl p-6 border border-white/10 hover:border-purple-500/40 relative flex flex-col justify-between space-y-4"
              >
                {plan.badge && (
                  <span className="absolute -top-3 left-5 px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-600 text-white shadow-md">
                    {plan.badge}
                  </span>
                )}

                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-heading font-extrabold text-lg text-white">{plan.name}</h3>
                      <p className="text-xs text-slate-400">{plan.duration}</p>
                    </div>
                    <span className="font-heading font-black text-2xl text-cyan-300">₹{plan.price}</span>
                  </div>

                  <div className="text-xs text-slate-400">
                    Original Price: <span className="line-through">₹{plan.originalPrice}</span>
                  </div>

                  {/* Configured Team Invite Link Display */}
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-purple-500/30 text-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-400 font-bold text-[10px] uppercase">
                      <span className="flex items-center gap-1 text-cyan-300">
                        <LinkIcon className="w-3 h-3 text-cyan-400" /> Configured Invite Link
                      </span>
                      <button
                        onClick={() => handleCopyLink(plan.id, plan.inviteLink)}
                        className="text-cyan-400 hover:text-white flex items-center gap-0.5 cursor-pointer"
                      >
                        {copiedId === plan.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedId === plan.id ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <p className="text-[11px] font-mono text-slate-300 truncate bg-slate-950 p-1.5 rounded border border-white/5">
                      {plan.inviteLink || 'https://www.canva.com/brand/join?token=INVITE_TOKEN'}
                    </p>
                  </div>

                  <div className="space-y-1.5 pt-1 text-xs text-slate-300">
                    <p className="font-bold text-slate-400 text-[11px]">Included Features:</p>
                    {(Array.isArray(plan.features) ? plan.features : []).slice(0, 3).map((f, i) => (
                      <p key={i} className="truncate text-slate-300">• {f}</p>
                    ))}
                  </div>

                  {(Array.isArray(plan.not_included || plan.notIncluded) && (plan.not_included || plan.notIncluded).length > 0) && (
                    <div className="space-y-1 text-xs text-rose-300/80">
                      <p className="font-bold text-rose-400 text-[11px]">Not Included:</p>
                      {(plan.not_included || plan.notIncluded).slice(0, 2).map((nf, i) => (
                        <p key={i} className="truncate text-rose-300/70">✕ {nf}</p>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-white/10">
                  <button
                    onClick={() => handleOpenEditPlan(plan)}
                    className="flex-1 py-2 px-3 rounded-xl bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/40 text-purple-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" /> Edit Plan & Link
                  </button>
                  <button
                    onClick={() => requestDeletePlan(plan)}
                    className="py-2 px-3 rounded-xl bg-rose-600/20 hover:bg-rose-600/40 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: USER ACTIVATIONS LIST */}
      {activeTab === 'users' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search user email, plan or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div className="flex items-center gap-3 justify-between sm:justify-end">
              <p className="text-xs text-slate-400 font-medium">Showing {filteredActivations.length} customer activations</p>
              <button
                onClick={handleOpenCreateActivation}
                className="px-3.5 py-2 rounded-xl btn-futuristic font-bold text-xs text-white flex items-center gap-1.5 cursor-pointer shadow-lg shrink-0"
              >
                <Plus className="w-4 h-4" /> Add Activation Record
              </button>
            </div>
          </div>

          <div className="glass-card rounded-2xl border border-white/10 overflow-hidden overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider font-bold border-b border-white/10">
                <tr>
                  <th className="p-4">Customer Email</th>
                  <th className="p-4">Purchased Plan</th>
                  <th className="p-4">Amount Paid</th>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Payment Method</th>
                  <th className="p-4">Dispatched Invite Link</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredActivations
                  .slice((activationsPage - 1) * itemsPerPage, activationsPage * itemsPerPage)
                  .map((item) => (
                    <tr key={item.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-white">{item.email}</div>
                        {item.phone && (
                          <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono mt-0.5">
                            <Phone className="w-3 h-3 shrink-0" />
                            <span>{item.phone}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-cyan-300 font-semibold">{item.planName}</td>
                      <td className="p-4 font-heading font-black text-emerald-400 text-sm">₹{item.amount}</td>
                      <td className="p-4 text-slate-400 font-mono text-[11px]">{item.timestamp}</td>
                      <td className="p-4 text-slate-300">{item.paymentMethod || 'UPI QR'}</td>
                      <td className="p-4">
                        <button
                          onClick={() => handleCopyLink(item.id, item.inviteLink)}
                          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-cyan-300 font-semibold inline-flex items-center gap-1 cursor-pointer"
                        >
                          {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedId === item.id ? 'Copied' : 'Copy Link'}</span>
                        </button>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditActivation(item)}
                            className="p-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 border border-cyan-500/30 cursor-pointer transition-all"
                            title="Edit Activation"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => requestDeleteActivation(item)}
                            className="p-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30 cursor-pointer transition-all"
                            title="Delete Order"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {filteredActivations.length > itemsPerPage && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-white/10 text-xs">
              <div className="text-slate-400 font-medium">
                Showing <span className="font-bold text-white">{(activationsPage - 1) * itemsPerPage + 1}</span> to{' '}
                <span className="font-bold text-white">{Math.min(activationsPage * itemsPerPage, filteredActivations.length)}</span> of{' '}
                <span className="font-bold text-cyan-300">{filteredActivations.length}</span> entries
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  disabled={activationsPage === 1}
                  onClick={() => setActivationsPage(prev => Math.max(prev - 1, 1))}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 font-bold flex items-center gap-1 cursor-pointer transition-all border border-white/10"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Previous
                </button>

                {Array.from({ length: Math.ceil(filteredActivations.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setActivationsPage(page)}
                    className={`w-8 h-8 rounded-lg font-bold text-xs transition-all cursor-pointer border ${activationsPage === page
                        ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-cyan-400 shadow-md'
                        : 'bg-slate-800 text-slate-400 border-white/10 hover:bg-slate-700 hover:text-white'
                      }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  disabled={activationsPage >= Math.ceil(filteredActivations.length / itemsPerPage)}
                  onClick={() => setActivationsPage(prev => Math.min(prev + 1, Math.ceil(filteredActivations.length / itemsPerPage)))}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 font-bold flex items-center gap-1 cursor-pointer transition-all border border-white/10"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}


      {/* MODAL FOR INSERT / EDIT PLAN WITH INVITATION LINK */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
          <div
            className="fixed inset-0 bg-[#030712]/80 backdrop-blur-md z-50"
            onClick={() => setIsPlanModalOpen(false)}
          />

          <div className="relative w-full max-w-lg glass-panel rounded-2xl sm:rounded-3xl border border-purple-500/40 p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-2xl my-auto max-h-[92vh] overflow-y-auto z-[60]">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-heading font-bold text-base sm:text-lg text-white flex items-center gap-2 truncate">
                <Crown className="w-5 h-5 text-amber-400 shrink-0" />
                <span className="truncate">{editingPlan ? 'Edit Plan & Invite Link' : 'Insert Plan with Invite Link'}</span>
              </h3>
              <button
                onClick={() => setIsPlanModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-3.5 sm:space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Plan Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1 Year Canva Pro"
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-white focus:outline-none focus:border-cyan-400 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-cyan-300 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1 truncate">
                    <LinkIcon className="w-3.5 h-3.5 text-cyan-400 shrink-0" /> Canva Team Invitation Link *
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30 shrink-0">
                    ⚡ Editable
                  </span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="https://www.canva.com/brand/join?token=YOUR_CANVA_TEAM_TOKEN"
                  value={planForm.inviteLink}
                  onChange={(e) => setPlanForm({ ...planForm, inviteLink: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-cyan-300 font-mono text-[11px] sm:text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Plan Price (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="199"
                    value={planForm.price}
                    onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-white focus:outline-none focus:border-cyan-400 text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Original Price (₹)</label>
                  <input
                    type="number"
                    placeholder="499"
                    value={planForm.originalPrice}
                    onChange={(e) => setPlanForm({ ...planForm, originalPrice: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-white focus:outline-none focus:border-cyan-400 text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Duration Label</label>
                  <input
                    type="text"
                    placeholder="365 Days Access"
                    value={planForm.duration}
                    onChange={(e) => setPlanForm({ ...planForm, duration: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-white focus:outline-none focus:border-cyan-400 text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Badge Tag</label>
                  <input
                    type="text"
                    placeholder="BEST SELLER"
                    value={planForm.badge}
                    onChange={(e) => setPlanForm({ ...planForm, badge: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-white focus:outline-none focus:border-cyan-400 text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Features (Comma separated)</label>
                <textarea
                  rows="3"
                  placeholder="Full Canva Pro Unlock, Magic Studio AI Access, 100M+ Stock Assets"
                  value={planForm.features}
                  onChange={(e) => setPlanForm({ ...planForm, features: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-white focus:outline-none focus:border-cyan-400 text-xs sm:text-sm"
                ></textarea>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">
                  <span>Not Included Features (Comma separated)</span>
                  <span className="text-[10px] text-rose-400 font-normal ml-2">Optional - not available in this plan</span>
                </label>
                <textarea
                  rows="2"
                  placeholder="Brand Kit & Custom Fonts, 100GB Cloud Storage"
                  value={planForm.not_included}
                  onChange={(e) => setPlanForm({ ...planForm, not_included: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-white focus:outline-none focus:border-rose-400/60 text-xs sm:text-sm"
                ></textarea>
              </div>

              {planError && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">
                  {planError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={isSavingPlan}
                  onClick={() => setIsPlanModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold cursor-pointer disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingPlan}
                  className="px-5 py-2 rounded-xl btn-futuristic font-bold text-white shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isSavingPlan ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{editingPlan ? 'Saving Changes...' : 'Creating Plan...'}</span>
                    </>
                  ) : (
                    <span>{editingPlan ? 'Save Changes' : 'Insert Plan'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL FOR INSERT / EDIT CUSTOMER ACTIVATION */}
      {isActivationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div
            className="fixed inset-0 bg-[#030712]/80 backdrop-blur-md z-50"
            onClick={() => setIsActivationModalOpen(false)}
          />

          <div className="relative w-full max-w-lg glass-panel rounded-2xl sm:rounded-3xl border border-cyan-500/40 p-4 sm:p-7 space-y-4 shadow-2xl my-auto z-[60]">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-heading font-extrabold text-base sm:text-lg text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <span>{editingActivation ? 'Edit Customer Activation' : 'Add New Customer Activation'}</span>
              </h3>
              <button
                onClick={() => setIsActivationModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveActivation} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Customer Canva Email *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. user@gmail.com"
                  value={activationForm.email}
                  onChange={(e) => setActivationForm({ ...activationForm, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-white focus:outline-none focus:border-cyan-400 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">WhatsApp / Phone Number</label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={activationForm.phone}
                  onChange={(e) => setActivationForm({ ...activationForm, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-white focus:outline-none focus:border-cyan-400 text-xs sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Plan Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1 Year Canva Pro"
                    value={activationForm.planName}
                    onChange={(e) => setActivationForm({ ...activationForm, planName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-white focus:outline-none focus:border-cyan-400 text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Amount Paid (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 199"
                    value={activationForm.amount}
                    onChange={(e) => setActivationForm({ ...activationForm, amount: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-white focus:outline-none focus:border-cyan-400 text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Payment Method</label>
                <input
                  type="text"
                  placeholder="e.g. Manual Admin Grant, Razorpay UPI"
                  value={activationForm.paymentMethod}
                  onChange={(e) => setActivationForm({ ...activationForm, paymentMethod: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-white focus:outline-none focus:border-cyan-400 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Canva Pro Team Invite Link *</label>
                <input
                  type="url"
                  required
                  placeholder="https://www.canva.com/brand/join?token=..."
                  value={activationForm.inviteLink}
                  onChange={(e) => setActivationForm({ ...activationForm, inviteLink: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-white focus:outline-none focus:border-cyan-400 text-xs sm:text-sm"
                />
              </div>

              {activationError && (
                <p className="text-xs text-rose-400 font-semibold">{activationError}</p>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsActivationModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingActivation}
                  className="px-5 py-2 rounded-xl btn-futuristic font-bold text-white shadow-lg cursor-pointer"
                >
                  {isSavingActivation ? 'Saving...' : (editingActivation ? 'Save Changes' : 'Create Activation')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHANGE PASSWORD MODAL */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
          <div
            className="fixed inset-0 bg-[#030712]/80 backdrop-blur-md z-50"
            onClick={() => setIsPasswordModalOpen(false)}
          />

          <div className="relative w-full max-w-md glass-panel rounded-2xl sm:rounded-3xl border border-purple-500/40 p-4 sm:p-6 space-y-4 shadow-2xl my-auto z-[60]">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="font-heading font-bold text-sm sm:text-base text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-400" />
                <span>Change Admin Password</span>
              </h3>
              <button onClick={() => setIsPasswordModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleChangePasswordSubmit} className="space-y-3 sm:space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Current Password *</label>
                <input
                  type="password"
                  required
                  value={passwordForm.oldPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-white focus:outline-none focus:border-cyan-400 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">New Password *</label>
                <input
                  type="password"
                  required
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-white focus:outline-none focus:border-cyan-400 text-xs sm:text-sm"
                />
              </div>

              {passwordError && (
                <p className="text-xs text-rose-400 font-semibold">{passwordError}</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPassword}
                  className="px-5 py-2 rounded-xl btn-futuristic font-bold text-white shadow-md cursor-pointer"
                >
                  {isSubmittingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="fixed inset-0 bg-[#030712]/80 backdrop-blur-md" onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })} />
          <div className="relative w-full max-w-md glass-panel rounded-2xl sm:rounded-3xl border border-purple-500/40 p-4 sm:p-6 space-y-3 sm:space-y-4 shadow-2xl z-[60]">
            <h3 className="font-heading font-extrabold text-base sm:text-lg text-white">{confirmModal.title}</h3>
            <p className="text-xs text-slate-300">{confirmModal.details}</p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-bold text-xs shadow-md cursor-pointer"
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESULT MODAL */}
      {resultModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="fixed inset-0 bg-[#030712]/80 backdrop-blur-md" onClick={() => setResultModal({ ...resultModal, isOpen: false })} />
          <div className="relative w-full max-w-md glass-panel rounded-2xl sm:rounded-3xl border border-emerald-500/40 p-4 sm:p-6 space-y-3 sm:space-y-4 shadow-2xl z-[60]">
            <h3 className="font-heading font-extrabold text-base sm:text-lg text-emerald-400">{resultModal.title}</h3>
            <p className="text-xs text-slate-300">{resultModal.message}</p>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setResultModal({ ...resultModal, isOpen: false })}
                className="px-5 py-2 rounded-xl bg-white/10 text-white font-bold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
