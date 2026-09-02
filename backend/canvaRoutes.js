import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { createClient } = require('@supabase/supabase-js');

const router = Router();

// Initialize Supabase Client for Canva Pro Store
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';
const isSupabaseConfigured = supabaseUrl.includes('supabase.co') && supabaseKey.length > 20;

let supabase = null;
if (isSupabaseConfigured) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('🎨 Connected to Canva Supabase Cloud Database');
  } catch (err) {
    console.error('⚠️ Canva Supabase connection error:', err.message);
  }
} else {
  console.log('⚠️ Canva Supabase credentials not set or invalid — using in-memory fallback');
}

// In-Memory Fallback Storage
let mockPlans = [
  {
    id: 'plan_1y',
    name: '1 Year Canva Pro',
    duration: '365 Days Access',
    price: 199,
    originalPrice: 499,
    badge: 'BEST SELLER',
    inviteLink: 'https://www.canva.com/brand/join?token=PRO_ANNUAL_INVITE',
    features: ['100M+ Premium Stock Photos & Videos', 'Magic Studio AI Tools Unlocked', 'Remove Background in 1 Click', '100GB Cloud Storage', 'Instant Email Delivery'],
    is_popular: true
  },
  {
    id: 'plan_life',
    name: 'Lifetime Canva Pro',
    duration: 'Lifetime Access',
    price: 399,
    originalPrice: 999,
    badge: 'VIP VALUE',
    inviteLink: 'https://www.canva.com/brand/join?token=LIFETIME_VIP_INVITE',
    features: ['Lifetime Unrestricted Pro Permissions', 'Unlimited Premium Asset Downloads', 'All Future Canva AI Studio Updates', 'Brand Kit & Custom Fonts Support', 'Priority 24/7 Support'],
    is_popular: false
  },
  {
    id: 'plan_1m',
    name: '1 Month Canva Pro',
    duration: '30 Days Access',
    price: 99,
    originalPrice: 299,
    badge: 'STARTER',
    inviteLink: 'https://www.canva.com/brand/join?token=STARTER_30D_INVITE',
    features: ['100M+ Stock Media Unlocked', 'Magic Studio & AI Writer', '1-Click Background Remover', 'Instant Team Invitation'],
    is_popular: false
  }
];

let mockActivations = [
  {
    id: 'act_101',
    email: 'rahul.sharma@gmail.com',
    planName: '1 Year Canva Pro',
    amount: 199,
    timestamp: new Date().toLocaleString(),
    paymentMethod: 'UPI QR',
    inviteLink: 'https://www.canva.com/brand/join?token=PRO_ANNUAL_INVITE'
  }
];

// Mock admin default bcrypt hash for 'admin123'
let mockAdminHash = bcrypt.hashSync('admin123', 10);
let mockAdmin = {
  id: 'admin_1',
  username: 'admin',
  passwordHash: mockAdminHash,
  name: 'Primary Owner'
};

// ==========================================
// 1. Diagnostic Database Health Check
// ==========================================
const handleDbCheck = async (req, res) => {
  const diagnostics = {
    configured: isSupabaseConfigured,
    supabaseUrl: supabaseUrl || 'NOT_SET',
    keyLength: supabaseKey ? supabaseKey.length : 0,
    keyPrefix: supabaseKey ? supabaseKey.substring(0, 10) + '...' : 'NONE',
    connectionStatus: 'UNKNOWN',
    error: null,
    tables: {
      plans: { accessible: false, count: 0, error: null },
      activations: { accessible: false, count: 0, error: null },
      admin: { accessible: false, count: 0, error: null }
    }
  };

  if (!supabase) {
    diagnostics.connectionStatus = 'DISCONNECTED (Client Not Initialized)';
    diagnostics.error = 'Supabase client is null or credentials missing in .env';
    return res.status(200).json(diagnostics);
  }

  try {
    const plansResult = await supabase.from('plans').select('*', { count: 'exact' }).limit(5);
    if (plansResult.error) {
      diagnostics.tables.plans.error = plansResult.error.message || plansResult.error;
    } else {
      diagnostics.tables.plans.accessible = true;
      diagnostics.tables.plans.count = plansResult.data ? plansResult.data.length : 0;
    }

    const actResult = await supabase.from('activations').select('*', { count: 'exact' }).limit(5);
    if (actResult.error) {
      diagnostics.tables.activations.error = actResult.error.message || actResult.error;
    } else {
      diagnostics.tables.activations.accessible = true;
      diagnostics.tables.activations.count = actResult.data ? actResult.data.length : 0;
    }

    const adminResult = await supabase.from('admin').select('*', { count: 'exact' }).limit(1);
    if (adminResult.error) {
      diagnostics.tables.admin.error = adminResult.error.message || adminResult.error;
    } else {
      diagnostics.tables.admin.accessible = true;
      diagnostics.tables.admin.count = adminResult.data ? adminResult.data.length : 0;
    }

    if (diagnostics.tables.plans.accessible) {
      diagnostics.connectionStatus = 'CONNECTED & VERIFIED';
    } else {
      diagnostics.connectionStatus = 'CONNECTED_BUT_TABLE_ERROR';
      diagnostics.error = diagnostics.tables.plans.error;
    }
  } catch (err) {
    diagnostics.connectionStatus = 'CONNECTION_FAILED';
    diagnostics.error = err.message;
  }

  return res.status(200).json(diagnostics);
};

router.get('/api/canva/db-check', handleDbCheck);
router.get('/api/db-check', handleDbCheck);

// ==========================================
// 2. Canva Plans CRUD Endpoints
// ==========================================
const getPlansHandler = async (req, res) => {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('plans').select('*').order('price', { ascending: true });
      if (!error && data && data.length > 0) {
        const formatted = data.map(p => ({
          id: p.id,
          name: p.name,
          duration: p.duration,
          price: Number(p.price),
          originalPrice: Number(p.original_price || p.price * 2),
          badge: p.badge,
          inviteLink: p.invite_link,
          features: p.features || [],
          is_popular: !!p.is_popular
        }));
        return res.json({ plans: formatted });
      }
    } catch (e) {
      console.error('Supabase Plans Fetch Error:', e.message);
    }
  }
  return res.json({ plans: mockPlans });
};

const createPlanHandler = async (req, res) => {
  const { name, duration, price, originalPrice, badge, inviteLink, features, is_popular } = req.body;

  if (supabase) {
    try {
      const { data, error } = await supabase.from('plans').insert([{
        name,
        duration: duration || '365 Days Access',
        price: Number(price),
        original_price: Number(originalPrice || price * 2),
        badge: badge || null,
        invite_link: inviteLink || 'https://www.canva.com/brand/join?token=DEFAULT_INVITE',
        features: Array.isArray(features) ? features : [features],
        is_popular: !!is_popular
      }]).select().single();

      if (!error && data) {
        const created = {
          id: data.id,
          name: data.name,
          duration: data.duration,
          price: Number(data.price),
          originalPrice: Number(data.original_price),
          badge: data.badge,
          inviteLink: data.invite_link,
          features: data.features || [],
          is_popular: !!data.is_popular
        };
        return res.json({ success: true, plan: created });
      }
    } catch (e) {
      console.error('Supabase Plan Insert Error:', e.message);
    }
  }

  const newPlan = {
    id: 'plan_' + Date.now(),
    name,
    duration: duration || '365 Days Access',
    price: Number(price),
    originalPrice: Number(originalPrice || price * 2),
    badge: badge || null,
    inviteLink: inviteLink || 'https://www.canva.com/brand/join?token=DEFAULT_INVITE',
    features: Array.isArray(features) ? features : [features],
    is_popular: !!is_popular
  };
  mockPlans.push(newPlan);
  return res.json({ success: true, plan: newPlan });
};

const updatePlanHandler = async (req, res) => {
  const { id } = req.params;
  const { name, duration, price, originalPrice, badge, inviteLink, features, is_popular } = req.body;

  if (supabase) {
    try {
      const { error } = await supabase.from('plans').update({
        name,
        duration,
        price: Number(price),
        original_price: Number(originalPrice),
        badge: badge || null,
        invite_link: inviteLink,
        features: Array.isArray(features) ? features : [features],
        is_popular: !!is_popular
      }).eq('id', id);

      if (!error) return res.json({ success: true });
    } catch (e) {
      console.error('Supabase Plan Update Error:', e.message);
    }
  }

  mockPlans = mockPlans.map(p => p.id === id ? { ...p, ...req.body } : p);
  return res.json({ success: true });
};

const deletePlanHandler = async (req, res) => {
  const { id } = req.params;

  if (supabase) {
    try {
      const { error } = await supabase.from('plans').delete().eq('id', id);
      if (!error) return res.json({ success: true });
    } catch (e) {
      console.error('Supabase Plan Delete Error:', e.message);
    }
  }

  mockPlans = mockPlans.filter(p => p.id !== id);
  return res.json({ success: true });
};

// Register Plans routes
router.get('/api/canva/plans', getPlansHandler);
router.get('/api/plans', getPlansHandler);

router.post('/api/canva/plans', createPlanHandler);
router.post('/api/plans', createPlanHandler);

router.put('/api/canva/plans/:id', updatePlanHandler);
router.put('/api/plans/:id', updatePlanHandler);

router.delete('/api/canva/plans/:id', deletePlanHandler);
router.delete('/api/plans/:id', deletePlanHandler);

// ==========================================
// 3. Canva Activations (Orders) Endpoints
// ==========================================
const getActivationsHandler = async (req, res) => {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('activations').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        const formatted = data.map(a => ({
          id: a.id,
          email: a.email,
          planName: a.plan_name,
          amount: Number(a.amount),
          paymentMethod: a.payment_method || 'UPI QR',
          inviteLink: a.invite_link,
          timestamp: new Date(a.created_at).toLocaleString()
        }));
        return res.json({ activations: formatted });
      }
    } catch (e) {
      console.error('Supabase Activations Fetch Error:', e.message);
    }
  }

  return res.json({ activations: mockActivations });
};

const createActivationHandler = async (req, res) => {
  const { email, planName, amount, paymentMethod, inviteLink } = req.body;

  if (supabase) {
    try {
      const { data, error } = await supabase.from('activations').insert([{
        email,
        plan_name: planName,
        amount: Number(amount),
        payment_method: paymentMethod || 'UPI QR',
        invite_link: inviteLink || 'https://www.canva.com/brand/join?token=DEFAULT_INVITE'
      }]).select().single();

      if (!error && data) {
        const created = {
          id: data.id,
          email: data.email,
          planName: data.plan_name,
          amount: Number(data.amount),
          paymentMethod: data.payment_method,
          inviteLink: data.invite_link,
          timestamp: new Date(data.created_at).toLocaleString()
        };
        return res.json({ success: true, activation: created });
      }
    } catch (e) {
      console.error('Supabase Activation Create Error:', e.message);
    }
  }

  const newAct = {
    id: 'act_' + Date.now(),
    email,
    planName,
    amount: Number(amount),
    paymentMethod: paymentMethod || 'UPI QR',
    inviteLink: inviteLink || 'https://www.canva.com/brand/join?token=DEFAULT_INVITE',
    timestamp: new Date().toLocaleString()
  };
  mockActivations.unshift(newAct);
  return res.json({ success: true, activation: newAct });
};

const deleteActivationHandler = async (req, res) => {
  const { id } = req.params;

  if (supabase) {
    try {
      const { error } = await supabase.from('activations').delete().eq('id', id);
      if (!error) return res.json({ success: true });
    } catch (e) {
      console.error('Supabase Activation Delete Error:', e.message);
    }
  }

  mockActivations = mockActivations.filter(a => a.id !== id);
  return res.json({ success: true });
};

router.get('/api/canva/activations', getActivationsHandler);
router.get('/api/activations', getActivationsHandler);

router.post('/api/canva/activations', createActivationHandler);
router.post('/api/activations', createActivationHandler);

router.delete('/api/canva/activations/:id', deleteActivationHandler);
router.delete('/api/activations/:id', deleteActivationHandler);

// ==========================================
// 4. Canva Admin Authentication Endpoints
// ==========================================
const adminLoginHandler = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Username and password required' });
  }

  const cleanUsername = username.trim();
  const cleanPassword = password.trim();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('admin')
        .select('*')
        .eq('username', cleanUsername)
        .single();

      if (!error && data) {
        let isMatch = false;
        if (data.password.startsWith('$2a$') || data.password.startsWith('$2b$')) {
          isMatch = await bcrypt.compare(cleanPassword, data.password);
        } else {
          isMatch = (cleanPassword === data.password.trim());
          if (isMatch) {
            const hashed = await bcrypt.hash(cleanPassword, 10);
            await supabase.from('admin').update({ password: hashed }).eq('id', data.id);
          }
        }

        if (isMatch) {
          return res.json({
            success: true,
            admin: {
              id: data.id,
              name: data.name || 'Primary Owner',
              username: data.username,
              role: 'Owner'
            }
          });
        } else {
          return res.status(401).json({ success: false, error: 'Invalid username or password' });
        }
      }
    } catch (e) {
      console.error('Supabase Admin Login Error:', e.message);
    }
  }

  const fallbackMatch = (cleanUsername === mockAdmin.username) && 
    (await bcrypt.compare(cleanPassword, mockAdmin.passwordHash));

  if (fallbackMatch) {
    return res.json({
      success: true,
      admin: {
        id: mockAdmin.id,
        name: mockAdmin.name,
        username: mockAdmin.username,
        role: 'Owner'
      }
    });
  }

  return res.status(401).json({ success: false, error: 'Invalid username or password' });
};

const adminChangePasswordHandler = async (req, res) => {
  const { username, oldPassword, newPassword } = req.body;

  if (!username || !oldPassword || !newPassword) {
    return res.status(400).json({ success: false, error: 'All fields required' });
  }

  const cleanUsername = username.trim();
  const cleanOldPassword = oldPassword.trim();
  const cleanNewPassword = newPassword.trim();

  if (supabase) {
    try {
      const { data: match, error: fetchErr } = await supabase
        .from('admin')
        .select('*')
        .eq('username', cleanUsername)
        .single();

      if (!fetchErr && match) {
        let isOldMatch = false;
        if (match.password.startsWith('$2a$') || match.password.startsWith('$2b$')) {
          isOldMatch = await bcrypt.compare(cleanOldPassword, match.password);
        } else {
          isOldMatch = (cleanOldPassword === match.password.trim());
        }

        if (!isOldMatch) {
          return res.status(400).json({ success: false, error: 'Incorrect old password' });
        }

        const hashedNewPassword = await bcrypt.hash(cleanNewPassword, 10);
        const { error: updateErr } = await supabase
          .from('admin')
          .update({ password: hashedNewPassword })
          .eq('id', match.id);

        if (updateErr) {
          console.error('Supabase Admin Password Update Error:', updateErr.message);
          return res.status(500).json({ success: false, error: 'Failed to update database: ' + updateErr.message });
        }

        mockAdmin.passwordHash = hashedNewPassword;
        return res.json({ success: true, message: 'Password updated successfully in database' });
      }
    } catch (e) {
      console.error('Supabase Change Password Error:', e.message);
    }
  }

  const isMockOldMatch = await bcrypt.compare(cleanOldPassword, mockAdmin.passwordHash);

  if (isMockOldMatch) {
    mockAdmin.passwordHash = await bcrypt.hash(cleanNewPassword, 10);
    return res.json({ success: true, message: 'Password updated successfully' });
  }

  return res.status(400).json({ success: false, error: 'Incorrect old password' });
};

router.post('/api/canva/admins/login', adminLoginHandler);
router.post('/api/admins/login', adminLoginHandler);

router.post('/api/canva/admins/change-password', adminChangePasswordHandler);
router.post('/api/admins/change-password', adminChangePasswordHandler);

// ==========================================
// 5. Canva Payments & Analytics Endpoints
// ==========================================
const paymentsAnalyticsHandler = async (req, res) => {
  let activationsList = mockActivations;

  if (supabase) {
    try {
      const { data } = await supabase.from('activations').select('*');
      if (data) activationsList = data;
    } catch (e) {}
  }

  const totalSales = activationsList.reduce((sum, a) => sum + Number(a.amount || 0), 0);
  return res.json({
    success: true,
    analytics: {
      totalSales,
      platformCommission: 0,
      adminEarnings: totalSales,
      totalOrders: activationsList.length,
      successfulCount: activationsList.length,
      pendingCount: 0,
      failedCount: 0
    },
    payments: []
  });
};

const createPaymentOrderHandler = (req, res) => {
  const { planId, customerEmail } = req.body;
  return res.json({
    success: true,
    orderId: 'order_' + Date.now(),
    amount: 199,
    currency: 'INR',
    razorpayKeyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock'
  });
};

const verifyPaymentHandler = async (req, res) => {
  const { customerEmail, planId } = req.body;
  let inviteLink = 'https://www.canva.com/brand/join?token=PRO_INVITE_DEFAULT';

  if (supabase) {
    try {
      const { data } = await supabase.from('plans').select('*').limit(1);
      if (data && data[0] && data[0].invite_link) {
        inviteLink = data[0].invite_link;
      }
      
      await supabase.from('activations').insert([{
        email: customerEmail,
        plan_name: 'Canva Pro Access',
        amount: 199,
        payment_method: 'Razorpay UPI',
        invite_link: inviteLink
      }]);
    } catch (e) {}
  }

  return res.json({ success: true, inviteLink });
};

router.get('/api/canva/payments', paymentsAnalyticsHandler);
router.get('/api/payments', paymentsAnalyticsHandler);

router.post('/api/canva/payments/create-order', createPaymentOrderHandler);
router.post('/api/payments/create-order', createPaymentOrderHandler);

router.post('/api/canva/payments/verify', verifyPaymentHandler);
router.post('/api/payments/verify', verifyPaymentHandler);

export default router;
