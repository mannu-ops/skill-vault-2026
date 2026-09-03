import pkg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/skillvault';

export const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' || connectionString.includes('supabase') || connectionString.includes('neon')
    ? { rejectUnauthorized: false }
    : false,
  connectionTimeoutMillis: 5000,
});

let dbConnected = false;

export function isDbConnected() {
  return dbConnected;
}

// Default Fallback Data (In-Memory backup if PostgreSQL is offline or building connection)
export const inMemoryDb = {
  products: [
    {
      id: 'course-fullstack-dev',
      title: 'Full Stack Web Development Mastery (MERN)',
      subtitle: 'Master React, Node.js, Express, MongoDB, and Next.js from Scratch to Production.',
      description: 'Comprehensive 50+ hours bootcamp covering modern frontend, backend microservices, database architecture, CI/CD pipelines, and real-world web applications.',
      category: 'Course',
      priceInr: 299,
      originalPriceInr: 1999,
      isPublished: true,
      driveUrl: 'https://drive.google.com',
      imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
      duration: '12 Modules • 48 Hours',
      features: ['JavaScript ES6+', 'React.js & Hooks', 'Node.js & Express', 'MongoDB & Mongoose', 'REST & GraphQL APIs', 'AWS & Vercel Deploy'],
      bonus: 'FREE VIP Developer Cheat-Sheet & Script Pack (Value ₹999)',
      modules: [
        { title: 'HTML5, CSS3 & Modern JavaScript ES6+', detail: 'Practical hands-on lab & security testing module.', lessons: '1 Lesson' },
        { title: 'React.js State Management & Hooks Mastery', detail: 'Practical hands-on lab & security testing module.', lessons: '1 Lesson' },
        { title: 'Node.js, Express REST API Microservices', detail: 'Practical hands-on lab & security testing module.', lessons: '1 Lesson' },
        { title: 'MongoDB, Mongoose & PostgreSQL Database Arch', detail: 'Practical hands-on lab & security testing module.', lessons: '1 Lesson' }
      ],
      testimonials: [
        { name: 'Aman Verma', comment: 'Best MERN stack course! Cleared my interview at top tech startup.' },
        { name: 'Priya Sharma', comment: 'Super detailed modules and practical labs. Highly recommended!' }
      ],
      faqs: [
        { question: 'Is this course beginner-friendly?', answer: 'Yes, it starts from absolute fundamentals and progresses to advanced concepts.' },
        { question: 'How long do I get access?', answer: 'You get lifetime access to all course materials and updates.' }
      ],
      createdAt: new Date().toISOString()
    },
    {
      id: 'devops-cloud-architect',
      title: 'DevOps & Cloud Infrastructure Engineering',
      subtitle: 'Docker, Kubernetes, Terraform, AWS, and CI/CD Automation Mastery.',
      description: 'Learn enterprise cloud deployment workflows, container orchestration, monitoring with Prometheus/Grafana, and automated deployment pipelines.',
      category: 'Course',
      priceInr: 349,
      originalPriceInr: 2499,
      isPublished: true,
      driveUrl: 'https://drive.google.com',
      imageUrl: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?auto=format&fit=crop&w=800&q=80',
      duration: '10 Modules • 42 Hours',
      features: ['Docker Containerization', 'Kubernetes Clusters', 'AWS Cloud Services', 'Terraform IaC', 'GitHub Actions CI/CD'],
      bonus: 'Production-Ready Kubernetes Deployment Manifests',
      modules: [
        { title: 'Docker Containerization & Multi-stage Builds', detail: 'Hands-on lab.', lessons: '1 Lesson' },
        { title: 'Kubernetes Cluster Architecture & Helm Charts', detail: 'Hands-on lab.', lessons: '1 Lesson' }
      ],
      testimonials: [
        { name: 'Rohan Gupta', comment: 'Hands-down the best DevOps guide for AWS and Kubernetes!' }
      ],
      faqs: [
        { question: 'Do I need AWS account?', answer: 'Free tier AWS account is sufficient for all hands-on exercises.' }
      ],
      createdAt: new Date().toISOString()
    },
    {
      id: 'software-api-toolkit',
      title: 'VIP Developer Automation Toolkit & Scripts',
      subtitle: '50+ Production-Ready Automation Scripts, Scrapers, and API Integrations.',
      description: 'Instant download bundle of reusable Python, Node.js, and Bash automation scripts for web scraping, database backups, automated emails, and microservice starters.',
      category: 'Software',
      priceInr: 149,
      originalPriceInr: 999,
      isPublished: true,
      driveUrl: 'https://drive.google.com',
      imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
      duration: 'Instant Download',
      features: ['50+ Automation Scripts', 'Python & Node.js Starters', 'Full Source Code', 'Commercial License'],
      bonus: 'Lifetime Script Updates',
      modules: [],
      testimonials: [],
      faqs: [],
      createdAt: new Date().toISOString()
    }
  ],
  users: [
    {
      id: 'user_admin_01',
      email: 'admin@skillvault.dev',
      name: 'Vault Administrator',
      phone: '',
      passwordHash: bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'SkillVault2026!Admin', 10),
      picture: '',
      authProvider: 'email',
      role: 'admin',
      createdAt: new Date().toISOString()
    }
  ],
  purchases: [],
  reviews: [],
  bonuses: []
};

// Initial Table Creation & Seed Function
export async function initDb() {
  try {
    const client = await pool.connect();
    dbConnected = true;
    console.log('✅ PostgreSQL database connected successfully!');

    // 1. Create Users Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        phone VARCHAR(50),
        password_hash TEXT,
        picture TEXT,
        auth_provider VARCHAR(50) DEFAULT 'email',
        role VARCHAR(50) DEFAULT 'user',
        cart JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure columns exist on existing tables
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS cart JSONB DEFAULT '[]'::jsonb;`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_disabled BOOLEAN DEFAULT FALSE;`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS session_version INTEGER DEFAULT 1;`);

    // 2. Create Products Table with full modules, testimonials, faqs fields
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        subtitle TEXT,
        description TEXT,
        category VARCHAR(100) DEFAULT 'Course',
        price_inr INTEGER DEFAULT 299,
        original_price_inr INTEGER DEFAULT 1999,
        is_published BOOLEAN DEFAULT TRUE,
        drive_url TEXT,
        image_url TEXT,
        duration VARCHAR(100),
        features JSONB DEFAULT '[]'::jsonb,
        bonus TEXT,
        modules JSONB DEFAULT '[]'::jsonb,
        testimonials JSONB DEFAULT '[]'::jsonb,
        faqs JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure columns exist on pre-existing products table
    await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT TRUE;`);
    await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS installation_process TEXT;`);
    await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS gallery_images JSONB DEFAULT '[]'::jsonb;`);
    await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS modules JSONB DEFAULT '[]'::jsonb;`);
    await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS testimonials JSONB DEFAULT '[]'::jsonb;`);
    await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS faqs JSONB DEFAULT '[]'::jsonb;`);

    // 3. Create Purchases Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS purchases (
        id VARCHAR(255) PRIMARY KEY,
        user_email VARCHAR(255) NOT NULL,
        user_name VARCHAR(255),
        user_phone VARCHAR(50),
        course_id VARCHAR(255) NOT NULL,
        amount_paid_inr INTEGER DEFAULT 299,
        payment_id VARCHAR(255),
        status VARCHAR(50) DEFAULT 'completed',
        access_delivered BOOLEAN DEFAULT TRUE,
        drive_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Create Reviews Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id VARCHAR(255) PRIMARY KEY,
        course_id VARCHAR(255) NOT NULL,
        user_name VARCHAR(255),
        user_email VARCHAR(255),
        rating INTEGER DEFAULT 5,
        comment TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);



    // 7. Create Bonus Offers Table (Single unified relational table - 1 row per bonus offer with boolean enabled column)
    await client.query(`
      CREATE TABLE IF NOT EXISTS bonus_offers (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        price_inr INTEGER DEFAULT 149,
        original_price_inr INTEGER DEFAULT 999,
        category VARCHAR(100) DEFAULT 'Software & Tools',
        image_url TEXT,
        selected_product_id VARCHAR(255),
        enabled BOOLEAN DEFAULT FALSE,
        drive_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure drive_url column exists on pre-existing bonus_offers table
    await client.query(`ALTER TABLE bonus_offers ADD COLUMN IF NOT EXISTS drive_url TEXT;`);

    // 8. Create System Config Table for persistent session & config storage
    await client.query(`
      CREATE TABLE IF NOT EXISTS system_config (
        key VARCHAR(255) PRIMARY KEY,
        value TEXT,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Clean up old redundant table if present
    await client.query(`DROP TABLE IF EXISTS bonus_config;`);

    // Seed default bonus offer if table is empty
    const bonusCheck = await client.query('SELECT COUNT(*) FROM bonus_offers');
    if (parseInt(bonusCheck.rows[0].count, 10) === 0) {
      await client.query(`
        INSERT INTO bonus_offers (id, title, description, price_inr, original_price_inr, category, selected_product_id, enabled, drive_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        'bonus-vip-toolkit',
        'Add VIP Developer Toolkit & Cheat-Sheets',
        'Unlock 50+ scripts, cheat-sheets & tools for just ₹149 extra.',
        149,
        999,
        'Software & Tools',
        '',
        false,
        'https://drive.google.com/drive/folders/1_example_bonus_toolkit'
      ]);
      console.log('🌱 Default PostgreSQL bonus offer seeded in single bonus_offers table (enabled: false).');
    }

    // 9. Create Canva Plans Table in Neon PostgreSQL
    await client.query(`
      CREATE TABLE IF NOT EXISTS canva_plans (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        duration VARCHAR(100) NOT NULL,
        price NUMERIC NOT NULL,
        original_price NUMERIC,
        badge VARCHAR(100),
        invite_link TEXT NOT NULL,
        features JSONB DEFAULT '[]'::jsonb,
        not_included JSONB DEFAULT '[]'::jsonb,
        is_popular BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure not_included column exists in pre-existing canva_plans table
    try {
      await client.query(`ALTER TABLE canva_plans ADD COLUMN IF NOT EXISTS not_included JSONB DEFAULT '[]'::jsonb;`);
    } catch (colErr) {
      // Safe to ignore if already present
    }

    // 10. Create Canva Activations Table (Customer Orders) in Neon PostgreSQL
    await client.query(`
      CREATE TABLE IF NOT EXISTS canva_activations (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        plan_name VARCHAR(255) NOT NULL DEFAULT 'Canva Pro Access',
        amount NUMERIC NOT NULL DEFAULT 199,
        payment_method VARCHAR(100) DEFAULT 'UPI QR',
        invite_link TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const canvaTableMigrations = [
      `ALTER TABLE canva_activations ALTER COLUMN id TYPE VARCHAR(255);`,
      `ALTER TABLE canva_activations ADD COLUMN IF NOT EXISTS plan_name VARCHAR(255) DEFAULT 'Canva Pro Access';`,
      `ALTER TABLE canva_activations ADD COLUMN IF NOT EXISTS email VARCHAR(255);`,
      `ALTER TABLE canva_activations ADD COLUMN IF NOT EXISTS amount NUMERIC DEFAULT 199;`,
      `ALTER TABLE canva_activations ADD COLUMN IF NOT EXISTS payment_method VARCHAR(100) DEFAULT 'UPI QR';`,
      `ALTER TABLE canva_activations ADD COLUMN IF NOT EXISTS invite_link TEXT;`,
      `ALTER TABLE canva_activations ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;`
    ];
    for (const q of canvaTableMigrations) {
      try {
        await client.query(q);
      } catch (colErr) {
        // Safe to ignore if column already exists
      }
    }

    // Seed default Canva Plans if empty
    const canvaPlansCheck = await client.query('SELECT COUNT(*) FROM canva_plans');
    if (parseInt(canvaPlansCheck.rows[0].count, 10) === 0) {
      await client.query(`
        INSERT INTO canva_plans (id, name, duration, price, original_price, badge, invite_link, features, is_popular)
        VALUES 
        ('plan_1y', '1 Year Canva Pro', '365 Days Access', 199, 499, 'BEST SELLER', 'https://www.canva.com/brand/join?token=PRO_ANNUAL_INVITE', $1::jsonb, true),
        ('plan_life', 'Lifetime Canva Pro', 'Lifetime Access', 399, 999, 'VIP VALUE', 'https://www.canva.com/brand/join?token=LIFETIME_VIP_INVITE', $2::jsonb, false),
        ('plan_1m', '1 Month Canva Pro', '30 Days Access', 99, 299, 'STARTER', 'https://www.canva.com/brand/join?token=STARTER_30D_INVITE', $3::jsonb, false)
      `, [
        JSON.stringify(['100M+ Premium Stock Photos & Videos', 'Magic Studio AI Tools Unlocked', 'Remove Background in 1 Click', '100GB Cloud Storage', 'Instant Email Delivery']),
        JSON.stringify(['Lifetime Unrestricted Pro Permissions', 'Unlimited Premium Asset Downloads', 'All Future Canva AI Studio Updates', 'Brand Kit & Custom Fonts Support', 'Priority 24/7 Support']),
        JSON.stringify(['100M+ Stock Media Unlocked', 'Magic Studio & AI Writer', '1-Click Background Remover', 'Instant Team Invitation'])
      ]);
      console.log('🌱 Default Canva Pro plans seeded in Neon PostgreSQL.');
    }

    // Seed / Sync default admin
    const adminPass = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'SkillVault2026!Admin', 10);
    const adminCheck = await client.query('SELECT * FROM users WHERE email = $1', ['admin@skillvault.dev']);
    if (adminCheck.rows.length === 0) {
      await client.query(`
        INSERT INTO users (id, email, name, password_hash, role)
        VALUES ($1, $2, $3, $4, $5)
      `, ['user_admin_01', 'admin@skillvault.dev', 'Vault Administrator', adminPass, 'admin']);
      console.log('🌱 Default PostgreSQL admin user seeded.');
    } else {
      await client.query(`
        UPDATE users SET password_hash = $1 WHERE email = $2 OR role = 'admin'
      `, [adminPass, 'admin@skillvault.dev']);
      console.log('🔄 PostgreSQL admin password synced with current ADMIN_PASSWORD.');
    }

    // Seed default products if empty
    const productCheck = await client.query('SELECT COUNT(*) FROM products');
    if (parseInt(productCheck.rows[0].count, 10) === 0) {
      for (const p of inMemoryDb.products) {
        await client.query(`
          INSERT INTO products (id, title, subtitle, description, category, price_inr, original_price_inr, is_published, drive_url, image_url, duration, features, bonus, modules, testimonials, faqs)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        `, [
          p.id,
          p.title,
          p.subtitle,
          p.description,
          p.category,
          p.priceInr,
          p.originalPriceInr,
          p.isPublished,
          p.driveUrl,
          p.imageUrl,
          p.duration,
          JSON.stringify(p.features),
          p.bonus,
          JSON.stringify(p.modules || []),
          JSON.stringify(p.testimonials || []),
          JSON.stringify(p.faqs || [])
        ]);
      }
      console.log('🌱 Default PostgreSQL products seeded with modules, testimonials & FAQs.');
    }

    client.release();
  } catch (error) {
    dbConnected = false;
    console.warn('⚠️ Could not connect to PostgreSQL instance:', error.message);
    console.warn('⚡ Operating in seamless In-Memory Database Mode for local development.');
  }
}

// Database Query Wrapper
export async function query(text, params) {
  if (dbConnected) {
    return pool.query(text, params);
  }
  throw new Error('PostgreSQL database not connected');
}
