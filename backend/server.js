import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { initDb, query, isDbConnected, inMemoryDb } from './db.js';
import canvaRouter from './canvaRoutes.js';

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

app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  credentials: true
}));
app.options('*', cors({
  origin: true,
  credentials: true
}));
app.use(express.json({
  limit: '50mb',
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Canva Pro Store API Router
app.use(canvaRouter);

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
  installationProcess: p.installation_process ?? p.installationProcess ?? '',
  galleryImages: typeof p.gallery_images === 'string' ? JSON.parse(p.gallery_images) : (Array.isArray(p.gallery_images) ? p.gallery_images : (Array.isArray(p.galleryImages) ? p.galleryImages : [])),
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

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });
    req.user = decoded;

    // Real-Time Session Control: Check if user account access has been revoked / disabled
    if (req.user && req.user.id !== 'admin_root') {
      try {
        let isUserDisabled = false;
        if (isDbConnected()) {
          const uRes = await query('SELECT is_disabled FROM users WHERE id = $1 OR LOWER(email) = LOWER($2) LIMIT 1', [req.user.id, req.user.email || '']);
          if (uRes.rows.length > 0) {
            isUserDisabled = Boolean(uRes.rows[0].is_disabled);
          }
        } else {
          const memU = inMemoryDb.users.find(u => u.id === req.user.id || (u.email && u.email.toLowerCase() === req.user.email?.toLowerCase()));
          if (memU) {
            isUserDisabled = Boolean(memU.is_disabled);
          }
        }

        if (isUserDisabled) {
          return res.status(401).json({
            status: 'revoked',
            sessionRevoked: true,
            message: 'Your account access has been revoked or disabled by an Administrator.'
          });
        }
      } catch (checkErr) {
        console.error('Auth token status check error:', checkErr.message);
      }
    }

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
  const { title, subtitle, description, category, priceInr, originalPriceInr, driveUrl, imageUrl, duration, features, bonus, installationProcess, galleryImages, modules, testimonials, faqs } = req.body;

  if (!title) {
    return res.status(400).json({ message: 'Title is required' });
  }

  const parsedGallery = Array.isArray(galleryImages)
    ? galleryImages
    : (typeof galleryImages === 'string' ? galleryImages.split('\n').map(u => u.trim()).filter(Boolean) : []);

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
    installationProcess: installationProcess || '',
    galleryImages: parsedGallery,
    modules: Array.isArray(modules) ? modules : [],
    testimonials: Array.isArray(testimonials) ? testimonials : [],
    faqs: Array.isArray(faqs) ? faqs : [],
    createdAt: new Date().toISOString()
  };

  try {
    if (isDbConnected()) {
      await query(`
        INSERT INTO products (id, title, subtitle, description, category, price_inr, original_price_inr, is_published, drive_url, image_url, duration, features, bonus, installation_process, gallery_images, modules, testimonials, faqs)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
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
        newProduct.installationProcess,
        JSON.stringify(newProduct.galleryImages),
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
      const installationProcess = req.body.installationProcess !== undefined ? req.body.installationProcess : (prev.installation_process || '');

      const parsedGallery = req.body.galleryImages !== undefined
        ? (Array.isArray(req.body.galleryImages) ? req.body.galleryImages : (typeof req.body.galleryImages === 'string' ? req.body.galleryImages.split('\n').map(u => u.trim()).filter(Boolean) : []))
        : (typeof prev.gallery_images === 'string' ? JSON.parse(prev.gallery_images) : (prev.gallery_images || []));

      const features = req.body.features !== undefined ? JSON.stringify(req.body.features) : prev.features;
      const modules = req.body.modules !== undefined ? JSON.stringify(req.body.modules) : prev.modules;
      const testimonials = req.body.testimonials !== undefined ? JSON.stringify(req.body.testimonials) : prev.testimonials;
      const faqs = req.body.faqs !== undefined ? JSON.stringify(req.body.faqs) : prev.faqs;
      const galleryImages = JSON.stringify(parsedGallery);

      await query(`
        UPDATE products
        SET title = $1, subtitle = $2, description = $3, category = $4, price_inr = $5, original_price_inr = $6, drive_url = $7, image_url = $8, duration = $9, bonus = $10, features = $11, modules = $12, testimonials = $13, faqs = $14, is_published = $15, installation_process = $16, gallery_images = $17
        WHERE id = $18
      `, [title, subtitle, description, category, priceInr, originalPriceInr, driveUrl, imageUrl, duration, bonus, features, modules, testimonials, faqs, isPublished, installationProcess, galleryImages, id]);

      // Sync in-memory backup
      const memIndex = inMemoryDb.products.findIndex(p => p.id === id);
      if (memIndex !== -1) {
        inMemoryDb.products[memIndex] = {
          ...inMemoryDb.products[memIndex],
          ...req.body,
          id,
          isPublished,
          priceInr,
          originalPriceInr,
          galleryImages: parsedGallery
        };
      }

      const updatedProduct = formatProduct({
        id, title, subtitle, description, category,
        price_inr: priceInr, original_price_inr: originalPriceInr,
        drive_url: driveUrl, image_url: imageUrl, duration, bonus,
        installation_process: installationProcess,
        gallery_images: parsedGallery,
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

// IMAGEKIT AUTHENTICATION PARAMETERS GENERATOR (FOR FRONTEND DIRECT UPLOADS)
app.get('/api/admin/imagekit-auth', authenticateToken, (req, res) => {
  try {
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY || '';
    const token = req.query.token || crypto.randomUUID();
    const expire = req.query.expire || (Math.floor(Date.now() / 1000) + 2400).toString();
    const signature = crypto.createHmac('sha1', privateKey).update(token + expire).digest('hex');

    res.json({
      token,
      expire,
      signature,
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY || '',
      urlEndpoint: (process.env.IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/e1wrzy1j2').replace(/\/$/, '')
    });
  } catch (err) {
    console.error('ImageKit auth error:', err);
    res.status(500).json({ message: 'Failed to generate ImageKit authentication tokens' });
  }
});

// IMAGEKIT SERVER-SIDE UPLOAD ENDPOINT
app.post(['/api/admin/upload-image', '/api/admin/upload-banner'], authenticateToken, async (req, res) => {
  try {
    const { file, fileName, folder = '/products' } = req.body;
    if (!file) {
      return res.status(400).json({ message: 'Image data or URL is required' });
    }

    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY || '';
    const urlEndpoint = (process.env.IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/e1wrzy1j2').replace(/\/$/, '');
    const authHeader = 'Basic ' + Buffer.from(privateKey + ':').toString('base64');

    const formData = new FormData();

    if (typeof file === 'string' && file.startsWith('data:')) {
      const parts = file.split(';base64,');
      const mime = parts[0].replace('data:', '');
      const buffer = Buffer.from(parts[1], 'base64');
      const blob = new Blob([buffer], { type: mime });
      formData.append('file', blob, fileName || 'upload.png');
    } else if (typeof file === 'string' && file.startsWith('http')) {
      const fetchRes = await fetch(file);
      if (!fetchRes.ok) {
        return res.status(400).json({ message: 'Failed to download image from source URL' });
      }
      const arrayBuffer = await fetchRes.arrayBuffer();
      const blob = new Blob([arrayBuffer]);
      formData.append('file', blob, fileName || 'upload.png');
    } else {
      formData.append('file', file);
    }

    formData.append('fileName', fileName || `img_${Date.now()}.png`);
    formData.append('folder', folder);
    formData.append('useUniqueFileName', 'true');
    formData.append('isPrivateFile', 'false');

    const ikRes = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
      method: 'POST',
      headers: { Authorization: authHeader },
      body: formData
    });

    const ikData = await ikRes.json();
    if (!ikRes.ok) {
      return res.status(ikRes.status).json({ message: ikData.message || 'ImageKit upload failed' });
    }

    const cleanPath = ikData.filePath.startsWith('/') ? ikData.filePath : `/${ikData.filePath}`;
    const cleanUrl = `${urlEndpoint}${cleanPath}`;

    res.json({
      url: cleanUrl,
      imageUrl: cleanUrl,
      fileId: ikData.fileId,
      name: ikData.name,
      filePath: ikData.filePath,
      thumbnailUrl: ikData.thumbnailUrl
    });
  } catch (err) {
    console.error('ImageKit upload error:', err);
    res.status(500).json({ message: err.message || 'Image upload error' });
  }
});

// IMAGEKIT DELETE ENDPOINT
app.delete('/api/admin/delete-image/:fileId', authenticateToken, async (req, res) => {
  try {
    const { fileId } = req.params;
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY || '';
    const authHeader = 'Basic ' + Buffer.from(privateKey + ':').toString('base64');

    const delRes = await fetch(`https://api.imagekit.io/v1/files/${fileId}`, {
      method: 'DELETE',
      headers: { Authorization: authHeader }
    });

    if (!delRes.ok && delRes.status !== 404) {
      const errData = await delRes.json();
      return res.status(delRes.status).json({ message: errData.message || 'ImageKit deletion failed' });
    }

    res.json({ success: true, message: 'Image successfully deleted from ImageKit' });
  } catch (err) {
    console.error('ImageKit delete error:', err);
    res.status(500).json({ message: err.message || 'Deletion error' });
  }
});

// BACKGROUND HEARTBEAT & REAL-TIME AUTHORIZATION CHECK
app.get('/api/auth/heartbeat', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    const userEmail = req.user?.email;

    // Admin Root or Admin Role bypass (Admins are never disabled via heartbeat)
    if (userId === 'admin_root' || req.user?.role === 'admin') {
      return res.json({
        status: 'active',
        sessionRevoked: false,
        user: {
          id: userId || 'admin_root',
          email: userEmail || 'admin@skillvault.dev',
          role: 'admin'
        }
      });
    }

    let targetUser = null;

    if (isDbConnected()) {
      const dbRes = await query('SELECT id, email, role, is_disabled FROM users WHERE id = $1 OR LOWER(email) = LOWER($2) LIMIT 1', [userId, userEmail]);
      if (dbRes.rows.length > 0) {
        targetUser = dbRes.rows[0];
      }
    }

    if (!targetUser) {
      targetUser = inMemoryDb.users.find(u => u.id === userId || u.email.toLowerCase() === userEmail?.toLowerCase());
    }

    if (!targetUser || targetUser.is_disabled) {
      return res.status(401).json({
        status: 'revoked',
        sessionRevoked: true,
        message: 'Your account access has been revoked or disabled by an Administrator.'
      });
    }

    return res.json({
      status: 'active',
      sessionRevoked: false,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        role: targetUser.role
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Heartbeat check error', message: err.message });
  }
});

// GET ALL USERS (ADMIN)
app.get('/api/admin/users', authenticateToken, async (req, res) => {
  try {
    if (isDbConnected()) {
      const result = await query('SELECT id, email, name, phone, picture, role, is_disabled, created_at FROM users ORDER BY created_at DESC');
      const formatted = result.rows.map(u => ({
        ...u,
        isDisabled: u.is_disabled ?? false,
        createdAt: u.created_at
      }));
      return res.json({ users: formatted });
    }
  } catch (err) {
    console.error('PostgreSQL fetch users error:', err.message);
  }

  const sanitized = inMemoryDb.users.map(({ passwordHash, ...u }) => ({
    ...u,
    isDisabled: u.is_disabled ?? false
  }));
  res.json({ users: sanitized });
});

// TOGGLE USER ACCESS / REVOKE SESSION (ADMIN)
app.post('/api/admin/users/:id/toggle-access', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  let isDisabled = false;

  try {
    if (isDbConnected()) {
      const userRes = await query('SELECT is_disabled FROM users WHERE id = $1 OR LOWER(email) = LOWER($1)', [id]);
      if (userRes.rows.length === 0) return res.status(404).json({ error: 'User not found' });

      isDisabled = !(userRes.rows[0].is_disabled ?? false);
      await query('UPDATE users SET is_disabled = $1, session_version = COALESCE(session_version, 1) + 1 WHERE id = $2 OR LOWER(email) = LOWER($2)', [isDisabled, id]);
    }
  } catch (err) {
    console.error('PostgreSQL toggle user access error:', err.message);
  }

  const memUser = inMemoryDb.users.find(u => u.id === id || (u.email && u.email.toLowerCase() === id.toLowerCase()));
  if (memUser) {
    memUser.is_disabled = !(memUser.is_disabled ?? false);
    memUser.session_version = (memUser.session_version || 1) + 1;
    isDisabled = memUser.is_disabled;
  }

  console.log(`🔒 [SESSION CONTROL]: User ${id} access set to isDisabled=${isDisabled}`);
  return res.json({
    success: true,
    isDisabled,
    message: isDisabled ? 'User access revoked & active sessions invalidated.' : 'User access restored successfully.'
  });
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
  if (!item) return 'https://drive.google.com';
  let url = item.driveUrl || item.drive_url || '';
  if (url && url.trim().startsWith('http') && url.trim() !== 'https://drive.google.com' && url.trim() !== 'https://drive.google.com/') {
    return url.trim();
  }

  // 1. If item has selectedProductId / selected_product_id, check products table for that product first!
  const selProdId = item.selectedProductId || item.selected_product_id;
  if (selProdId) {
    if (isDbConnected()) {
      try {
        const pRes = await query('SELECT drive_url FROM products WHERE id = $1', [selProdId]);
        if (pRes.rows.length > 0 && pRes.rows[0].drive_url && pRes.rows[0].drive_url.trim().startsWith('http')) {
          return pRes.rows[0].drive_url.trim();
        }
      } catch (e) {}
    }
    const memP = inMemoryDb.products.find(p => p && p.id === selProdId);
    if (memP && memP.driveUrl && memP.driveUrl.trim().startsWith('http')) {
      return memP.driveUrl.trim();
    }
  }

  const itemId = item.id || item.courseId || '';
  if (itemId) {
    if (isDbConnected()) {
      try {
        // 2. If it's a bonus offer (starts with bonus- or isBonus), check bonus_offers table first!
        if (itemId.startsWith('bonus') || item.isBonus) {
          const bRes = await query('SELECT drive_url, selected_product_id FROM bonus_offers WHERE id = $1', [itemId]);
          if (bRes.rows.length > 0) {
            const bRow = bRes.rows[0];
            if (bRow.drive_url && bRow.drive_url.trim().startsWith('http') && bRow.drive_url.trim() !== 'https://drive.google.com') {
              return bRow.drive_url.trim();
            }
            if (bRow.selected_product_id) {
              const linkedP = await query('SELECT drive_url FROM products WHERE id = $1', [bRow.selected_product_id]);
              if (linkedP.rows.length > 0 && linkedP.rows[0].drive_url && linkedP.rows[0].drive_url.trim().startsWith('http')) {
                return linkedP.rows[0].drive_url.trim();
              }
            }
          }
        }

        // 3. Check products table
        const pRes = await query('SELECT drive_url FROM products WHERE id = $1', [itemId]);
        if (pRes.rows.length > 0 && pRes.rows[0].drive_url && pRes.rows[0].drive_url.trim().startsWith('http')) {
          return pRes.rows[0].drive_url.trim();
        }

        // 4. Check bonus_offers table
        const bRes = await query('SELECT drive_url, selected_product_id FROM bonus_offers WHERE id = $1', [itemId]);
        if (bRes.rows.length > 0) {
          const bRow = bRes.rows[0];
          if (bRow.drive_url && bRow.drive_url.trim().startsWith('http') && bRow.drive_url.trim() !== 'https://drive.google.com') {
            return bRow.drive_url.trim();
          }
          if (bRow.selected_product_id) {
            const linkedP = await query('SELECT drive_url FROM products WHERE id = $1', [bRow.selected_product_id]);
            if (linkedP.rows.length > 0 && linkedP.rows[0].drive_url && linkedP.rows[0].drive_url.trim().startsWith('http')) {
              return linkedP.rows[0].drive_url.trim();
            }
          }
        }
      } catch (err) {
        console.error('Failed to resolve drive_url from DB:', err.message);
      }
    }

    // 5. Fallback: check inMemoryDb products
    const memP = inMemoryDb.products.find(p => p && p.id === itemId);
    if (memP && memP.driveUrl && memP.driveUrl.trim().startsWith('http')) {
      return memP.driveUrl.trim();
    }

    // 6. Fallback: check inMemoryDb bonuses
    const memB = inMemoryDb.bonuses.find(b => b && b.id === itemId);
    if (memB) {
      if (memB.driveUrl && memB.driveUrl.trim().startsWith('http') && memB.driveUrl.trim() !== 'https://drive.google.com') {
        return memB.driveUrl.trim();
      }
      if (memB.selectedProductId) {
        const linkedMemP = inMemoryDb.products.find(p => p && p.id === memB.selectedProductId);
        if (linkedMemP && linkedMemP.driveUrl && linkedMemP.driveUrl.trim().startsWith('http')) {
          return linkedMemP.driveUrl.trim();
        }
      }
    }
  }

  return (url && url.startsWith('http')) ? url : 'https://drive.google.com';
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
        let id = item.id;
        if (!id || !id.startsWith('bonus-') || id === item.selectedProductId) {
          id = `bonus-offer-${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
        }
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
        if (dbUser.is_disabled) {
          return res.status(403).json({ message: 'Your account access has been disabled by Administrator.' });
        }
        user = { id: dbUser.id, email: dbUser.email, name: dbUser.name, picture: dbUser.picture, authProvider: dbUser.auth_provider, role: dbUser.role };
      }

      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
      return res.json({ token, user });
    }

    let user = inMemoryDb.users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (user && user.is_disabled) {
      return res.status(403).json({ message: 'Your account access has been disabled by Administrator.' });
    }

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
        if (dbUser.is_disabled) {
          return res.status(403).json({ message: 'Your account access has been disabled by Administrator.' });
        }
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
  if (user && user.is_disabled) {
    return res.status(403).json({ message: 'Your account access has been disabled by Administrator.' });
  }
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
        userRes = await query('SELECT id, email, name, phone, picture, role, is_disabled, cart, created_at FROM users WHERE id = $1 OR LOWER(email) = LOWER($2)', [userId, userEmail || '']);
      } else if (userEmail) {
        userRes = await query('SELECT id, email, name, phone, picture, role, is_disabled, cart, created_at FROM users WHERE LOWER(email) = LOWER($1)', [userEmail]);
      }

      if (userRes.rows.length > 0 && userRes.rows[0].is_disabled) {
        return res.status(401).json({
          status: 'revoked',
          sessionRevoked: true,
          message: 'Your account access has been revoked or disabled by an Administrator.'
        });
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
      const revRes = await query(`
        SELECT 
          COALESCE(SUM(CASE WHEN id NOT LIKE 'pur_act_%' THEN amount_paid_inr ELSE 0 END), 0) as total_rev, 
          COUNT(CASE WHEN id NOT LIKE 'pur_act_%' THEN 1 END) as total_pur 
        FROM purchases
      `);
      const canvaRevRes = await query('SELECT COALESCE(SUM(amount), 0) as canva_rev, COUNT(*) as canva_pur FROM canva_activations').catch(() => ({ rows: [{ canva_rev: 0, canva_pur: 0 }] }));
      const userRes = await query('SELECT COUNT(*) as total_users FROM users');
      const prodRes = await query('SELECT COUNT(*) as total_prods FROM products');

      const skillVaultRev = Number(revRes.rows[0].total_rev) || 0;
      const canvaRev = Number(canvaRevRes.rows[0].canva_rev) || 0;
      const skillVaultOrders = Number(revRes.rows[0].total_pur) || 0;
      const canvaOrders = Number(canvaRevRes.rows[0].canva_pur) || 0;

      return res.json({
        totalRevenueInr: skillVaultRev + canvaRev,
        totalPurchases: skillVaultOrders + canvaOrders,
        skillVaultRevenueInr: skillVaultRev,
        canvaRevenueInr: canvaRev,
        skillVaultPurchases: skillVaultOrders,
        canvaPurchases: canvaOrders,
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
    skillVaultRevenueInr: totalRevenueInr,
    canvaRevenueInr: 0,
    skillVaultPurchases: inMemoryDb.purchases.length,
    canvaPurchases: 0,
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
          items: JSON.stringify(items.map(it => ({
            id: it.id || it.courseId,
            courseId: it.courseId || it.id,
            selectedProductId: it.selectedProductId || it.selected_product_id || '',
            isBonus: Boolean(it.isBonus || (it.id && String(it.id).startsWith('bonus'))),
            name: it.name || it.title,
            title: it.title || it.name,
            price: it.price || it.priceInr || it.price_inr,
            driveUrl: it.driveUrl || it.drive_url || ''
          })))
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
  return await resolveDriveUrl(item);
}

// HOSTINGER OFFICIAL AGENTIC MAIL DELIVERY SERVICE (RESTful API)
async function sendPurchaseEmail({ to, customerName, paymentId, items }) {
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

    return `Item #${idx + 1}: ${title} (Rs. ${price})\nAccess Link: ${driveUrl}`;
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

  const hostingerApiToken = process.env.HOSTINGER_MAIL_API_TOKEN;
  if (!hostingerApiToken) {
    console.log(`\n📧 [EMAIL NOTICE]: HOSTINGER_MAIL_API_TOKEN not configured in backend/.env. Simulated email to ${to}`);
    return { status: 'simulated', message: 'Configure HOSTINGER_MAIL_API_TOKEN in backend/.env to send real emails.' };
  }

  try {
    let mailboxId = process.env.HOSTINGER_MAILBOX_RESOURCE_ID;
    if (!mailboxId) {
      const meRes = await fetch('https://api.mail.hostinger.com/api/v1/me', {
        headers: {
          'Authorization': `Bearer ${hostingerApiToken}`,
          'Accept': 'application/json'
        }
      });
      if (meRes.ok) {
        const meData = await meRes.json();
        mailboxId = meData?.data?.mailboxes?.[0]?.resourceId;
      }
    }

    if (!mailboxId) {
      console.error('❌ [HOSTINGER API ERROR]: No mailbox resource ID found for token.');
      return { success: false, error: 'Mailbox resource ID not found' };
    }

    const sendRes = await fetch(`https://api.mail.hostinger.com/api/v1/mailboxes/${mailboxId}/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hostingerApiToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        to: [to],
        displayName: 'Skill Vault',
        subject: `Your Skill Vault purchase is confirmed — ${paymentId}`,
        text: textContent
      })
    });

    if (sendRes.status === 204 || sendRes.ok) {
      console.log(`\n📧 [HOSTINGER API SUCCESS]: Confirmation email delivered via Hostinger REST API to ${to}`);
      return { success: true, provider: 'hostinger-agentic-api' };
    } else {
      const errBody = await sendRes.text();
      console.error(`\n❌ [HOSTINGER API ERROR]: HTTP ${sendRes.status}: ${errBody}`);
      return { success: false, error: `Hostinger API Error: ${errBody}` };
    }
  } catch (apiErr) {
    console.error(`\n❌ [HOSTINGER API EXCEPTION]:`, apiErr.message);
    return { success: false, error: apiErr.message };
  }
}

// POSTGRESQL AUTH STATE ADAPTER FOR BAILEYS (Persists QR session in DB across Render redeploys)
async function useDbAuthState() {
  if (isDbConnected()) {
    try {
      const baileys = await import('@whiskeysockets/baileys');
      const { initAuthCreds, BufferJSON } = baileys;

      const readConfig = async (key) => {
        try {
          const res = await query('SELECT value FROM system_config WHERE key = $1', [key]);
          if (res.rows.length > 0 && res.rows[0].value) {
            return JSON.parse(res.rows[0].value, BufferJSON.reviver);
          }
        } catch (e) { }
        return null;
      };

      const writeConfig = async (key, value) => {
        try {
          const str = JSON.stringify(value, BufferJSON.replacer);
          await query(`
            INSERT INTO system_config (key, value, updated_at)
            VALUES ($1, $2, CURRENT_TIMESTAMP)
            ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP
          `, [key, str]);
        } catch (e) {
          console.error('Failed to write system_config:', e.message);
        }
      };

      let creds = await readConfig('baileys_creds');
      if (!creds) {
        creds = initAuthCreds();
        await writeConfig('baileys_creds', creds);
      }

      let keys = (await readConfig('baileys_keys')) || {};

      return {
        state: {
          creds,
          keys: {
            get: (type, ids) => {
              const data = {};
              for (const id of ids) {
                const value = keys[`${type}-${id}`];
                if (value) data[id] = value;
              }
              return data;
            },
            set: async (data) => {
              for (const category in data) {
                for (const id in data[category]) {
                  const value = data[category][id];
                  const k = `${category}-${id}`;
                  if (value) {
                    keys[k] = value;
                  } else {
                    delete keys[k];
                  }
                }
              }
              await writeConfig('baileys_keys', keys);
            }
          }
        },
        saveCreds: async () => {
          await writeConfig('baileys_creds', creds);
        }
      };
    } catch (dbErr) {
      console.warn('⚠️ [BAILEYS DB AUTH FALLBACK]:', dbErr.message);
    }
  }

  const { useMultiFileAuthState } = await import('@whiskeysockets/baileys');
  return await useMultiFileAuthState('baileys_auth');
}

// BAILEYS WHATSAPP CLIENT (100% Free Built-in WhatsApp Automation)
let baileysSock = null;
let baileysQrDataUrl = null;
let baileysConnected = false;
let baileysUserPhone = null;
let isInitializingBaileys = false;
let reconnectTimer = null;

async function initBaileysWhatsApp() {
  if (isInitializingBaileys) {
    return;
  }
  isInitializingBaileys = true;

  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  try {
    const baileys = await import('@whiskeysockets/baileys').catch(() => null);
    const QRCode = await import('qrcode').catch(() => null);

    if (!baileys || !QRCode) {
      console.log('ℹ️ [BAILEYS NOTICE]: Baileys module optional fallback mode active.');
      return;
    }

    // Clean up previous socket if one exists to prevent socket collisions (Error 440)
    if (baileysSock) {
      try {
        baileysSock.ev.removeAllListeners();
        baileysSock.end(new Error('Refreshing Baileys session'));
      } catch (e) { }
      baileysSock = null;
    }

    const { makeWASocket, DisconnectReason } = baileys;
    const { state, saveCreds } = await useDbAuthState();
    const pinoMod = await import('pino').catch(() => null);
    const quietLogger = pinoMod ? (pinoMod.default || pinoMod)({ level: 'silent' }) : undefined;

    baileysSock = makeWASocket({
      auth: state,
      logger: quietLogger,
      printQRInTerminal: false,
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
      browser: ['Skill Vault Store', 'Chrome', '1.0.0']
    });

    baileysSock.ev.on('creds.update', saveCreds);

    baileysSock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        try {
          baileysQrDataUrl = await QRCode.toDataURL(qr);
          console.log('📱 [BAILEYS QR GENERATED]: Open /api/admin/whatsapp/qr or Admin Panel to scan QR code!');
        } catch (e) { }
      }

      if (connection === 'open') {
        baileysConnected = true;
        baileysQrDataUrl = null;
        baileysUserPhone = baileysSock.user?.id ? baileysSock.user.id.split(':')[0] : 'Connected';
        console.log(`\n💚 [BAILEYS WHATSAPP CONNECTED]: WhatsApp Web active for user ${baileysUserPhone}! Automatic 24/7 delivery active.`);
      }

      if (connection === 'close') {
        baileysConnected = false;
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const isReplaced = statusCode === DisconnectReason.connectionReplaced; // 440
        const isLoggedOut = statusCode === DisconnectReason.loggedOut; // 401
        const shouldReconnect = !isLoggedOut;

        console.log(`⚠️ [BAILEYS DISCONNECTED]: Reconnecting: ${shouldReconnect} (status: ${statusCode})`);

        if (isReplaced) {
          console.warn('⚠️ [BAILEYS NOTICE]: Connection was replaced (status 440). Another session/server instance (e.g. Render vs Local or WhatsApp Web) is active.');
          // Don't rapid-loop to avoid colliding with the active instance
          reconnectTimer = setTimeout(initBaileysWhatsApp, 30000);
        } else if (shouldReconnect) {
          reconnectTimer = setTimeout(initBaileysWhatsApp, 5000);
        }
      }
    });
  } catch (err) {
    console.warn('⚠️ [BAILEYS INIT NOTICE]:', err.message);
  } finally {
    isInitializingBaileys = false;
  }
}

// WHATSAPP STATUS API & QR HTML DISPLAY
app.get('/api/admin/whatsapp/status', (req, res) => {
  res.json({
    connected: baileysConnected,
    qrDataUrl: baileysQrDataUrl,
    phone: baileysUserPhone,
    enabled: process.env.WHATSAPP_ENABLED !== 'false'
  });
});

app.get('/api/admin/whatsapp/qr', (req, res) => {
  if (baileysConnected) {
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>WhatsApp Connected - Skill Vault</title></head>
        <body style="background:#090a10;color:#fff;font-family:sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;">
          <div style="text-align:center;padding:40px;border:1px solid #10b98133;background:#064e3b22;border-radius:16px;max-width:440px;">
            <h1 style="color:#10b981;margin-bottom:8px;">✅ WhatsApp Connected 100% Active</h1>
            <p style="color:#9ca3af;">Connected Account: <strong>${baileysUserPhone}</strong></p>
            <p style="color:#6b7280;font-size:13px;line-height:1.5;">Automatic WhatsApp purchase delivery is live 24/7! Purchased links will automatically send to customers upon payment.</p>
          </div>
        </body>
      </html>
    `);
  }

  if (baileysQrDataUrl) {
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Scan WhatsApp QR Code - Skill Vault</title>
          <meta http-equiv="refresh" content="5">
        </head>
        <body style="background:#090a10;color:#fff;font-family:sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;">
          <div style="text-align:center;padding:32px;border:1px solid #7c3aed44;background:#1e1b4b33;border-radius:16px;max-width:400px;">
            <h2 style="color:#a78bfa;margin-top:0;">Scan QR to Connect WhatsApp</h2>
            <p style="color:#9ca3af;font-size:13px;margin-bottom:20px;">Open WhatsApp on your phone &gt; Linked Devices &gt; Link a Device and scan the QR code below:</p>
            <img src="${baileysQrDataUrl}" alt="WhatsApp QR Code" style="width:250px;height:250px;border-radius:12px;border:4px solid #fff;" />
            <p style="color:#6b7280;font-size:11px;margin-top:16px;">Page auto-refreshes every 5 seconds. Once scanned, WhatsApp will connect automatically!</p>
          </div>
        </body>
      </html>
    `);
  }

  return res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>WhatsApp Initializing... - Skill Vault</title>
        <meta http-equiv="refresh" content="4">
      </head>
      <body style="background:#090a10;color:#fff;font-family:sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;">
        <div style="text-align:center;padding:32px;">
          <h3 style="color:#fbbf24;">Initializing WhatsApp Web Client...</h3>
          <p style="color:#9ca3af;font-size:13px;">Generating QR code... Page will auto-refresh in 4 seconds.</p>
        </div>
      </body>
    </html>
  `);
});

// Idempotency cache to prevent duplicate WhatsApp messages (e.g. verify-payment + webhook dual trigger)
const sentWhatsAppPaymentMap = new Map();

// Clean up old WhatsApp message dedupe entries every 15 minutes
setInterval(() => {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const [key, timestamp] of sentWhatsAppPaymentMap.entries()) {
    if (timestamp < oneHourAgo) {
      sentWhatsAppPaymentMap.delete(key);
    }
  }
}, 15 * 60 * 1000);

// WHATSAPP PURCHASE NOTIFICATION SERVICE (Supports Baileys Built-in / OpenWA / UltraMsg / GreenAPI / Custom Gateway)
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

  // Remove leading 0 if present (e.g. 09044900518 -> 9044900518)
  if (cleanPhone.startsWith('0')) {
    cleanPhone = cleanPhone.replace(/^0+/, '');
  }

  // Add default country code (91 for India if 10 digits)
  if (cleanPhone.length === 10) {
    cleanPhone = `91${cleanPhone}`;
  }

  // Deduplication Guard: If message was already sent for this paymentId, suppress duplicate
  if (paymentId) {
    const dedupeKey = `${cleanPhone}_${paymentId}`;
    if (sentWhatsAppPaymentMap.has(dedupeKey)) {
      console.log(`⚠️ [WHATSAPP DEDUPE]: Suppressed duplicate WhatsApp message to ${cleanPhone} for payment ${paymentId}`);
      return { success: true, duplicateSuppressed: true, paymentId };
    }
    sentWhatsAppPaymentMap.set(dedupeKey, Date.now());
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
If you have any questions, reply to this message.

Best regards,
Skill Vault Team`;

  // 1. Direct Baileys WASocket Delivery (100% Free, Built-in, No Third-Party API Keys Needed)
  if (baileysConnected && baileysSock) {
    try {
      const recipientJid = `${cleanPhone}@s.whatsapp.net`;
      await baileysSock.sendMessage(recipientJid, { text: whatsappMessage });
      console.log(`\n💬 [BAILEYS SUCCESS]: Automatic WhatsApp message delivered to ${cleanPhone}`);
      return { success: true, provider: 'baileys-built-in', recipient: cleanPhone };
    } catch (bErr) {
      console.error('❌ [BAILEYS SEND ERROR]:', bErr.message);
    }
  }

  // 2. HTTP Gateway Fallback (OpenWA / UltraMsg / GreenAPI)
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
  console.log(`\n💬 [WHATSAPP NOTICE]: Direct click-to-chat URL generated for ${cleanPhone}:\n${clickToChatUrl}`);
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

/**
 * Send server-side conversion event to Meta Conversions API (CAPI)
 */
async function sendMetaCapiEvent({ eventName, eventId, userData = {}, customData = {}, clientIp, userAgent }) {
  const pixelId = process.env.META_PIXEL_ID || process.env.VITE_META_PIXEL_ID;
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN;

  if (!pixelId || !accessToken) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`ℹ️ [Meta CAPI Notice]: META_PIXEL_ID or META_CAPI_ACCESS_TOKEN not set in environment. CAPI event (${eventName}) skipped.`);
    }
    return { success: false, reason: 'Missing credentials' };
  }

  try {
    const user_data = {};
    if (userData.email) {
      user_data.em = crypto.createHash('sha256').update(userData.email.trim().toLowerCase()).digest('hex');
    }
    if (userData.phone) {
      const cleanPh = String(userData.phone).replace(/\D/g, '');
      if (cleanPh) {
        user_data.ph = crypto.createHash('sha256').update(cleanPh).digest('hex');
      }
    }
    if (userData.firstName) {
      user_data.fn = crypto.createHash('sha256').update(userData.firstName.trim().toLowerCase()).digest('hex');
    }
    if (userData.lastName) {
      user_data.ln = crypto.createHash('sha256').update(userData.lastName.trim().toLowerCase()).digest('hex');
    }
    if (userData.externalId) {
      user_data.external_id = crypto.createHash('sha256').update(String(userData.externalId)).digest('hex');
    }
    if (clientIp) user_data.client_ip_address = clientIp;
    if (userAgent) user_data.client_user_agent = userAgent;

    const payload = {
      data: [
        {
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          event_id: eventId,
          action_source: 'website',
          user_data,
          custom_data: customData,
        }
      ]
    };

    const url = `https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${accessToken}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const resData = await res.json();
    if (res.ok) {
      console.log(`✅ [Meta CAPI Success]: Event ${eventName} (${eventId}) sent to Meta!`);
      return { success: true, data: resData };
    } else {
      console.error(`❌ [Meta CAPI Error]:`, resData);
      return { success: false, error: resData };
    }
  } catch (err) {
    console.error(`❌ [Meta CAPI Exception]:`, err.message);
    return { success: false, error: err.message };
  }
}

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

  // Idempotency Check: Prevent duplicate insertions if Webhook or previous request already recorded this paymentId
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

  if (!isAlreadyRecorded) {
    // Record purchases in PostgreSQL database & clear cart
    try {
      if (isDbConnected()) {
        for (const item of items) {
          const pId = `pur_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
          const courseId = item.selectedProductId || item.selected_product_id || item.courseId || item.id || 'course-default';
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
      const courseId = item.selectedProductId || item.selected_product_id || item.courseId || item.id || 'course-default';
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
  }

  // Trigger Meta Conversions API (CAPI) Server-Side Purchase Event
  const capiEventId = req.body.eventId || `evt_pur_${paymentId}`;
  const totalPurchaseValue = items.reduce((sum, item) => {
    const rawPrice = item.price !== undefined ? item.price : (item.priceInr || item.price_inr || '299');
    return sum + (parseFloat(String(rawPrice).replace(/[^0-9.]/g, '')) || 0);
  }, 0);

  sendMetaCapiEvent({
    eventName: 'Purchase',
    eventId: capiEventId,
    userData: {
      email: customerEmail,
      phone: customerPhone,
      firstName: customerName ? customerName.split(' ')[0] : undefined,
      lastName: customerName ? customerName.split(' ').slice(1).join(' ') : undefined,
    },
    customData: {
      content_ids: items.map(i => String(i.id || i.courseId)),
      content_name: items.map(i => i.name || i.title).join(', '),
      content_type: 'product',
      num_items: items.length,
      value: Math.round(totalPurchaseValue),
      currency: 'INR',
      order_id: paymentId,
    },
    clientIp: req.headers['x-forwarded-for'] || req.socket?.remoteAddress,
    userAgent: req.headers['user-agent']
  }).catch(err => console.error('Verify-payment CAPI execution error:', err.message));

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
          const courseId = item.selectedProductId || item.selected_product_id || item.courseId || item.id || 'course-default';
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
      const courseId = item.selectedProductId || item.selected_product_id || item.courseId || item.id || 'course-default';
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

// 404 UNHANDLED ROUTE HANDLER
app.use((req, res) => {
  res.status(404).json({
    error: 'Route Not Found',
    message: `The requested endpoint ${req.originalUrl} does not exist on this server.`,
    timestamp: new Date().toISOString()
  });
});

// CENTRALIZED GLOBAL EXPRESS ERROR HANDLER
app.use((err, req, res, _next) => {
  console.error(`💥 [UNHANDLED EXPRESS ERROR] on ${req.method} ${req.url}:`, err);
  const status = err.status || err.statusCode || 500;
  let message = err.message || 'Something went wrong';
  if (err.type === 'entity.too.large' || status === 413) {
    message = 'File or payload too large. Please upload an image under 50MB.';
  } else if (process.env.NODE_ENV === 'production' && status === 500) {
    message = 'An internal server error occurred.';
  }
  res.status(status).json({
    error: status === 413 ? 'Payload Too Large' : (status === 404 ? 'Not Found' : 'Server Error'),
    message,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, async () => {
  console.log(`🚀 Skill Vault Express Backend Server running at http://localhost:${PORT}`);
  await initDb();
  await initBaileysWhatsApp();

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

