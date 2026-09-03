import { getApiUrl } from '../config';

// Generic Fetch Wrapper for SkillVault Unified Canva API
async function apiFetch(endpoint, options = {}) {
  try {
    const url = getApiUrl(`/api/canva${endpoint}`);
    const adminToken = typeof window !== 'undefined' ? localStorage.getItem('sv_admin_token') : null;
    const userToken = typeof window !== 'undefined' ? localStorage.getItem('sv_user_token') : null;
    const token = adminToken || userToken;

    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers
    };

    const res = await fetch(url, {
      ...options,
      headers
    });

    const parsed = await res.json().catch(() => null);
    if (res.ok) {
      return parsed;
    }
    return parsed || { success: false, error: `Server returned HTTP status ${res.status}` };
  } catch (err) {
    console.error(`Canva API Fetch Error [${endpoint}]:`, err);
  }
  return null;
}

// 1. PLANS API
export async function fetchPlans() {
  const data = await apiFetch('/plans');
  return (data && data.plans) ? data.plans : [];
}

export async function createPlan(planData) {
  const data = await apiFetch('/plans', {
    method: 'POST',
    body: JSON.stringify(planData)
  });
  return (data && data.plan) ? data.plan : null;
}

export async function updatePlan(id, planData) {
  const data = await apiFetch(`/plans/${id}`, {
    method: 'PUT',
    body: JSON.stringify(planData)
  });
  return !!(data && data.success);
}

export async function deletePlan(id) {
  const data = await apiFetch(`/plans/${id}`, {
    method: 'DELETE'
  });
  return !!(data && data.success);
}

// 2. ACTIVATIONS API
export async function fetchActivations() {
  const data = await apiFetch('/activations');
  return (data && data.activations) ? data.activations : [];
}

export async function createActivation(activationRecord) {
  const data = await apiFetch('/activations', {
    method: 'POST',
    body: JSON.stringify(activationRecord)
  });
  return (data && data.activation) ? data.activation : null;
}

export async function updateActivation(id, activationRecord) {
  const data = await apiFetch(`/activations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(activationRecord)
  });
  return (data && data.success) ? (data.activation || true) : null;
}

export async function deleteActivation(id) {
  const data = await apiFetch(`/activations/${id}`, {
    method: 'DELETE'
  });
  return !!(data && data.success);
}

// 3. ADMIN AUTHENTICATION API
export async function authenticateAdmin(username, password) {
  const data = await apiFetch('/admins/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
  if (data && data.token && typeof window !== 'undefined') {
    localStorage.setItem('sv_admin_token', data.token);
  }
  return (data && data.admin) ? data.admin : null;
}

export async function changeAdminPassword(username, oldPassword, newPassword) {
  const data = await apiFetch('/admins/change-password', {
    method: 'POST',
    body: JSON.stringify({ username, oldPassword, newPassword })
  });
  if (data && data.success) {
    return { success: true, message: data.message };
  }
  return { success: false, error: data?.error || 'Failed to update password' };
}

// 4. RAZORPAY / PAYMENTS API
export async function createRazorpayOrder(planId, customerEmail, customerPhone = '', customerName = '') {
  const data = await apiFetch('/payments/create-order', {
    method: 'POST',
    body: JSON.stringify({ planId, customerEmail, customerPhone, customerName })
  });
  if (data && data.success) return data;

  return {
    success: false,
    error: data?.error || 'Failed to create payment order'
  };
}

export async function verifyRazorpayPayment(payload) {
  const data = await apiFetch('/payments/verify', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  if (data && data.success) return { success: true, ...data };

  return {
    success: false,
    error: data?.error || 'Payment verification failed'
  };
}

export async function fetchPaymentAnalytics() {
  const data = await apiFetch('/payments');
  if (data && data.success) return { analytics: data.analytics, payments: data.payments };

  return {
    analytics: {
      totalSales: 0,
      platformCommission: 0,
      adminEarnings: 0,
      totalOrders: 0,
      successfulCount: 0,
      pendingCount: 0,
      failedCount: 0
    },
    payments: []
  };
}
