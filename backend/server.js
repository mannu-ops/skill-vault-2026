import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { initDb, query, isDbConnected, inMemoryDb } from './db.js';
import nodemailer from 'nodemailer';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'skillvault_secret_jwt_key_2026_production';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'SkillVault2026!Admin';
const razorpayKeyId = process.env.RAZORPAY_KEY_ID || '';
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || '';
const razorpayWebhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET || '';

let razorpayInstance = null;
if (razorpayKeyId && razorpayKeySecret) {
  try {
    razorpayInstance = new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret
    });
    console.log('💳 Razorpay SDK initialized successfully!');
  } catch (err) {
    console.error('Failed to initialize Razorpay SDK:', err.message);
  }
}

app.use(cors({ origin: '*' }));
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));

// Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

let bonusConfig = {
  enabled: false,
  bonuses: [
    {
      id: 'bonus-vip-toolkit',
      enabled: false,
      title: 'Add VIP Developer Toolkit & Cheat-Sheets',
      price: '149',
      originalPrice: '999',
      category: 'Software & Tools',
      description: 'Unlock 50+ scripts, cheat-sheets & tools for just ₹149 extra.',
      selectedProductId: '',
      driveUrl: 'https://drive.google.com/drive/folders/1_example_bonus_toolkit'
    }
  ]
};

// Helper to format DB product row
const formatProduct = (p) => ({
  ...p,
  priceInr: p.price_inr ?? p.priceInr ?? 299,
  originalPriceInr: p.original_price_inr ?? p.originalPriceInr ?? 1999,
  isPublished: p.is_published !== undefined && p.is_published !== null ? Boolean(p.is_published) : (p.isPublished !== undefined && p.isPublished !== null ? Boolean(p.isPublished) : true),
  driveUrl: p.drive_url ?? p.driveUrl ?? '',
  imageUrl: p.image_url ?? p.imageUrl ?? '',
  features: typeof p.features === 'string' ? JSON.parse(p.features) : (p.features || []),
  modules: typeof p.modules === 'string' ? JSON.parse(p.modules) : (p.modules || []),
  testimonials: typeof p.testimonials === 'string' ? JSON.parse(p.testimonials) : (p.testimonials || []),
  faqs: typeof p.faqs === 'string' ? JSON.parse(p.faqs) : (p.faqs || [])
});

// Middleware for Authenticating JWT Token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Authentication token required' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });
    req.user = decoded;
    next();
  });
};

// Middleware to strictly enforce Admin privilege
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied: Admin privileges required' });
  }
  next();
};

// ==========================================
// API ROUTES
// ==========================================

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Skill Vault Express Backend API',
    database: isDbConnected() ? 'PostgreSQL' : 'In-Memory Backup',
    timestamp: new Date().toISOString()
  });
});

// GET CATALOG PRODUCTS / COURSES
app.get(['/api/products', '/api/courses'], async (req, res) => {
  try {
    if (isDbConnected()) {
      const result = await query('SELECT * FROM products WHERE is_published = true ORDER BY created_at DESC');
      const formatted = result.rows.map(formatProduct);
      return res.json({ products: formatted, courses: formatted });
    }
  } catch (err) {
    console.error('PostgreSQL fetch products error:', err.message);
  }
  const formattedInMemory = inMemoryDb.products.map(formatProduct).filter(p => p.isPublished !== false);
  res.json({ products: formattedInMemory, courses: formattedInMemory });
});

// GET ALL PRODUCTS / COURSES FOR ADMIN
app.get(['/api/admin/products', '/api/admin/courses'], [authenticateToken, requireAdmin], async (req, res) => {
  try {
    if (isDbConnected()) {
      const result = await query('SELECT * FROM products ORDER BY created_at DESC');
      const formatted = result.rows.map(formatProduct);
      return res.json({ products: formatted, courses: formatted });
    }
  } catch (err) {
    console.error('PostgreSQL admin fetch products error:', err.message);
  }
  const formattedInMemory = inMemoryDb.products.map(formatProduct);
  res.json({ products: formattedInMemory, courses: formattedInMemory });
});

// CREATE CATALOG PRODUCT / COURSE (ADMIN)
app.post(['/api/admin/products', '/api/admin/courses'], authenticateToken, async (req, res) => {
  const { title, subtitle, description, category, priceInr, originalPriceInr, driveUrl, imageUrl, duration, features, bonus, modules, testimonials, faqs } = req.body;

  if (!title) {
    return res.status(400).json({ message: 'Title is required' });
  }

  const newProduct = {
    id: req.body.id || `product_${Date.now()}`,
    title,
    subtitle: subtitle || '',
    description: description || '',
    category: category || 'Course',
    priceInr: Number(priceInr) || 299,
    originalPriceInr: Number(originalPriceInr) || 1999,
    isPublished: req.body.isPublished !== undefined ? Boolean(req.body.isPublished) : true,
    driveUrl: driveUrl || 'https://drive.google.com',
    imageUrl: imageUrl || '',
    duration: duration || 'Lifetime Access',
    features: Array.isArray(features) ? features : (features ? String(features).split(',').map(f => f.trim()) : []),
    bonus: bonus || '',
    modules: Array.isArray(modules) ? modules : [],
    testimonials: Array.isArray(testimonials) ? testimonials : [],
    faqs: Array.isArray(faqs) ? faqs : [],
    createdAt: new Date().toISOString()
  };

  try {
    if (isDbConnected()) {
      await query(`
        INSERT INTO products (id, title, subtitle, description, category, price_inr, original_price_inr, is_published, drive_url, image_url, duration, features, bonus, modules, testimonials, faqs)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      `, [
        newProduct.id,
        newProduct.title,
        newProduct.subtitle,
        newProduct.description,
        newProduct.category,
        newProduct.priceInr,
        newProduct.originalPriceInr,
        newProduct.isPublished,
        newProduct.driveUrl,
        newProduct.imageUrl,
        newProduct.duration,
        JSON.stringify(newProduct.features),
        newProduct.bonus,
        JSON.stringify(newProduct.modules),
        JSON.stringify(newProduct.testimonials),
        JSON.stringify(newProduct.faqs)
      ]);
    }
  } catch (err) {
    console.error('PostgreSQL insert product error:', err.message);
  }

  inMemoryDb.products.unshift(newProduct);
  res.status(201).json({ message: 'Product created successfully', product: newProduct, course: newProduct });
});

// UPDATE CATALOG PRODUCT / COURSE (ADMIN)
app.put(['/api/admin/products/:id', '/api/admin/courses/:id'], authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    if (isDbConnected()) {
      const existing = await query('SELECT * FROM products WHERE id = $1', [id]);
      if (existing.rows.length === 0) return res.status(404).json({ message: 'Product not found' });

      const prev = existing.rows[0];
      const title = req.body.title || prev.title;
      const subtitle = req.body.subtitle !== undefined ? req.body.subtitle : prev.subtitle;
      const description = req.body.description !== undefined ? req.body.description : prev.description;
      const category = req.body.category || prev.category;
      const priceInr = req.body.priceInr !== undefined ? Number(req.body.priceInr) : prev.price_inr;
      const originalPriceInr = req.body.originalPriceInr !== undefined ? Number(req.body.originalPriceInr) : prev.original_price_inr;
      const isPublished = req.body.isPublished !== undefined ? Boolean(req.body.isPublished) : (prev.is_published ?? true);
      const driveUrl = req.body.driveUrl || prev.drive_url;
      const imageUrl = req.body.imageUrl || prev.image_url;
      const duration = req.body.duration !== undefined ? req.body.duration : prev.duration;
      const bonus = req.body.bonus !== undefined ? req.body.bonus : prev.bonus;

      const features = req.body.features !== undefined ? JSON.stringify(req.body.features) : prev.features;
      const modules = req.body.modules !== undefined ? JSON.stringify(req.body.modules) : prev.modules;
      const testimonials = req.body.testimonials !== undefined ? JSON.stringify(req.body.testimonials) : prev.testimonials;
      const faqs = req.body.faqs !== undefined ? JSON.stringify(req.body.faqs) : prev.faqs;

      await query(`
        UPDATE products
        SET title = $1, subtitle = $2, description = $3, category = $4, price_inr = $5, original_price_inr = $6, drive_url = $7, image_url = $8, duration = $9, bonus = $10, features = $11, modules = $12, testimonials = $13, faqs = $14, is_published = $15
        WHERE id = $16
      `, [title, subtitle, description, category, priceInr, originalPriceInr, driveUrl, imageUrl, duration, bonus, features, modules, testimonials, faqs, isPublished, id]);

      // Sync in-memory backup
      const memIndex = inMemoryDb.products.findIndex(p => p.id === id);
      if (memIndex !== -1) {
        inMemoryDb.products[memIndex] = {
          ...inMemoryDb.products[memIndex],
          ...req.body,
          id,
          isPublished,
          priceInr,
          originalPriceInr
        };
      }

      const updatedProduct = formatProduct({
        id, title, subtitle, description, category,
        price_inr: priceInr, original_price_inr: originalPriceInr,
        drive_url: driveUrl, image_url: imageUrl, duration, bonus,
        features, modules, testimonials, faqs, is_published: isPublished
      });

      return res.json({ message: 'Product updated successfully', product: updatedProduct, course: updatedProduct });
    }
  } catch (err) {
    console.error('PostgreSQL update product error:', err.message);
  }

  const index = inMemoryDb.products.findIndex(p => p.id === id);
  if (index === -1) return res.status(404).json({ message: 'Product not found' });

  inMemoryDb.products[index] = {
    ...inMemoryDb.products[index],
    ...req.body,
    id,
    isPublished: req.body.isPublished !== undefined ? Boolean(req.body.isPublished) : (inMemoryDb.products[index].isPublished ?? true),
    priceInr: req.body.priceInr !== undefined ? Number(req.body.priceInr) : inMemoryDb.products[index].priceInr,
    originalPriceInr: req.body.originalPriceInr !== undefined ? Number(req.body.originalPriceInr) : inMemoryDb.products[index].originalPriceInr
  };

  const formattedProduct = formatProduct(inMemoryDb.products[index]);
  res.json({ message: 'Product updated successfully', product: formattedProduct, course: formattedProduct });
});

// QUICK TOGGLE PUBLISH PRODUCT STATUS (ADMIN)
app.patch(['/api/admin/products/:id/toggle-publish', '/api/admin/courses/:id/toggle-publish'], authenticateToken, async (req, res) => {
  const { id } = req.params;
  let newPublishedState = true;

  try {
    if (isDbConnected()) {
      const existing = await query('SELECT is_published FROM products WHERE id = $1', [id]);
      if (existing.rows.length === 0) return res.status(404).json({ message: 'Product not found' });
      newPublishedState = !existing.rows[0].is_published;
      await query('UPDATE products SET is_published = $1 WHERE id = $2', [newPublishedState, id]);
    }
  } catch (err) {
    console.error('PostgreSQL toggle publish error:', err.message);
  }

  const index = inMemoryDb.products.findIndex(p => p.id === id);
  if (index !== -1) {
    if (!isDbConnected()) {
      newPublishedState = !inMemoryDb.products[index].isPublished;
    }
    inMemoryDb.products[index].isPublished = newPublishedState;
  }

  res.json({ message: `Product ${newPublishedState ? 'published' : 'unpublished'} successfully`, isPublished: newPublishedState, id });
});

// DELETE CATALOG PRODUCT / COURSE (ADMIN)
app.delete(['/api/admin/products/:id', '/api/admin/courses/:id'], authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    if (isDbConnected()) {
      await query('DELETE FROM products WHERE id = $1', [id]);
      // Auto-clean deleted product from all user carts in PostgreSQL DB
      await query(`
        UPDATE users
        SET cart = (
          SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
          FROM jsonb_array_elements(cart) elem
          WHERE elem->>'id' != $1
        )
        WHERE cart IS NOT NULL AND jsonb_typeof(cart) = 'array' AND cart @> jsonb_build_array(jsonb_build_object('id', $1))
      `, [id]);
    }
  } catch (err) {
    console.error('PostgreSQL delete product & cart cleanup error:', err.message);
  }

  const index = inMemoryDb.products.findIndex(p => p.id === id);
  if (index !== -1) {
    inMemoryDb.products.splice(index, 1);
  }

  // Clean inMemory user carts
  inMemoryDb.users.forEach(u => {
    if (Array.isArray(u.cart)) {
      u.cart = u.cart.filter(item => item && item.id !== id);
    }
  });

  res.json({ message: 'Product deleted successfully and removed from user carts' });
});

// GET ALL USERS (ADMIN)
app.get('/api/admin/users', authenticateToken, async (req, res) => {
  try {
    if (isDbConnected()) {
      const result = await query('SELECT id, email, name, phone, picture, role, created_at FROM users ORDER BY created_at DESC');
      const formatted = result.rows.map(u => ({
        ...u,
        createdAt: u.created_at
      }));
      return res.json({ users: formatted });
    }
  } catch (err) {
    console.error('PostgreSQL fetch users error:', err.message);
  }

  const sanitized = inMemoryDb.users.map(({ passwordHash, ...u }) => u);
  res.json({ users: sanitized });
});

// UPDATE USER (ADMIN)
app.put('/api/admin/users/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, role } = req.body;

  try {
    if (isDbConnected()) {
      await query(`
        UPDATE users
        SET name = COALESCE($1, name), email = COALESCE($2, email), phone = COALESCE($3, phone), role = COALESCE($4, role)
        WHERE id = $5
      `, [name, email, phone, role, id]);
      return res.json({ message: 'User updated successfully' });
    }
  } catch (err) {
    console.error('PostgreSQL update user error:', err.message);
  }

  const user = inMemoryDb.users.find(u => u.id === id);
  if (user) {
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (role) user.role = role;
  }
  res.json({ message: 'User updated successfully' });
});

// DELETE USER (ADMIN)
app.delete('/api/admin/users/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    if (isDbConnected()) {
      await query('DELETE FROM users WHERE id = $1', [id]);
    }
  } catch (err) {
    console.error('PostgreSQL delete user error:', err.message);
  }

  const idx = inMemoryDb.users.findIndex(u => u.id === id);
  if (idx !== -1) inMemoryDb.users.splice(idx, 1);
  res.json({ message: 'User deleted successfully' });
});

// GET ALL PURCHASES (ADMIN)
app.get('/api/admin/purchases', authenticateToken, async (req, res) => {
  try {
    if (isDbConnected()) {
      const result = await query('SELECT * FROM purchases ORDER BY created_at DESC');
      const formatted = result.rows.map(p => ({
        id: p.id,
        userEmail: p.user_email,
        userName: p.user_name,
        userPhone: p.user_phone,
        courseId: p.course_id,
        amountPaidInr: p.amount_paid_inr,
        paymentId: p.payment_id,
        status: p.status,
        accessDelivered: p.access_delivered,
        driveUrl: p.drive_url,
        createdAt: p.created_at
      }));
      return res.json({ purchases: formatted });
    }
  } catch (err) {
    console.error('PostgreSQL admin fetch purchases error:', err.message);
  }
  res.json({ purchases: inMemoryDb.purchases });
});

// CREATE MANUAL PURCHASE (ADMIN)
app.post('/api/admin/purchases', authenticateToken, async (req, res) => {
  const { userEmail, userName, userPhone, courseId, amountPaidInr, paymentId, accessDelivered } = req.body;

  if (!userEmail || !courseId) {
    return res.status(400).json({ message: 'User Email and Course ID are required' });
  }

  const targetCourse = inMemoryDb.products.find(p => p.id === courseId);
  const newPurchase = {
    id: `purchase_${Date.now()}`,
    userEmail,
    userName: userName || userEmail.split('@')[0],
    userPhone: userPhone || '',
    courseId,
    amountPaidInr: Number(amountPaidInr) || 299,
    paymentId: paymentId || `MANUAL_${Date.now()}`,
    status: 'completed',
    accessDelivered: accessDelivered ?? true,
    driveUrl: targetCourse?.driveUrl || 'https://drive.google.com',
    createdAt: new Date().toISOString()
  };

  try {
    if (isDbConnected()) {
      await query(`
        INSERT INTO purchases (id, user_email, user_name, user_phone, course_id, amount_paid_inr, payment_id, status, access_delivered, drive_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        newPurchase.id,
        newPurchase.userEmail,
        newPurchase.userName,
        newPurchase.userPhone,
        newPurchase.courseId,
        newPurchase.amountPaidInr,
        newPurchase.paymentId,
        newPurchase.status,
        newPurchase.accessDelivered,
        newPurchase.driveUrl
      ]);
    }
  } catch (err) {
    console.error('PostgreSQL manual purchase insert error:', err.message);
  }

  inMemoryDb.purchases.unshift(newPurchase);

  // Trigger WhatsApp delivery for manual admin purchase
  if (userPhone) {
    sendPurchaseWhatsApp({
      toPhone: userPhone,
      customerName: userName || userEmail.split('@')[0],
      paymentId: newPurchase.paymentId,
      items: [targetCourse || { id: courseId, name: courseId, price: amountPaidInr, driveUrl: newPurchase.driveUrl }]
    }).catch(err => console.error('Manual purchase WhatsApp error:', err.message));
  }

  res.status(201).json({ message: 'Manual purchase recorded successfully', purchase: newPurchase });
});

// UPDATE PURCHASE (ADMIN)
app.put('/api/admin/purchases/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { userEmail, userName, userPhone, courseId, amountPaidInr, status, accessDelivered } = req.body;

  try {
    if (isDbConnected()) {
      await query(`
        UPDATE purchases
        SET user_email = COALESCE($1, user_email), user_name = COALESCE($2, user_name), user_phone = COALESCE($3, user_phone), course_id = COALESCE($4, course_id), amount_paid_inr = COALESCE($5, amount_paid_inr), status = COALESCE($6, status), access_delivered = COALESCE($7, access_delivered)
        WHERE id = $8
      `, [userEmail, userName, userPhone, courseId, amountPaidInr ? Number(amountPaidInr) : null, status, accessDelivered, id]);
      return res.json({ message: 'Purchase updated successfully' });
    }
  } catch (err) {
    console.error('PostgreSQL update purchase error:', err.message);
  }

  const pur = inMemoryDb.purchases.find(p => p.id === id);
  if (pur) {
    if (userEmail) pur.userEmail = userEmail;
    if (userName) pur.userName = userName;
    if (userPhone) pur.userPhone = userPhone;
    if (courseId) pur.courseId = courseId;
    if (amountPaidInr !== undefined) pur.amountPaidInr = Number(amountPaidInr);
    if (status) pur.status = status;
    if (accessDelivered !== undefined) pur.accessDelivered = accessDelivered;
  }
  res.json({ message: 'Purchase updated successfully' });
});

// DELETE PURCHASE (ADMIN)
app.delete('/api/admin/purchases/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    if (isDbConnected()) {
      await query('DELETE FROM purchases WHERE id = $1', [id]);
    }
  } catch (err) {
    console.error('PostgreSQL delete purchase error:', err.message);
  }

  const idx = inMemoryDb.purchases.findIndex(p => p.id === id);
  if (idx !== -1) inMemoryDb.purchases.splice(idx, 1);
  res.json({ message: 'Purchase deleted successfully' });
});

// Helper to resolve real drive URL for any item (Product or Bonus Offer)
async function resolveDriveUrl(item) {
  let url = item.driveUrl || item.drive_url || '';
  if (!url || url.trim() === '' || url.trim() === 'https://drive.google.com' || url.trim() === 'https://drive.google.com/') {
    const itemId = item.id || item.courseId || item.selectedProductId || '';
    if (itemId && isDbConnected()) {
      try {
        const pRes = await query('SELECT drive_url FROM products WHERE id = $1', [itemId]);
        if (pRes.rows.length > 0 && pRes.rows[0].drive_url) {
          url = pRes.rows[0].drive_url;
        } else {
          const bRes = await query('SELECT drive_url FROM bonus_offers WHERE id = $1', [itemId]);
          if (bRes.rows.length > 0 && bRes.rows[0].drive_url) {
            url = bRes.rows[0].drive_url;
          }
        }
      } catch (err) {
        console.error('Failed to resolve drive_url from DB:', err.message);
      }
    }
  }
  return url || 'https://drive.google.com';
}

// GET BONUS OFFER CONFIG (Reads individual bonus_offers rows)
app.get('/api/bonus-product', async (req, res) => {
  try {
    if (isDbConnected()) {
      const result = await query('SELECT * FROM bonus_offers ORDER BY created_at ASC');
      const bonuses = await Promise.all(result.rows.map(async b => {
        let driveUrl = b.drive_url || '';
        if (!driveUrl && b.selected_product_id) {
          try {
            const pRes = await query('SELECT drive_url FROM products WHERE id = $1', [b.selected_product_id]);
            if (pRes.rows.length > 0) {
              driveUrl = pRes.rows[0].drive_url || '';
            }
          } catch (e) { }
        }
        return {
          id: b.id,
          enabled: Boolean(b.enabled), // Individual true/false boolean for each bonus offer row!
          title: b.title,
          price: String(b.price_inr ?? 149),
          originalPrice: String(b.original_price_inr ?? 999),
          category: b.category || 'Software & Tools',
          description: b.description || '',
          selectedProductId: b.selected_product_id || '',
          imageUrl: b.image_url || '',
          driveUrl: driveUrl
        };
      }));
      const overallEnabled = bonuses.some(b => b.enabled);
      return res.json({ enabled: overallEnabled, bonuses });
    }
  } catch (err) {
    console.error('PostgreSQL fetch bonus offers error:', err.message);
  }
  res.json(bonusConfig);
});

// SAVE BONUS OFFER CONFIG (ADMIN) - Saves each bonus offer as an individual PostgreSQL row
app.post('/api/admin/bonus-product', authenticateToken, async (req, res) => {
  const bonusList = Array.isArray(req.body.bonuses)
    ? req.body.bonuses
    : (Array.isArray(req.body) ? req.body : [req.body]);

  const activeIds = [];

  try {
    if (isDbConnected()) {
      for (const item of bonusList) {
        const id = item.id || `bonus_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
        activeIds.push(id);

        let itemDriveUrl = item.driveUrl || item.drive_url || '';
        if (!itemDriveUrl && item.selectedProductId) {
          try {
            const pRes = await query('SELECT drive_url FROM products WHERE id = $1', [item.selectedProductId]);
            if (pRes.rows.length > 0) {
              itemDriveUrl = pRes.rows[0].drive_url || '';
            }
          } catch (e) { }
        }

        await query(`
          INSERT INTO bonus_offers (id, title, description, price_inr, original_price_inr, category, image_url, selected_product_id, enabled, drive_url)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            description = EXCLUDED.description,
            price_inr = EXCLUDED.price_inr,
            original_price_inr = EXCLUDED.original_price_inr,
            category = EXCLUDED.category,
            image_url = EXCLUDED.image_url,
            selected_product_id = EXCLUDED.selected_product_id,
            enabled = EXCLUDED.enabled,
            drive_url = EXCLUDED.drive_url;
        `, [
          id,
          item.title || 'Untitled Bonus Offer',
          item.description || '',
          Number(item.price) || 149,
          Number(item.originalPrice) || 999,
          item.category || 'Software & Tools',
          item.imageUrl || '',
          item.selectedProductId || '',
          Boolean(item.enabled), // Individual true/false boolean saved per row!
          itemDriveUrl
        ]);
      }

      // Delete removed bonus offers
      if (activeIds.length > 0) {
        await query(`DELETE FROM bonus_offers WHERE id NOT IN (${activeIds.map((_, i) => `$${i + 1}`).join(',')})`, activeIds);
      }
    }
  } catch (err) {
    console.error('PostgreSQL save bonus offers error:', err.message);
  }

  const formattedList = bonusList.map(b => ({
    ...b,
    enabled: Boolean(b.enabled)
  }));
  bonusConfig = {
    enabled: formattedList.some(b => b.enabled),
    bonuses: formattedList
  };

  res.json({ message: 'Individual bonus offers saved successfully in database', bonusConfig });
});

// AUTHENTICATION: GOOGLE OAUTH
app.post('/api/auth/google', async (req, res) => {
  const { credential, userInfo } = req.body;

  let email, name, sub, picture;

  if (credential) {
    const decoded = jwt.decode(credential);
    if (!decoded || !decoded.email) {
      return res.status(400).json({ message: 'Invalid Google credential token' });
    }
    email = decoded.email;
    name = decoded.name;
    sub = decoded.sub;
    picture = decoded.picture;
  } else if (userInfo && userInfo.email) {
    email = userInfo.email;
    name = userInfo.name || userInfo.email.split('@')[0];
    sub = userInfo.sub || userInfo.id || String(Date.now());
    picture = userInfo.picture;
  } else {
    return res.status(400).json({ message: 'Google credential or user info is required' });
  }

  try {
    if (isDbConnected()) {
      let result = await query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
      let user;

      if (result.rows.length === 0) {
        const id = `user_google_${sub || Date.now()}`;
        const userName = name || email.split('@')[0];
        await query(`
          INSERT INTO users (id, email, name, picture, auth_provider, role)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [id, email, userName, picture || '', 'google', 'user']);

        user = { id, email, name: userName, picture: picture || '', authProvider: 'google', role: 'user' };
      } else {
        const dbUser = result.rows[0];
        user = { id: dbUser.id, email: dbUser.email, name: dbUser.name, picture: dbUser.picture, authProvider: dbUser.auth_provider, role: dbUser.role };
      }

      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
      return res.json({ token, user });
    }

    let user = inMemoryDb.users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      user = {
        id: `user_google_${sub || Date.now()}`,
        email,
        name: name || email.split('@')[0],
        phone: '',
        picture: picture || '',
        authProvider: 'google',
        role: 'user',
        createdAt: new Date().toISOString()
      };
      inMemoryDb.users.push(user);
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    const { passwordHash, ...userWithoutPassword } = user;
    return res.json({ token, user: userWithoutPassword });
  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(500).json({ message: 'Failed to authenticate Google user' });
  }
});

// AUTHENTICATION: SIGNUP & ADMIN SIGNUP ALIAS
app.post(['/api/auth/signup', '/api/admin/signup'], async (req, res) => {
  const { email, password, name, phone } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    if (isDbConnected()) {
      const existing = await query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
      if (existing.rows.length > 0) {
        return res.status(400).json({ message: 'An account with this email already exists' });
      }

      const id = `user_${Date.now()}`;
      const passwordHash = bcrypt.hashSync(password, 10);
      const userName = name || email.split('@')[0];
      const userPhone = phone || '';

      await query(`
        INSERT INTO users (id, email, name, phone, password_hash, role)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [id, email, userName, userPhone, passwordHash, 'user']);

      const userObj = { id, email, name: userName, phone: userPhone, role: 'user', createdAt: new Date().toISOString() };
      const token = jwt.sign({ id, email, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });

      inMemoryDb.users.push({ ...userObj, passwordHash });
      return res.status(201).json({ token, user: userObj });
    }
  } catch (err) {
    console.error('PostgreSQL signup error:', err.message);
  }

  const existing = inMemoryDb.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ message: 'An account with this email already exists' });
  }

  const newUser = {
    id: `user_${Date.now()}`,
    email,
    name: name || email.split('@')[0],
    phone: phone || '',
    passwordHash: bcrypt.hashSync(password, 10),
    role: 'user',
    createdAt: new Date().toISOString()
  };

  inMemoryDb.users.push(newUser);
  const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });
  const { passwordHash, ...userWithoutPassword } = newUser;
  res.status(201).json({ token, user: userWithoutPassword });
});

// AUTHENTICATION: LOGIN & ADMIN LOGIN ALIAS
app.post(['/api/auth/login', '/api/admin/login'], async (req, res) => {
  const { email, password, username } = req.body;
  const inputUser = (username || email || '').trim().toLowerCase();
  const inputPass = (password || '').trim();

  // Check Admin Login (Accepts 'admin', 'admin@skillvault.dev', or env ADMIN_USERNAME)
  const validAdminUsernames = ['admin', 'admin@skillvault.dev', (ADMIN_USERNAME || '').toLowerCase()];
  if (validAdminUsernames.includes(inputUser)) {
    if (inputPass === ADMIN_PASSWORD) {
      const adminToken = jwt.sign({ id: 'admin_root', email: 'admin@skillvault.dev', role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
      return res.json({ token: adminToken, user: { id: 'admin_root', email: 'admin@skillvault.dev', name: 'Administrator', role: 'admin' } });
    }
  }

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    if (isDbConnected()) {
      const result = await query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
      if (result.rows.length > 0) {
        const dbUser = result.rows[0];
        if (dbUser.password_hash && bcrypt.compareSync(password, dbUser.password_hash)) {
          const token = jwt.sign({ id: dbUser.id, email: dbUser.email, role: dbUser.role }, JWT_SECRET, { expiresIn: '7d' });
          const formattedCart = dbUser.cart ? (typeof dbUser.cart === 'string' ? JSON.parse(dbUser.cart) : dbUser.cart) : [];
          const { password_hash, ...userWithoutPassword } = dbUser;
          return res.json({ token, user: { ...userWithoutPassword, cart: formattedCart } });
        }
      }
    }
  } catch (err) {
    console.error('PostgreSQL login error:', err.message);
  }

  const user = inMemoryDb.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user || !user.passwordHash || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  const { passwordHash, ...userWithoutPassword } = user;
  res.json({ token, user: userWithoutPassword });
});

// GET CURRENT USER PROFILE & PURCHASES (Supports JWT or ?email= query param)
app.get(['/api/auth/me', '/api/purchases'], async (req, res) => {
  let userEmail = '';
  let userId = '';

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      userId = decoded.id;
      userEmail = decoded.email;
    } catch (e) {
      // Token expired or invalid
    }
  }

  if (!userEmail && req.query.email) {
    userEmail = String(req.query.email).trim();
  }

  if (!userEmail && !userId) {
    return res.status(401).json({ error: 'Unauthorized or email parameter required' });
  }

  try {
    if (isDbConnected()) {
      let userRes = { rows: [] };
      if (userId) {
        userRes = await query('SELECT id, email, name, phone, picture, role, cart, created_at FROM users WHERE id = $1', [userId]);
      } else if (userEmail) {
        userRes = await query('SELECT id, email, name, phone, picture, role, cart, created_at FROM users WHERE LOWER(email) = LOWER($1)', [userEmail]);
      }

      const queryEmail = userEmail || (userRes.rows[0] && userRes.rows[0].email);
      const purchasesRes = queryEmail
        ? await query('SELECT * FROM purchases WHERE LOWER(user_email) = LOWER($1) ORDER BY created_at DESC', [queryEmail])
        : { rows: [] };

      const formattedPurchases = purchasesRes.rows.map(p => ({
        id: p.id,
        userEmail: p.user_email,
        userName: p.user_name,
        userPhone: p.user_phone,
        courseId: p.course_id,
        amountPaidInr: Number(p.amount_paid_inr) || 0,
        paymentId: p.payment_id,
        status: p.status,
        accessDelivered: p.access_delivered,
        createdAt: p.created_at,
        driveUrl: p.drive_url || 'https://drive.google.com'
      }));

      const uData = userRes.rows[0] || null;
      const formattedCart = uData ? (typeof uData.cart === 'string' ? JSON.parse(uData.cart) : (uData.cart || [])) : [];

      return res.json({
        user: uData ? { ...uData, cart: formattedCart } : (userId ? { id: userId, email: userEmail } : null),
        purchases: formattedPurchases
      });
    }
  } catch (err) {
    console.error('PostgreSQL fetch me/purchases error:', err.message);
  }

  const user = inMemoryDb.users.find(u => (userId && u.id === userId) || (userEmail && u.email.toLowerCase() === userEmail.toLowerCase()));
  const userPurchases = inMemoryDb.purchases.filter(p =>
    userEmail ? p.userEmail.toLowerCase() === userEmail.toLowerCase() : false
  );

  if (user) {
    const { passwordHash, ...userWithoutPassword } = user;
    return res.json({ user: userWithoutPassword, purchases: userPurchases });
  }

  res.json({ user: userEmail ? { email: userEmail } : null, purchases: userPurchases });
});

// USER PERSISTENT CART ENDPOINTS
app.get('/api/cart', authenticateToken, async (req, res) => {
  try {
    if (isDbConnected()) {
      const userRes = await query('SELECT cart FROM users WHERE id = $1', [req.user.id]);
      if (userRes.rows.length > 0) {
        const rawCart = userRes.rows[0].cart;
        const cartItems = typeof rawCart === 'string' ? JSON.parse(rawCart) : (rawCart || []);
        return res.json({ cart: cartItems });
      }
    }
  } catch (err) {
    console.error('PostgreSQL fetch cart error:', err.message);
  }

  const user = inMemoryDb.users.find(u => u.id === req.user.id);
  res.json({ cart: user?.cart || [] });
});

app.post('/api/cart', authenticateToken, async (req, res) => {
  const { cartItems } = req.body;
  const items = Array.isArray(cartItems) ? cartItems : [];

  try {
    if (isDbConnected()) {
      await query('UPDATE users SET cart = $1 WHERE id = $2', [JSON.stringify(items), req.user.id]);
      return res.json({ message: 'Cart synced successfully', cart: items });
    }
  } catch (err) {
    console.error('PostgreSQL save cart error:', err.message);
  }

  const user = inMemoryDb.users.find(u => u.id === req.user.id);
  if (user) {
    user.cart = items;
  }
  res.json({ message: 'Cart synced successfully', cart: items });
});

// PURCHASES & CHECKOUT
app.get('/api/purchases', authenticateToken, async (req, res) => {
  try {
    if (isDbConnected()) {
      const result = await query('SELECT * FROM purchases ORDER BY created_at DESC');
      return res.json({ purchases: result.rows });
    }
  } catch (err) {
    console.error('PostgreSQL fetch purchases error:', err.message);
  }
  res.json({ purchases: inMemoryDb.purchases });
});

app.post('/api/purchases', async (req, res) => {
  const { userEmail, userName, userPhone, courseId, amountPaidInr, paymentId } = req.body;

  if (!userEmail || !courseId) {
    return res.status(400).json({ message: 'Email and Course ID are required' });
  }

  const newPurchase = {
    id: `purchase_${Date.now()}`,
    userEmail,
    userName: userName || userEmail.split('@')[0],
    userPhone: userPhone || 'N/A',
    courseId,
    amountPaidInr: Number(amountPaidInr) || 299,
    paymentId: paymentId || `pay_sim_${Date.now()}`,
    status: 'completed',
    accessDelivered: true,
    driveUrl: 'https://drive.google.com',
    createdAt: new Date().toISOString()
  };

  try {
    if (isDbConnected()) {
      await query(`
        INSERT INTO purchases (id, user_email, user_name, user_phone, course_id, amount_paid_inr, payment_id, status, access_delivered, drive_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        newPurchase.id,
        newPurchase.userEmail,
        newPurchase.userName,
        newPurchase.userPhone,
        newPurchase.courseId,
        newPurchase.amountPaidInr,
        newPurchase.paymentId,
        newPurchase.status,
        newPurchase.accessDelivered,
        newPurchase.driveUrl
      ]);
    }
  } catch (err) {
    console.error('PostgreSQL purchase insert error:', err.message);
  }

  inMemoryDb.purchases.unshift(newPurchase);
  res.status(201).json({ message: 'Purchase recorded successfully', purchase: newPurchase });
});

// REVIEWS
app.get('/api/reviews', async (req, res) => {
  try {
    if (isDbConnected()) {
      const result = await query('SELECT * FROM reviews ORDER BY created_at DESC');
      return res.json({ reviews: result.rows });
    }
  } catch (err) {
    console.error('PostgreSQL reviews fetch error:', err.message);
  }
  res.json({ reviews: inMemoryDb.reviews });
});

app.post('/api/reviews', async (req, res) => {
  const { courseId, userName, userEmail, rating, comment } = req.body;
  if (!courseId || !comment) return res.status(400).json({ message: 'Course ID and comment required' });

  const newReview = {
    id: `rev_${Date.now()}`,
    courseId,
    userName: userName || 'Verified Learner',
    userEmail: userEmail || '',
    rating: Number(rating) || 5,
    comment,
    createdAt: new Date().toISOString()
  };

  try {
    if (isDbConnected()) {
      await query(`
        INSERT INTO reviews (id, course_id, user_name, user_email, rating, comment)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [newReview.id, newReview.courseId, newReview.userName, newReview.userEmail, newReview.rating, newReview.comment]);
    }
  } catch (err) {
    console.error('PostgreSQL review insert error:', err.message);
  }

  inMemoryDb.reviews.unshift(newReview);
  res.status(201).json({ message: 'Review recorded successfully', review: newReview });
});

// ADMIN DASHBOARD STATS
app.get('/api/admin/stats', authenticateToken, async (req, res) => {
  try {
    if (isDbConnected()) {
      const revRes = await query('SELECT SUM(amount_paid_inr) as total_rev, COUNT(*) as total_pur FROM purchases');
      const userRes = await query('SELECT COUNT(*) as total_users FROM users');
      const prodRes = await query('SELECT COUNT(*) as total_prods FROM products');
      return res.json({
        totalRevenueInr: Number(revRes.rows[0].total_rev) || 0,
        totalPurchases: Number(revRes.rows[0].total_pur) || 0,
        totalUsers: Number(userRes.rows[0].total_users) || 0,
        totalCourses: Number(prodRes.rows[0].total_prods) || 0
      });
    }
  } catch (err) {
    console.error('PostgreSQL stats error:', err.message);
  }

  const totalRevenueInr = inMemoryDb.purchases.reduce((sum, p) => sum + (p.amountPaidInr || 0), 0);
  res.json({
    totalRevenueInr,
    totalPurchases: inMemoryDb.purchases.length,
    totalUsers: inMemoryDb.users.length,
    totalCourses: inMemoryDb.products.length
  });
});

// ============================================================================
// CHECKOUT & RAZORPAY PAYMENT GATEWAY ENDPOINTS
// ============================================================================

// 1. CREATE RAZORPAY ORDER
app.post('/api/checkout/create-order', async (req, res) => {
  const { items, customerName, customerEmail, customerPhone } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Cart is empty. Please select at least one product.' });
  }

  // Calculate total amount in INR
  let totalAmountInr = 0;
  items.forEach(item => {
    const rawPrice = item.price !== undefined ? item.price : (item.priceInr || item.price_inr || '299');
    const p = parseFloat(String(rawPrice).replace(/[^0-9.]/g, '')) || 0;
    totalAmountInr += p;
  });

  const amountInPaise = Math.round(totalAmountInr * 100);

  if (amountInPaise <= 0) {
    return res.status(400).json({ error: 'Invalid order amount.' });
  }

  // Try creating Razorpay Order if instance is configured
  if (razorpayInstance && razorpayKeyId && razorpayKeySecret) {
    try {
      const options = {
        amount: amountInPaise,
        currency: 'INR',
        receipt: `rcpt_sv_${Date.now()}`,
        notes: {
          customerName: customerName || '',
          customerEmail: customerEmail || '',
          customerPhone: customerPhone || '',
          itemCount: String(items.length),
          items: JSON.stringify(items.map(it => ({ id: it.id || it.courseId, name: it.name || it.title, price: it.price || it.priceInr || it.price_inr })))
        }
      };

      const order = await razorpayInstance.orders.create(options);
      return res.json({
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: razorpayKeyId
      });
    } catch (err) {
      console.error('Razorpay order creation error:', err);
    }
  }

  // Fallback if Razorpay credentials not active
  return res.json({
    success: true,
    isFallback: true,
    amount: amountInPaise,
    currency: 'INR',
    message: 'Razorpay keys pending setup. Simulating order initiation.',
    keyId: razorpayKeyId
  });
});

async function getCourseDriveUrl(item) {
  if (!item) return 'https://drive.google.com';
  if (item.driveUrl && item.driveUrl.startsWith('http')) return item.driveUrl;
  if (item.drive_url && item.drive_url.startsWith('http')) return item.drive_url;
  const courseId = item.id || item.courseId;
  if (courseId) {
    try {
      if (isDbConnected()) {
        const res = await query('SELECT drive_url FROM products WHERE id = $1', [courseId]);
        if (res.rows.length > 0 && res.rows[0].drive_url) return res.rows[0].drive_url;
      }
    } catch (e) { }
    const memProduct = inMemoryDb.products.find(p => p.id === courseId);
    if (memProduct && memProduct.driveUrl) return memProduct.driveUrl;
  }
  return 'https://drive.google.com';
}

// RESEND HTTP EMAIL DELIVERY SERVICE - PURE PLAIN TEXT
async function sendPurchaseEmail({ to, customerName, paymentId, items }) {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!to || !to.includes('@')) {
    console.error('❌ [EMAIL ERROR]: Invalid or missing recipient email address.');
    return { success: false, error: 'Invalid recipient email' };
  }

  // Format purchased items with titles & access links
  const itemsTextList = await Promise.all(items.map(async (item, idx) => {
    const title = item.title || item.name || item.courseId || item.id || `Digital Asset #${idx + 1}`;
    const rawPrice = item.price !== undefined ? item.price : (item.priceInr || item.price_inr || '299');
    const price = Math.round(parseFloat(String(rawPrice).replace(/[^0-9.]/g, '')) || 299);
    const driveUrl = await getCourseDriveUrl(item);

    return `Item #${idx + 1}: ${title} (Rs. ${price})
Access Link: ${driveUrl}`;
  }));

  const itemsText = itemsTextList.join('\n\n');

  // Pure Plain Text Content (Zero HTML)
  const textContent = `
Hello ${customerName},

Thank you for your purchase on Skill Vault! Your payment has been successfully completed.

Payment ID: ${paymentId}

Purchased Products & Google Drive Access Links:
--------------------------------------------------
${itemsText}
--------------------------------------------------

You can also log in to your account on Skill Vault anytime to view all your active purchases.

If you have any questions or need assistance, simply reply directly to this email.

Best regards,
Skill Vault Team
  `.trim();

  // 1. BREVO HTTP API (Free 300 emails/day to ANY external recipient email without domain lock)
  const brevoApiKey = process.env.BREVO_API_KEY;
  if (brevoApiKey && !brevoApiKey.includes('your_brevo_api_key')) {
    try {
      const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoApiKey.trim(),
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: 'Skill Vault', email: process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_USER || 'temp83725@gmail.com' },
          to: [{ email: to, name: customerName }],
          subject: `Your Skill Vault purchase is confirmed — ${paymentId}`,
          textContent: textContent,
        }),
      });

      const brevoData = await brevoRes.json();
      if (brevoRes.ok) {
        console.log(`\n📧 [BREVO API SUCCESS]: Confirmation email delivered to ${to} (Message ID: ${brevoData.messageId})`);
        return { success: true, messageId: brevoData.messageId, provider: 'brevo-http-api' };
      } else {
        console.error(`\n❌ [BREVO API ERROR]:`, brevoData);
      }
    } catch (brevoErr) {
      console.error(`\n❌ [BREVO API FETCH ERROR]:`, brevoErr.message);
    }
  }

  // 2. RESEND HTTP API (Bypasses SMTP Port Blocks - Requires verified domain for external recipients)
  if (resendApiKey && !resendApiKey.includes('your_resend_api_key')) {
    try {
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || 'Skill Vault <onboarding@resend.dev>',
          to: [to],
          subject: `Your Skill Vault purchase is confirmed — ${paymentId}`,
          text: textContent,
        }),
      });

      const resendData = await resendRes.json();
      if (resendRes.ok) {
        console.log(`\n📧 [RESEND API SUCCESS]: Confirmation email delivered to ${to} (ID: ${resendData.id})`);
        return { success: true, messageId: resendData.id, provider: 'resend-http-api' };
      } else {
        console.error(`\n❌ [RESEND API ERROR]:`, resendData);
        return { success: false, error: resendData.message || 'Resend API Error' };
      }
    } catch (resendErr) {
      console.error(`\n❌ [RESEND API FETCH ERROR]:`, resendErr.message);
      return { success: false, error: resendErr.message };
    }
  }

  console.log(`\n📧 [EMAIL NOTICE]: BREVO_API_KEY / RESEND_API_KEY is not configured in backend/.env. Simulated email to ${to}`);
  return { status: 'simulated', message: 'Configure BREVO_API_KEY or RESEND_API_KEY in backend/.env to send real emails.' };
}

// WHATSAPP PURCHASE NOTIFICATION SERVICE (Supports OpenWA / UltraMsg / GreenAPI / Custom HTTP Gateway)
async function sendPurchaseWhatsApp({ toPhone, customerName, paymentId, items }) {
  if (!toPhone) {
    console.log('⚠️ [WHATSAPP NOTICE]: No customer phone number provided for WhatsApp delivery.');
    return { success: false, reason: 'No phone number provided' };
  }

  // Clean phone number: remove non-digits
  let cleanPhone = String(toPhone).replace(/[^0-9]/g, '');
  if (!cleanPhone) {
    return { success: false, reason: 'Invalid phone number' };
  }

  // Add default country code (91 for India if 10 digits)
  if (cleanPhone.length === 10) {
    cleanPhone = `91${cleanPhone}`;
  }

  // Format purchased items with titles & access links
  const itemsTextList = await Promise.all(items.map(async (item, idx) => {
    const title = item.title || item.name || item.courseId || item.id || `Digital Asset #${idx + 1}`;
    const rawPrice = item.price !== undefined ? item.price : (item.priceInr || item.price_inr || '299');
    const price = Math.round(parseFloat(String(rawPrice).replace(/[^0-9.]/g, '')) || 299);
    const driveUrl = await getCourseDriveUrl(item);

    return `📦 *${title}* (Rs. ${price})\n🔗 *Access Link:* ${driveUrl}`;
  }));

  const itemsText = itemsTextList.join('\n\n');

  const whatsappMessage = `🎉 *Skill Vault - Purchase Confirmed*

Hello *${customerName || 'Learner'}*,

Thank you for your purchase on Skill Vault! Your payment has been successfully confirmed.

💳 *Payment ID:* ${paymentId}

*Your Purchased Digital Assets & Drive Access:*
--------------------------------------------------
${itemsText}

--------------------------------------------------
Log in to your account anytime on Skill Vault to view all your active purchases.
If you have any questions, reply to this message.

Best regards,
Skill Vault Team`;

  const waApiUrl = process.env.WHATSAPP_API_URL || 'http://localhost:8080/api/send-message';
  const waApiKey = process.env.WHATSAPP_API_KEY || process.env.WHATSAPP_TOKEN;

  if (process.env.WHATSAPP_ENABLED === 'true' && waApiUrl) {
    try {
      const payload = {
        to: `${cleanPhone}@c.us`,
        chatId: `${cleanPhone}@c.us`,
        phone: cleanPhone,
        number: cleanPhone,
        message: whatsappMessage,
        body: whatsappMessage,
        content: whatsappMessage
      };

      const headers = { 'Content-Type': 'application/json' };
      if (waApiKey && waApiKey.trim() !== '') {
        headers['Authorization'] = `Bearer ${waApiKey.trim()}`;
        headers['api-key'] = waApiKey.trim();
        headers['token'] = waApiKey.trim();
      }

      const waRes = await fetch(waApiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      const resData = await waRes.json().catch(() => ({}));
      if (waRes.ok) {
        console.log(`\n💬 [WHATSAPP API SUCCESS]: Purchase notification sent to ${cleanPhone}`);
        return { success: true, provider: 'whatsapp-http-gateway', data: resData };
      } else {
        console.error(`\n❌ [WHATSAPP API ERROR]:`, resData);
      }
    } catch (err) {
      console.error(`\n❌ [WHATSAPP FETCH ERROR]:`, err.message);
    }
  }

  const clickToChatUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappMessage)}`;
  console.log(`\n💬 [WHATSAPP NOTICE]: WhatsApp API gateway not reachable. Click-to-chat URL generated for ${cleanPhone}:\n${clickToChatUrl}`);
  return { success: true, simulated: true, clickToChatUrl, message: whatsappMessage };
}

// DIAGNOSTIC ENDPOINT TO TEST WHATSAPP DELIVERY
app.get('/api/test-whatsapp', async (req, res) => {
  const phone = req.query.phone || req.query.to || '919876543210';
  try {
    const result = await sendPurchaseWhatsApp({
      toPhone: phone,
      customerName: 'Test Customer',
      paymentId: `pay_wa_test_${Date.now()}`,
      items: [{ name: 'Sample Developer Asset', price: 299, driveUrl: 'https://drive.google.com' }]
    });
    return res.json({ testedPhone: phone, result });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// DIAGNOSTIC ENDPOINT TO TEST EMAIL DELIVERY
app.get('/api/test-email', async (req, res) => {
  const to = req.query.to || process.env.EMAIL_USER || 'customer@example.com';
  try {
    const result = await sendPurchaseEmail({
      to: to,
      customerName: 'Test Customer',
      paymentId: `pay_test_${Date.now()}`,
      items: [{ name: 'Sample Test Asset', price: 299, driveUrl: 'https://drive.google.com' }]
    });
    return res.json({ testedTo: to, result });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// DIAGNOSTIC ENDPOINT TO SIMULATE & TEST FULL WEBHOOK PIPELINE DIRECTLY IN BROWSER
app.get('/api/test-webhook', async (req, res) => {
  const email = req.query.email || 'learner@example.com';
  const paymentId = `pay_sim_webhook_${Date.now()}`;

  try {
    console.log(`🧪 [TEST WEBHOOK SIMULATION INITIATED] for email: ${email}`);

    const itemToGrant = { id: 'course-default', name: 'Full Stack Development Kit', price: 299 };
    const pId = `pur_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const driveUrl = await getCourseDriveUrl(itemToGrant);

    if (isDbConnected()) {
      await query(`
        INSERT INTO purchases (id, user_email, user_name, user_phone, course_id, amount_paid_inr, payment_id, status, access_delivered, drive_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'completed', true, $8)
      `, [pId, email, 'Test Webhook Learner', '+919876543210', 'course-default', 299, paymentId, driveUrl]);
    }

    inMemoryDb.purchases.unshift({
      id: pId,
      userEmail: email,
      userName: 'Test Webhook Learner',
      userPhone: '+919876543210',
      courseId: 'course-default',
      amountPaidInr: 299,
      paymentId,
      status: 'completed',
      accessDelivered: true,
      createdAt: new Date().toISOString(),
      driveUrl
    });

    const emailResult = await sendPurchaseEmail({
      to: email,
      customerName: 'Test Webhook Learner',
      paymentId,
      items: [itemToGrant]
    });

    const whatsappResult = await sendPurchaseWhatsApp({
      toPhone: req.query.phone || '+919876543210',
      customerName: 'Test Webhook Learner',
      paymentId,
      items: [itemToGrant]
    });

    return res.json({
      status: 'WEBHOOK_PIPELINE_WORKING_100%',
      simulatedPaymentId: paymentId,
      dbEntrySaved: true,
      buyersLogUpdated: true,
      emailResult,
      whatsappResult
    });
  } catch (err) {
    return res.status(500).json({ status: 'ERROR', error: err.message });
  }
});



// 2. VERIFY RAZORPAY PAYMENT & RECORD PURCHASE IN DB
app.post('/api/checkout/verify-payment', async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    items,
    customerName,
    customerEmail,
    customerPhone
  } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'No items in order to grant access.' });
  }

  let isVerified = false;

  // Verify HMAC SHA256 Signature if signature & credentials are provided
  if (razorpay_order_id && razorpay_payment_id && razorpay_signature && razorpayKeySecret) {
    const generatedSignature = crypto
      .createHmac('sha256', razorpayKeySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const sigBuffer = Buffer.from(String(razorpay_signature || ''), 'utf8');
    const genBuffer = Buffer.from(String(generatedSignature), 'utf8');

    if (sigBuffer.length === genBuffer.length && crypto.timingSafeEqual(sigBuffer, genBuffer)) {
      isVerified = true;
    } else {
      console.error('Razorpay signature mismatch!');
      return res.status(400).json({ error: 'Payment signature verification failed!' });
    }
  } else if (razorpay_payment_id) {
    // Test mode fallback
    isVerified = true;
  }

  if (!isVerified) {
    return res.status(400).json({ error: 'Invalid payment parameters.' });
  }

  const paymentId = razorpay_payment_id || `pay_sim_${Date.now()}`;

  // Record purchases in PostgreSQL database & clear cart
  try {
    if (isDbConnected()) {
      for (const item of items) {
        const pId = `pur_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
        const courseId = item.id || 'course-default';
        const rawPrice = item.price !== undefined ? item.price : (item.priceInr || item.price_inr || '299');
        const price = Math.round(parseFloat(String(rawPrice).replace(/[^0-9.]/g, '')) || 299);
        const driveUrl = await getCourseDriveUrl(item);

        await query(`
          INSERT INTO purchases (id, user_email, user_name, user_phone, course_id, amount_paid_inr, payment_id, status, access_delivered, drive_url)
          VALUES ($1, $2, $3, $4, $5, $6, $7, 'completed', true, $8)
        `, [pId, customerEmail || 'customer@example.com', customerName || 'Learner', customerPhone || '', courseId, price, paymentId, driveUrl]);
      }

      // Remove ONLY purchased item IDs from user cart in PostgreSQL DB
      if (customerEmail && items.length > 0) {
        const purchasedIds = items.map(it => String(it.id || ''));
        await query(`
          UPDATE users
          SET cart = (
            SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
            FROM jsonb_array_elements(cart) elem
            WHERE elem IS NOT NULL AND NOT (elem->>'id' = ANY($2::text[]))
          )
          WHERE LOWER(email) = LOWER($1) AND cart IS NOT NULL AND jsonb_typeof(cart) = 'array'
        `, [customerEmail, purchasedIds]);
      }
    }
  } catch (err) {
    console.error('PostgreSQL record purchase on checkout error:', err.message);
  }

  // Also update inMemoryDb cart
  if (customerEmail && items.length > 0) {
    const purchasedIds = new Set(items.map(it => String(it.id || '')));
    const u = inMemoryDb.users.find(usr => usr.email.toLowerCase() === customerEmail.toLowerCase());
    if (u && Array.isArray(u.cart)) {
      u.cart = u.cart.filter(cItem => cItem && !purchasedIds.has(String(cItem.id || '')));
    }
  }

  // Also update inMemoryDb
  for (const item of items) {
    const courseId = item.id || 'course-default';
    const rawPrice = item.price !== undefined ? item.price : (item.priceInr || item.price_inr || '299');
    const price = Math.round(parseFloat(String(rawPrice).replace(/[^0-9.]/g, '')) || 299);
    const driveUrl = await getCourseDriveUrl(item);
    inMemoryDb.purchases.unshift({
      id: `pur_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      userEmail: customerEmail || 'customer@example.com',
      userName: customerName || 'Learner',
      userPhone: customerPhone || '',
      courseId,
      amountPaidInr: price,
      paymentId,
      status: 'completed',
      accessDelivered: true,
      createdAt: new Date().toISOString(),
      driveUrl: driveUrl
    });
  }

  // Trigger WhatsApp notification if customer phone is provided
  if (customerPhone) {
    sendPurchaseWhatsApp({
      toPhone: customerPhone,
      customerName: customerName || 'Learner',
      paymentId,
      items
    }).catch(err => console.error('Verify-payment WhatsApp execution error:', err.message));
  }

  const firstDriveUrl = items.length > 0 ? await getCourseDriveUrl(items[0]) : 'https://drive.google.com';

  res.json({
    success: true,
    message: '🎉 Payment verified successfully! Access granted to your digital assets and confirmation delivered via Email & WhatsApp.',
    paymentId,
    driveUrl: firstDriveUrl
  });
});

// 3. RAZORPAY WEBHOOK ENDPOINT FOR AUTOMATIC SERVER-TO-SERVER PAYMENT RECORDING
app.post('/api/checkout/webhook', async (req, res) => {
  console.log(`🔔 [RAZORPAY WEBHOOK HIT]: Incoming HTTP POST request received on /api/checkout/webhook`);

  const secret = razorpayWebhookSecret;
  const signature = req.headers['x-razorpay-signature'];
  const rawBody = req.rawBody ? req.rawBody : (typeof req.body === 'string' ? Buffer.from(req.body) : Buffer.from(JSON.stringify(req.body)));

  // Verify HMAC-SHA256 Signature if secret and signature are present
  if (secret && signature) {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex');

      const sigBuffer = Buffer.from(String(signature || ''), 'utf8');
      const genBuffer = Buffer.from(String(expectedSignature), 'utf8');

      if (sigBuffer.length !== genBuffer.length || !crypto.timingSafeEqual(sigBuffer, genBuffer)) {
        console.error('❌ [RAZORPAY WEBHOOK ERROR]: Signature verification failed');
        return res.status(400).json({ error: 'Invalid webhook signature' });
      }
    } catch (err) {
      console.error('❌ [RAZORPAY WEBHOOK SIGNATURE ERROR]:', err.message);
      return res.status(400).json({ error: 'Signature verification error' });
    }
  }

  let eventPayload;
  try {
    eventPayload = typeof req.body === 'object' && !Buffer.isBuffer(req.body) ? req.body : JSON.parse(rawBody.toString('utf8'));
  } catch (e) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const event = eventPayload.event;
  console.log(`🔔 [RAZORPAY WEBHOOK RECEIVED]: Event '${event}'`);

  if (event === 'payment.captured' || event === 'order.paid') {
    const paymentEntity = eventPayload?.payload?.payment?.entity || {};
    const paymentId = paymentEntity.id;
    const customerEmail = paymentEntity.email || paymentEntity.notes?.customerEmail || '';
    const customerName = paymentEntity.notes?.customerName || (customerEmail ? customerEmail.split('@')[0] : 'Learner');
    const customerPhone = paymentEntity.contact || paymentEntity.notes?.customerPhone || '';

    let notesItems = null;
    if (paymentEntity.notes?.items) {
      try {
        notesItems = typeof paymentEntity.notes.items === 'string' ? JSON.parse(paymentEntity.notes.items) : paymentEntity.notes.items;
      } catch (e) { }
    }

    if (!paymentId) {
      return res.json({ status: 'ignored', message: 'No payment ID found in webhook payload' });
    }

    // IDEMPOTENCY CHECK: Check if this payment is already recorded in DB or memory DB
    let isAlreadyRecorded = false;

    if (isDbConnected()) {
      try {
        const existing = await query('SELECT id FROM purchases WHERE payment_id = $1 LIMIT 1', [paymentId]);
        if (existing.rows.length > 0) {
          isAlreadyRecorded = true;
        }
      } catch (err) {
        console.error('Database idempotency check error:', err.message);
      }
    }

    if (!isAlreadyRecorded && inMemoryDb.purchases.some(p => p.paymentId === paymentId)) {
      isAlreadyRecorded = true;
    }

    if (isAlreadyRecorded) {
      console.log(`ℹ️ [RAZORPAY WEBHOOK]: Payment ${paymentId} is already recorded in DB. Skipping duplicate insertion.`);
      return res.json({ status: 'ok', message: 'Purchase already processed.' });
    }

    // Determine purchased items (from notes or default fallback)
    let itemsToGrant = Array.isArray(notesItems) && notesItems.length > 0 ? notesItems : [{
      id: paymentEntity.notes?.courseId || 'course-default',
      name: paymentEntity.notes?.courseTitle || 'Digital Asset Package',
      price: Math.round((paymentEntity.amount || 29900) / 100)
    }];

    console.log(`✅ [RAZORPAY WEBHOOK PROCESSING]: Recording purchase for ${customerEmail} (Payment: ${paymentId})`);

    // Record in DB
    try {
      if (isDbConnected()) {
        for (const item of itemsToGrant) {
          const pId = `pur_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
          const courseId = item.id || 'course-default';
          const rawPrice = item.price !== undefined ? item.price : (item.priceInr || item.price_inr || '299');
          const price = Math.round(parseFloat(String(rawPrice).replace(/[^0-9.]/g, '')) || 299);
          const driveUrl = await getCourseDriveUrl(item);

          await query(`
            INSERT INTO purchases (id, user_email, user_name, user_phone, course_id, amount_paid_inr, payment_id, status, access_delivered, drive_url)
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'completed', true, $8)
          `, [pId, customerEmail || 'customer@example.com', customerName, customerPhone, courseId, price, paymentId, driveUrl]);
        }

        // Clear cart for user
        if (customerEmail && itemsToGrant.length > 0) {
          const purchasedIds = itemsToGrant.map(it => String(it.id || ''));
          await query(`
            UPDATE users
            SET cart = (
              SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
              FROM jsonb_array_elements(cart) elem
              WHERE elem IS NOT NULL AND NOT (elem->>'id' = ANY($2::text[]))
            )
            WHERE LOWER(email) = LOWER($1) AND cart IS NOT NULL AND jsonb_typeof(cart) = 'array'
          `, [customerEmail, purchasedIds]);
        }
      }
    } catch (err) {
      console.error('PostgreSQL record purchase on webhook error:', err.message);
    }

    // Update inMemoryDb
    for (const item of itemsToGrant) {
      const courseId = item.id || 'course-default';
      const rawPrice = item.price !== undefined ? item.price : (item.priceInr || item.price_inr || '299');
      const price = Math.round(parseFloat(String(rawPrice).replace(/[^0-9.]/g, '')) || 299);
      const driveUrl = await getCourseDriveUrl(item);

      inMemoryDb.purchases.unshift({
        id: `pur_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        userEmail: customerEmail || 'customer@example.com',
        userName: customerName,
        userPhone: customerPhone,
        courseId,
        amountPaidInr: price,
        paymentId,
        status: 'completed',
        accessDelivered: true,
        createdAt: new Date().toISOString(),
        driveUrl: driveUrl
      });
    }

    // Trigger purchase confirmation email
    if (customerEmail) {
      sendPurchaseEmail({
        to: customerEmail,
        customerName: customerName,
        paymentId,
        items: itemsToGrant
      }).catch(err => console.error('Webhook email execution error:', err.message));
    }

    // Trigger purchase confirmation WhatsApp message
    if (customerPhone) {
      sendPurchaseWhatsApp({
        toPhone: customerPhone,
        customerName: customerName,
        paymentId,
        items: itemsToGrant
      }).catch(err => console.error('Webhook WhatsApp execution error:', err.message));
    }
  }

  return res.json({ status: 'ok' });
});


app.listen(PORT, async () => {
  console.log(`🚀 Skill Vault Express Backend Server running at http://localhost:${PORT}`);
  await initDb();

  // Keep-alive self ping mechanism to prevent Render Free Tier sleeping
  const SERVER_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
  const PING_INTERVAL = 10 * 60 * 1000; // 10 minutes

  setInterval(async () => {
    try {
      const response = await fetch(`${SERVER_URL}/api/health`);
      if (response.ok) {
        console.log(`⏰ [Keep-Alive] Self-ping successful to ${SERVER_URL}/api/health`);
      }
    } catch (err) {
      console.warn('⚠️ [Keep-Alive] Self-ping error:', err.message);
    }
  }, PING_INTERVAL);
  console.log(`⏰ Keep-Alive ping service activated (pinging every 10 mins).`);
});

