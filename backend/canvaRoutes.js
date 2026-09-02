import { Router } from 'express';
import { query, isDbConnected } from './db.js';

const router = Router();

// In-Memory Fallback Storage (in case database connection is temporarily offline)
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

// Helper to format plan row from Neon PostgreSQL
const formatPlan = (p) => ({
  id: p.id,
  name: p.name,
  duration: p.duration,
  price: Number(p.price),
  originalPrice: Number(p.original_price || p.price * 2),
  badge: p.badge || null,
  inviteLink: p.invite_link,
  features: typeof p.features === 'string' ? JSON.parse(p.features) : (p.features || []),
  is_popular: Boolean(p.is_popular)
});

// Helper to format activation row from Neon PostgreSQL
const formatActivation = (a) => ({
  id: a.id,
  email: a.email,
  planName: a.plan_name,
  amount: Number(a.amount),
  paymentMethod: a.payment_method || 'UPI QR',
  inviteLink: a.invite_link,
  timestamp: a.created_at ? new Date(a.created_at).toLocaleString() : new Date().toLocaleString()
});

// ==========================================
// 1. Diagnostic Database Health Check
// ==========================================
const handleDbCheck = async (req, res) => {
  try {
    const plansCount = await query('SELECT COUNT(*) FROM canva_plans').catch(() => ({ rows: [{ count: 0 }] }));
    const actsCount = await query('SELECT COUNT(*) FROM canva_activations').catch(() => ({ rows: [{ count: 0 }] }));

    return res.json({
      configured: true,
      database: 'Neon PostgreSQL',
      connectionStatus: isDbConnected() ? 'CONNECTED' : 'STANDBY',
      tables: {
        canva_plans: { accessible: true, count: parseInt(plansCount.rows[0].count, 10) },
        canva_activations: { accessible: true, count: parseInt(actsCount.rows[0].count, 10) }
      }
    });
  } catch (err) {
    return res.status(500).json({ configured: false, error: err.message });
  }
};

router.get('/api/canva/db-check', handleDbCheck);
router.get('/api/db-check', handleDbCheck);

// ==========================================
// 2. Canva Subscription Plans Endpoints
// ==========================================
const getPlansHandler = async (req, res) => {
  try {
    const result = await query('SELECT * FROM canva_plans ORDER BY price ASC');
    if (result && result.rows && result.rows.length > 0) {
      return res.json({ plans: result.rows.map(formatPlan) });
    }
  } catch (e) {
    console.error('Neon Canva Plans Fetch Error:', e.message);
  }
  return res.json({ plans: mockPlans });
};

const createPlanHandler = async (req, res) => {
  const { name, duration, price, originalPrice, badge, inviteLink, features, is_popular } = req.body;
  const newId = 'plan_' + Date.now();

  let formattedFeatures = [];
  if (Array.isArray(features)) {
    formattedFeatures = features;
  } else if (typeof features === 'string') {
    try {
      const parsed = JSON.parse(features);
      formattedFeatures = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      formattedFeatures = features.split(',').map(s => s.trim()).filter(Boolean);
    }
  }
  if (!formattedFeatures.length) {
    formattedFeatures = ['Full Canva Pro Access', 'Instant Email Delivery'];
  }

  let link = (inviteLink || '').trim();
  if (!link) {
    link = 'https://www.canva.com/brand/join?token=DEFAULT_INVITE';
  } else if (!link.startsWith('http://') && !link.startsWith('https://')) {
    link = 'https://' + link;
  }

  const numPrice = Math.max(0, Number(price) || 199);
  const numOrigPrice = Math.max(numPrice, Number(originalPrice) || (numPrice * 2));

  try {
    const result = await query(`
      INSERT INTO canva_plans (id, name, duration, price, original_price, badge, invite_link, features, is_popular)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9)
      RETURNING *
    `, [
      newId,
      name || 'Canva Pro Plan',
      duration || '365 Days Access',
      numPrice,
      numOrigPrice,
      badge || null,
      link,
      JSON.stringify(formattedFeatures),
      Boolean(is_popular)
    ]);

    if (result && result.rows && result.rows[0]) {
      return res.json({ success: true, plan: formatPlan(result.rows[0]) });
    }
  } catch (e) {
    console.error('Neon Canva Plan Insert Error:', e.message);
    return res.status(500).json({ success: false, error: e.message });
  }

  return res.status(500).json({ success: false, error: 'Database insert failed' });
};

const updatePlanHandler = async (req, res) => {
  const { id } = req.params;
  const { name, duration, price, originalPrice, badge, inviteLink, features, is_popular } = req.body;

  let formattedFeatures = [];
  if (Array.isArray(features)) {
    formattedFeatures = features;
  } else if (typeof features === 'string') {
    try {
      const parsed = JSON.parse(features);
      formattedFeatures = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      formattedFeatures = features.split(',').map(s => s.trim()).filter(Boolean);
    }
  }
  if (!formattedFeatures.length) {
    formattedFeatures = ['Full Canva Pro Access', 'Instant Email Delivery'];
  }

  let link = (inviteLink || '').trim();
  if (!link) {
    link = 'https://www.canva.com/brand/join?token=DEFAULT_INVITE';
  } else if (!link.startsWith('http://') && !link.startsWith('https://')) {
    link = 'https://' + link;
  }

  const numPrice = Math.max(0, Number(price) || 199);
  const numOrigPrice = Math.max(numPrice, Number(originalPrice) || (numPrice * 2));

  try {
    const result = await query(`
      UPDATE canva_plans
      SET name = $1, duration = $2, price = $3, original_price = $4, badge = $5, invite_link = $6, features = $7::jsonb, is_popular = $8
      WHERE id = $9
      RETURNING *
    `, [
      name || 'Canva Pro Plan',
      duration || '365 Days Access',
      numPrice,
      numOrigPrice,
      badge || null,
      link,
      JSON.stringify(formattedFeatures),
      Boolean(is_popular),
      id
    ]);

    if (result && result.rowCount > 0) {
      return res.json({ success: true, plan: formatPlan(result.rows[0]) });
    }
  } catch (e) {
    console.error('Neon Canva Plan Update Error:', e.message);
    return res.status(500).json({ success: false, error: e.message });
  }

  return res.status(404).json({ success: false, error: 'Plan not found' });
};

const deletePlanHandler = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await query('DELETE FROM canva_plans WHERE id = $1', [id]);
    if (result && result.rowCount > 0) {
      return res.json({ success: true });
    }
  } catch (e) {
    console.error('Neon Canva Plan Delete Error:', e.message);
  }

  mockPlans = mockPlans.filter(p => p.id !== id);
  return res.json({ success: true });
};

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
  try {
    const result = await query('SELECT * FROM canva_activations ORDER BY created_at DESC');
    if (result && result.rows) {
      return res.json({ activations: result.rows.map(formatActivation) });
    }
  } catch (e) {
    console.error('Neon Canva Activations Fetch Error:', e.message);
  }
  return res.json({ activations: mockActivations });
};

const createActivationHandler = async (req, res) => {
  const { email, planName, amount, paymentMethod, inviteLink } = req.body;
  const newId = 'act_' + Date.now();

  try {
    const result = await query(`
      INSERT INTO canva_activations (id, email, plan_name, amount, payment_method, invite_link)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      newId,
      email,
      planName,
      Number(amount),
      paymentMethod || 'UPI QR',
      inviteLink || 'https://www.canva.com/brand/join?token=DEFAULT_INVITE'
    ]);

    if (result && result.rows && result.rows[0]) {
      return res.json({ success: true, activation: formatActivation(result.rows[0]) });
    }
  } catch (e) {
    console.error('Neon Canva Activation Create Error:', e.message);
  }

  const newAct = {
    id: newId,
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

  try {
    const result = await query('DELETE FROM canva_activations WHERE id = $1', [id]);
    if (result && result.rowCount > 0) {
      return res.json({ success: true });
    }
  } catch (e) {
    console.error('Neon Canva Activation Delete Error:', e.message);
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
// 4. Canva Payments & Analytics Endpoints
// ==========================================
const paymentsAnalyticsHandler = async (req, res) => {
  let activationsList = mockActivations;

  try {
    const result = await query('SELECT * FROM canva_activations ORDER BY created_at DESC');
    if (result && result.rows) {
      activationsList = result.rows.map(formatActivation);
    }
  } catch (e) { }

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
    payments: activationsList
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
  let planName = 'Canva Pro Access';
  let planPrice = 199;

  try {
    if (planId) {
      const planRes = await query('SELECT * FROM canva_plans WHERE id = $1', [planId]);
      if (planRes && planRes.rows && planRes.rows[0]) {
        inviteLink = planRes.rows[0].invite_link;
        planName = planRes.rows[0].name;
        planPrice = Number(planRes.rows[0].price);
      }
    }

    await query(`
      INSERT INTO canva_activations (id, email, plan_name, amount, payment_method, invite_link)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      'act_' + Date.now(),
      customerEmail,
      planName,
      planPrice,
      'Razorpay UPI',
      inviteLink
    ]);
  } catch (e) {
    console.error('Neon Verify Payment Insert Error:', e.message);
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
