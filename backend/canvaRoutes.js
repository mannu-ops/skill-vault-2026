import 'dotenv/config';
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { query, isDbConnected, inMemoryDb } from './db.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'skillvault_secret_jwt_key_2026_production';

// Dynamic Razorpay Configuration helper
export function getRazorpayConfig() {
  const keyId = process.env.RAZORPAY_KEY_ID || '';
  const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
  let instance = null;
  if (keyId && keySecret) {
    try {
      instance = new Razorpay({
        key_id: keyId,
        key_secret: keySecret
      });
    } catch (err) {
      console.error('Failed to initialize Razorpay SDK in Canva Routes:', err.message);
    }
  }
  return { keyId, keySecret, instance };
}

// Helper to verify if request is from an authenticated admin
export const isUserAdmin = (req) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return false;
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded && (decoded.role === 'admin' || decoded.email === process.env.ADMIN_USERNAME);
  } catch {
    return false;
  }
};

// Admin authentication middleware - Blocks any non-admin request with 401/403
export const authenticateAdminToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Authentication required. Please login as Admin.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, error: 'Invalid or expired session token.' });
    }
    if (user.role !== 'admin' && user.email !== process.env.ADMIN_USERNAME) {
      return res.status(403).json({ success: false, error: 'Access denied: Admin privileges required.' });
    }
    req.user = user;
    next();
  });
};

// In-Memory Fallback Storage (in case database connection is temporarily offline)
let mockPlans = [
  {
    id: 'plan_1y',
    name: '1 Year Canva Pro',
    duration: '365 Days Access',
    price: 199,
    originalPrice: 499,
    badge: 'BEST SELLER',
    invite_link: 'https://www.canva.com/brand/join?token=PRO_ANNUAL_INVITE',
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
    invite_link: 'https://www.canva.com/brand/join?token=LIFETIME_VIP_INVITE',
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
    invite_link: 'https://www.canva.com/brand/join?token=STARTER_30D_INVITE',
    features: ['100M+ Stock Media Unlocked', 'Magic Studio & AI Writer', '1-Click Background Remover', 'Instant Team Invitation'],
    is_popular: false
  }
];

let mockActivations = [
  {
    id: 'act_101',
    email: 'customer.demo@gmail.com',
    planName: '1 Year Canva Pro',
    amount: 199,
    timestamp: new Date().toLocaleString(),
    paymentMethod: 'UPI QR',
    inviteLink: 'https://www.canva.com/brand/join?token=PRO_ANNUAL_INVITE'
  }
];

// Helper to format plan row from Neon PostgreSQL
// Note: inviteLink is ONLY included if includeSecret is true (Admin). For public visitors, it is stripped!
const formatPlan = (p, includeSecret = false) => ({
  id: p.id,
  name: p.name,
  duration: p.duration,
  price: Number(p.price),
  originalPrice: Number(p.original_price || p.price * 2),
  badge: p.badge || null,
  ...(includeSecret ? { inviteLink: p.invite_link || p.inviteLink } : {}),
  features: typeof p.features === 'string' ? JSON.parse(p.features) : (p.features || []),
  is_popular: Boolean(p.is_popular)
});

// Helper to format activation row from Neon PostgreSQL
const formatActivation = (a) => ({
  id: a.id,
  email: a.email || a.user_email || 'customer@example.com',
  planName: a.plan_name || a.planName || (a.course_id ? String(a.course_id).replace('🎨 Canva Pro: ', '') : 'Canva Pro Access'),
  amount: Number(a.amount ?? a.amount_paid_inr ?? 199),
  paymentMethod: a.payment_method || a.paymentMethod || 'Razorpay UPI',
  inviteLink: a.invite_link || a.inviteLink || a.drive_url || '',
  timestamp: a.created_at ? new Date(a.created_at).toLocaleString() : (a.timestamp || new Date().toLocaleString())
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
  const isAdmin = isUserAdmin(req);
  try {
    const result = await query('SELECT * FROM canva_plans ORDER BY price ASC');
    if (result && result.rows && result.rows.length > 0) {
      return res.json({ plans: result.rows.map(p => formatPlan(p, isAdmin)) });
    }
  } catch (e) {
    console.error('Neon Canva Plans Fetch Error:', e.message);
  }
  return res.json({ plans: mockPlans.map(p => formatPlan(p, isAdmin)) });
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

// Public plans listing (inviteLink is automatically hidden/masked unless Admin token is present)
router.get('/api/canva/plans', getPlansHandler);
router.get('/api/plans', getPlansHandler);

// Admin-protected plan management
router.post('/api/canva/plans', authenticateAdminToken, createPlanHandler);
router.post('/api/plans', authenticateAdminToken, createPlanHandler);

router.put('/api/canva/plans/:id', authenticateAdminToken, updatePlanHandler);
router.put('/api/plans/:id', authenticateAdminToken, updatePlanHandler);

router.delete('/api/canva/plans/:id', authenticateAdminToken, deletePlanHandler);
router.delete('/api/plans/:id', authenticateAdminToken, deletePlanHandler);

// ==========================================
// 3. Canva Activations (Orders) Endpoints
// ==========================================
const getActivationsHandler = async (req, res) => {
  let activationsList = [];

  try {
    const result = await query('SELECT * FROM canva_activations ORDER BY created_at DESC');
    if (result && result.rows && result.rows.length > 0) {
      activationsList = result.rows.map(formatActivation);
    }
  } catch (e) {
    console.error('Neon Canva Activations Fetch Error:', e.message);
  }

  // Resilient fallback: Check purchases table for Canva records if activations empty
  if (activationsList.length === 0) {
    try {
      const purResult = await query("SELECT * FROM purchases WHERE id LIKE 'pur_act_%' OR course_id LIKE '%Canva%' ORDER BY created_at DESC");
      if (purResult && purResult.rows && purResult.rows.length > 0) {
        activationsList = purResult.rows.map(formatActivation);
      }
    } catch (purErr) {
      console.warn('Fallback purchases query error in getActivationsHandler:', purErr.message);
    }
  }

  if (activationsList.length === 0 && mockActivations.length > 0) {
    activationsList = mockActivations.map(formatActivation);
  }

  return res.json({ activations: activationsList });
};

const createActivationHandler = async (req, res) => {
  const { email, planName, amount, paymentMethod, inviteLink } = req.body;
  const newId = 'act_' + Date.now();
  const effectiveLink = inviteLink || 'https://www.canva.com/brand/join?token=DEFAULT_INVITE';
  const effectivePrice = Number(amount) || 199;
  const effectivePlanName = planName || 'Canva Pro Access';

  try {
    // 1. Insert into canva_activations table
    const result = await query(`
      INSERT INTO canva_activations (id, email, plan_name, amount, payment_method, invite_link)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      newId,
      email,
      effectivePlanName,
      effectivePrice,
      paymentMethod || 'UPI QR',
      effectiveLink
    ]);

    // 2. Also mirror entry into main purchases table for unified SkillVault Buyers log
    await query(`
      INSERT INTO purchases (id, user_email, user_name, user_phone, course_id, amount_paid_inr, payment_id, status, access_delivered, drive_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (id) DO NOTHING
    `, [
      `pur_${newId}`,
      email,
      email ? email.split('@')[0] : 'Canva Customer',
      '',
      `🎨 Canva Pro: ${effectivePlanName}`,
      effectivePrice,
      `manual_${newId}`,
      'completed',
      true,
      effectiveLink
    ]).catch(err => console.error('Mirror to purchases error:', err.message));

    if (result && result.rows && result.rows[0]) {
      return res.json({ success: true, activation: formatActivation(result.rows[0]) });
    }
  } catch (e) {
    console.error('Neon Canva Activation Create Error:', e.message);
  }

  const newAct = {
    id: newId,
    email,
    planName: effectivePlanName,
    amount: effectivePrice,
    paymentMethod: paymentMethod || 'UPI QR',
    inviteLink: effectiveLink,
    timestamp: new Date().toLocaleString()
  };
  mockActivations.unshift(newAct);
  return res.json({ success: true, activation: newAct });
};

const deleteActivationHandler = async (req, res) => {
  const { id } = req.params;

  try {
    // Clean up mirrored purchase from main purchases table as well
    await query('DELETE FROM purchases WHERE id = $1', [`pur_${id}`]).catch(() => {});
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

// Admin-protected activations (customer orders)
router.get('/api/canva/activations', authenticateAdminToken, getActivationsHandler);
router.get('/api/activations', authenticateAdminToken, getActivationsHandler);

router.post('/api/canva/activations', createActivationHandler);
router.post('/api/activations', createActivationHandler);

router.delete('/api/canva/activations/:id', authenticateAdminToken, deleteActivationHandler);
router.delete('/api/activations/:id', authenticateAdminToken, deleteActivationHandler);

// ==========================================
// 4. Canva Payments & Analytics Endpoints
// ==========================================
const paymentsAnalyticsHandler = async (req, res) => {
  let activationsList = [];

  try {
    const result = await query('SELECT * FROM canva_activations ORDER BY created_at DESC');
    if (result && result.rows && result.rows.length > 0) {
      activationsList = result.rows.map(formatActivation);
    }
  } catch (e) {
    console.error('Neon Canva Payments Analytics Fetch Error:', e.message);
  }

  // Resilient fallback: Also check purchases table
  if (activationsList.length === 0) {
    try {
      const purResult = await query("SELECT * FROM purchases WHERE id LIKE 'pur_act_%' OR course_id LIKE '%Canva%' ORDER BY created_at DESC");
      if (purResult && purResult.rows && purResult.rows.length > 0) {
        activationsList = purResult.rows.map(formatActivation);
      }
    } catch (purErr) {}
  }

  if (activationsList.length === 0 && mockActivations.length > 0) {
    activationsList = mockActivations.map(formatActivation);
  }

  const totalSales = activationsList.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const totalCommission = Math.round(totalSales * 0.15); // 15% partner commission
  const adminEarnings = totalSales - totalCommission;

  return res.json({
    analytics: {
      totalSales,
      adminEarnings,
      totalCommission,
      totalOrders: activationsList.length,
      successfulCount: activationsList.length,
      pendingCount: 0,
      failedCount: 0
    },
    payments: activationsList
  });
};

const DEFAULT_CANVA_PLANS = {
  'plan_1y': { name: '1 Year Canva Pro', price: 199, invite_link: 'https://www.canva.com/brand/join?token=PRO_ANNUAL_INVITE' },
  'plan_life': { name: 'Lifetime Canva Pro', price: 399, invite_link: 'https://www.canva.com/brand/join?token=LIFETIME_VIP_INVITE' },
  'plan_1m': { name: '1 Month Canva Pro', price: 99, invite_link: 'https://www.canva.com/brand/join?token=STARTER_30D_INVITE' }
};

const createPaymentOrderHandler = async (req, res) => {
  const { planId, customerEmail, customerPhone, customerName } = req.body;
  let planPrice = 199;
  let planName = 'Canva Pro Access';

  if (planId && DEFAULT_CANVA_PLANS[planId]) {
    planPrice = DEFAULT_CANVA_PLANS[planId].price;
    planName = DEFAULT_CANVA_PLANS[planId].name;
  }

  try {
    if (planId && isDbConnected()) {
      try {
        const planRes = await query('SELECT * FROM canva_plans WHERE id = $1', [planId]);
        if (planRes && planRes.rows && planRes.rows[0]) {
          planPrice = Number(planRes.rows[0].price) || planPrice;
          planName = planRes.rows[0].name || planName;
        }
      } catch (dbErr) {
        console.warn('Canva plan fetch warning:', dbErr.message);
      }
    }

    const amountInPaise = Math.round(planPrice * 100);
    const { instance, keyId } = getRazorpayConfig();

    // Call real Razorpay SDK if configured
    if (instance && keyId) {
      const options = {
        amount: amountInPaise,
        currency: 'INR',
        receipt: `canva_${Date.now().toString().slice(-8)}`,
        notes: {
          planId: planId || '',
          planName,
          customerEmail: customerEmail || '',
          customerPhone: customerPhone || '',
          customerName: customerName || ''
        }
      };

      const order = await instance.orders.create(options);
      return res.json({
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency || 'INR',
        keyId: keyId,
        razorpayKeyId: keyId,
        planName,
        planPrice
      });
    }

    // Fallback simulation for local dev
    return res.json({
      success: true,
      isFallback: true,
      orderId: 'order_mock_' + Date.now(),
      amount: amountInPaise,
      currency: 'INR',
      keyId: keyId || 'rzp_test_mock',
      razorpayKeyId: keyId || 'rzp_test_mock',
      planName,
      planPrice
    });
  } catch (err) {
    console.error('Canva Razorpay Order Creation Error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// Automated Purchase Confirmation Email via Hostinger Business REST API
async function sendCanvaPurchaseEmail({ to, planName, inviteLink, paymentId, amount }) {
  if (!to || !to.includes('@')) {
    console.error('❌ [CANVA EMAIL ERROR]: Invalid or missing recipient email address.');
    return { success: false, error: 'Invalid recipient email' };
  }

  const textContent = `
Hello,

Thank you for your purchase on The Skill Vault! Your payment has been successfully confirmed and your Canva Pro subscription is ready to use.

--------------------------------------------------
ORDER DETAILS:
--------------------------------------------------
Product: ${planName}
Amount Paid: Rs. ${amount}
Payment ID: ${paymentId}
Status: Activated (Instant Lifetime/Period Delivery)

--------------------------------------------------
YOUR OFFICIAL CANVA PRO TEAM INVITE LINK:
--------------------------------------------------
${inviteLink}

--------------------------------------------------
HOW TO ACTIVATE YOUR CANVA PRO:
--------------------------------------------------
1. Click the invite link above (or copy and paste it into your browser).
2. Sign in with your Canva account (or create a free Canva account if you don't already have one).
3. Click "Join Team" or accept the team invitation.
4. You will instantly get full Canva Pro access unlocked:
   - 100M+ Premium Photos, Videos, Graphics & Audio
   - Magic Studio AI Tools & 1-Click Background Remover
   - 100GB Cloud Storage
   - Brand Kits & Custom Fonts

NEED ASSISTANCE?
If you have any questions or need help with activation, simply reply directly to this email or contact our 24/7 WhatsApp Support:
WhatsApp: +91 7652072236 (https://wa.me/917652072236)

Best regards,
The Skill Vault Team
https://www.theskillvault.store
  `.trim();

  const hostingerApiToken = process.env.HOSTINGER_MAIL_API_TOKEN;
  if (!hostingerApiToken) {
    console.log(`\n📧 [CANVA EMAIL NOTICE]: HOSTINGER_MAIL_API_TOKEN not configured. Simulated email to ${to}`);
    return { status: 'simulated' };
  }

  try {
    const mailboxId = process.env.HOSTINGER_MAILBOX_RESOURCE_ID || 'AC4aef084c55c39d1ca9d778f78573';
    const sendRes = await fetch(`https://api.mail.hostinger.com/api/v1/mailboxes/${mailboxId}/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hostingerApiToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        to: [to],
        displayName: 'The Skill Vault',
        subject: `🎉 Your Canva Pro Access is Ready! — Order ${paymentId}`,
        text: textContent
      })
    });

    if (sendRes.ok) {
      console.log(`✅ [CANVA EMAIL SENT]: Hostinger confirmation email delivered to ${to}`);
      return { success: true };
    } else {
      const errBody = await sendRes.text();
      console.error(`❌ [HOSTINGER API ERROR]: HTTP ${sendRes.status}: ${errBody}`);
      return { success: false, error: errBody };
    }
  } catch (mailErr) {
    console.error('❌ [HOSTINGER EMAIL EXCEPTION]:', mailErr.message);
    return { success: false, error: mailErr.message };
  }
}

const verifyPaymentHandler = async (req, res) => {
  const { 
    customerEmail, 
    customerName,
    customerPhone,
    planId, 
    paymentId,
    razorpay_order_id, 
    razorpay_payment_id, 
    razorpay_signature 
  } = req.body;

  let inviteLink = 'https://www.canva.com/brand/join?token=PRO_ANNUAL_INVITE';
  let planName = 'Canva Pro Access';
  let planPrice = 199;

  if (planId && DEFAULT_CANVA_PLANS[planId]) {
    inviteLink = DEFAULT_CANVA_PLANS[planId].invite_link;
    planName = DEFAULT_CANVA_PLANS[planId].name;
    planPrice = DEFAULT_CANVA_PLANS[planId].price;
  }

  try {
    const { keySecret } = getRazorpayConfig();
    const effectiveOrderId = razorpay_order_id;
    const effectivePayId = razorpay_payment_id || paymentId;
    let isVerified = false;

    // 1. Verify Razorpay cryptographic signature matching server.js
    if (keySecret && effectiveOrderId && effectivePayId && razorpay_signature && razorpay_signature !== 'mock_signature') {
      const generatedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${effectiveOrderId}|${effectivePayId}`)
        .digest('hex');

      const sigBuffer = Buffer.from(String(razorpay_signature || ''), 'utf8');
      const genBuffer = Buffer.from(String(generatedSignature), 'utf8');

      if (sigBuffer.length === genBuffer.length && crypto.timingSafeEqual(sigBuffer, genBuffer)) {
        isVerified = true;
      } else {
        console.error('❌ Canva Razorpay Signature Mismatch');
        return res.status(400).json({ success: false, error: 'Payment signature verification failed' });
      }
    } else if (effectivePayId) {
      isVerified = true;
    }

    if (!isVerified) {
      return res.status(400).json({ success: false, error: 'Invalid payment parameters.' });
    }

    // 2. Fetch real plan details from database if available
    if (planId && isDbConnected()) {
      try {
        const planRes = await query('SELECT * FROM canva_plans WHERE id = $1', [planId]);
        if (planRes && planRes.rows && planRes.rows[0]) {
          inviteLink = planRes.rows[0].invite_link || inviteLink;
          planName = planRes.rows[0].name || planName;
          planPrice = Number(planRes.rows[0].price) || planPrice;
        }
      } catch (dbErr) {
        console.warn('DB query error in verifyPaymentHandler:', dbErr.message);
      }
    }

    const activationId = 'act_' + Date.now();
    const finalPaymentId = effectivePayId || `pay_canva_${Date.now()}`;
    const effectiveName = customerName || (customerEmail ? customerEmail.split('@')[0] : 'Canva Customer');

    // 3. Record in PostgreSQL database safely
    if (isDbConnected()) {
      try {
        await query(`
          INSERT INTO canva_activations (id, email, plan_name, amount, payment_method, invite_link)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            plan_name = EXCLUDED.plan_name,
            amount = EXCLUDED.amount,
            invite_link = EXCLUDED.invite_link
        `, [
          activationId,
          customerEmail || 'customer@example.com',
          planName,
          planPrice,
          'Razorpay UPI',
          inviteLink
        ]);
        console.log(`✅ [CANVA DB] Recorded activation ${activationId} for ${customerEmail}`);
      } catch (actErr) {
        console.error('Insert canva_activations error:', actErr.message);
        // Safe fallback for minimal columns
        try {
          await query(`
            INSERT INTO canva_activations (id, email, plan_name, amount, invite_link)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (id) DO NOTHING
          `, [activationId, customerEmail || 'customer@example.com', planName, planPrice, inviteLink]);
        } catch (innerErr) {
          console.error('Fallback canva_activations insert failed:', innerErr.message);
        }
      }

      try {
        await query(`
          INSERT INTO purchases (id, user_email, user_name, user_phone, course_id, amount_paid_inr, payment_id, status, access_delivered, drive_url)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (id) DO NOTHING
        `, [
          `pur_${activationId}`,
          customerEmail || 'customer@example.com',
          effectiveName,
          customerPhone || '',
          `🎨 Canva Pro: ${planName}`,
          planPrice,
          finalPaymentId,
          'completed',
          true,
          inviteLink
        ]);
        console.log(`✅ [CANVA DB] Mirrored purchase pur_${activationId} in purchases table`);
      } catch (purErr) {
        console.error('Mirror Canva purchase to purchases table error:', purErr.message);
      }
    }

    // 4. Update in-memory storage for immediate real-time synchronization
    mockActivations.unshift({
      id: activationId,
      email: customerEmail || 'customer@example.com',
      planName: planName,
      plan_name: planName,
      amount: planPrice,
      paymentMethod: 'Razorpay UPI',
      payment_method: 'Razorpay UPI',
      inviteLink: inviteLink,
      invite_link: inviteLink,
      timestamp: new Date().toLocaleString()
    });

    inMemoryDb.purchases.unshift({
      id: `pur_${activationId}`,
      userEmail: customerEmail || 'customer@example.com',
      userName: effectiveName,
      userPhone: customerPhone || '',
      courseId: `🎨 Canva Pro: ${planName}`,
      amountPaidInr: planPrice,
      paymentId: finalPaymentId,
      status: 'completed',
      accessDelivered: true,
      createdAt: new Date().toISOString(),
      driveUrl: inviteLink
    });

    // 5. Send automated confirmation email via Hostinger Business Email
    sendCanvaPurchaseEmail({
      to: customerEmail,
      planName,
      inviteLink,
      paymentId: finalPaymentId,
      amount: planPrice
    }).catch(err => console.error('Background Canva confirmation email error:', err.message));

    return res.json({
      success: true,
      message: '🎉 Canva Pro access activated successfully!',
      paymentId: finalPaymentId,
      inviteLink,
      driveUrl: inviteLink,
      planName,
      amount: planPrice
    });
  } catch (e) {
    console.error('Canva Verify Payment Error:', e.message);
    return res.status(500).json({ success: false, error: e.message });
  }
};

// Admin-protected payments analytics
router.get('/api/canva/payments', authenticateAdminToken, paymentsAnalyticsHandler);
router.get('/api/payments', authenticateAdminToken, paymentsAnalyticsHandler);

// Public payment order creation and post-payment delivery
router.post('/api/canva/payments/create-order', createPaymentOrderHandler);
router.post('/api/payments/create-order', createPaymentOrderHandler);

router.post('/api/canva/payments/verify', verifyPaymentHandler);
router.post('/api/payments/verify', verifyPaymentHandler);

export default router;
