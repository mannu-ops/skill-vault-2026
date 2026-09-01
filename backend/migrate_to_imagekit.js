import pkg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const { Pool } = pkg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
const urlEndpoint = (process.env.IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/e1wrzy1j2').replace(/\/$/, '');
const authHeader = 'Basic ' + Buffer.from(privateKey + ':').toString('base64');

// Helper to sanitize filename while preserving extension
function sanitizeFileName(name) {
  return name.replace(/[^\w\s\-\.\(\)]/gi, '_');
}

// Upload buffer/stream/url to ImageKit
async function uploadToImageKit(fileSource, fileName, folder = '/products') {
  const formData = new FormData();
  
  if (typeof fileSource === 'string' && fileSource.startsWith('http')) {
    // If passing URL, fetch the buffer first to guarantee upload succeeds even if remote server blocks ImageKit fetch
    const fetchRes = await fetch(fileSource);
    if (!fetchRes.ok) {
      throw new Error(`Failed to download source image from Supabase: ${fetchRes.status} ${fetchRes.statusText}`);
    }
    const arrayBuffer = await fetchRes.arrayBuffer();
    const blob = new Blob([arrayBuffer]);
    formData.append('file', blob, fileName);
  } else if (Buffer.isBuffer(fileSource)) {
    const blob = new Blob([fileSource]);
    formData.append('file', blob, fileName);
  } else {
    formData.append('file', fileSource);
  }

  formData.append('fileName', fileName);
  formData.append('folder', folder);
  formData.append('useUniqueFileName', 'false');
  formData.append('isPrivateFile', 'false');

  const uploadRes = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
    method: 'POST',
    headers: {
      Authorization: authHeader
    },
    body: formData
  });

  const resJson = await uploadRes.json();
  if (!uploadRes.ok) {
    throw new Error(`ImageKit upload error: ${resJson.message || JSON.stringify(resJson)}`);
  }

  return resJson;
}

// Clean ImageKit URL (removing unnecessary query params for clean storage if desired)
function getCleanImageKitUrl(filePath) {
  const cleanPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
  return `${urlEndpoint}${cleanPath}`;
}

async function runMigration() {
  console.log('====================================================');
  console.log('🚀 STARTING FULL SUPABASE STORAGE TO IMAGEKIT MIGRATION');
  console.log('====================================================');
  console.log(`ImageKit URL Endpoint: ${urlEndpoint}`);

  const client = await pool.connect();
  const mappingResults = [];
  const oldUrlToNewMap = new Map();

  try {
    // 1. Fetch all objects from Supabase Storage
    const storageRes = await client.query(`
      SELECT id, name, bucket_id, created_at, metadata 
      FROM storage.objects 
      WHERE bucket_id = 'skill-vault-images'
      ORDER BY created_at ASC
    `);

    const supabaseObjects = storageRes.rows;
    console.log(`\n📦 Found ${supabaseObjects.length} objects in Supabase bucket 'skill-vault-images'`);

    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < supabaseObjects.length; i++) {
      const obj = supabaseObjects[i];
      const rawName = obj.name;
      const cleanFileName = sanitizeFileName(rawName);
      
      // Construct various format representations of the Supabase URL
      const supabasePublicUrl = `https://olgrqolybzmjcytwwobn.supabase.co/storage/v1/object/public/skill-vault-images/${encodeURIComponent(rawName).replace(/%2F/g, '/')}`;
      const supabaseRawUrl = `https://olgrqolybzmjcytwwobn.supabase.co/storage/v1/object/public/skill-vault-images/${rawName}`;

      console.log(`\n[${i + 1}/${supabaseObjects.length}] Migrating: "${rawName}"...`);

      try {
        const uploadResult = await uploadToImageKit(supabasePublicUrl, cleanFileName, '/products');
        const imageKitUrl = getCleanImageKitUrl(uploadResult.filePath);
        
        console.log(`   ✅ Successfully uploaded!`);
        console.log(`   ImageKit URL: ${imageKitUrl}`);

        const entry = {
          originalName: rawName,
          cleanFileName,
          supabasePublicUrl,
          supabaseRawUrl,
          imageKitFileId: uploadResult.fileId,
          imageKitFilePath: uploadResult.filePath,
          imageKitUrl,
          imageKitRawUrl: uploadResult.url,
          status: 'SUCCESS'
        };

        mappingResults.push(entry);
        oldUrlToNewMap.set(supabasePublicUrl, imageKitUrl);
        oldUrlToNewMap.set(supabaseRawUrl, imageKitUrl);
        // Also map unencoded / partial variations
        oldUrlToNewMap.set(decodeURIComponent(supabasePublicUrl), imageKitUrl);
        oldUrlToNewMap.set(encodeURI(supabaseRawUrl), imageKitUrl);

        successCount++;
      } catch (err) {
        console.error(`   ❌ Failed to migrate "${rawName}":`, err.message);
        mappingResults.push({
          originalName: rawName,
          cleanFileName,
          supabasePublicUrl,
          supabaseRawUrl,
          error: err.message,
          status: 'FAILED'
        });
        failedCount++;
      }
    }

    console.log(`\n====================================================`);
    console.log(`📊 ASSET MIGRATION SUMMARY:`);
    console.log(`   Total Supabase Objects: ${supabaseObjects.length}`);
    console.log(`   Successfully Migrated: ${successCount}`);
    console.log(`   Failed: ${failedCount}`);
    console.log(`====================================================`);

    // Save JSON mapping to file
    const mappingFilePath = path.join(__dirname, 'imagekit_migration_mapping.json');
    fs.writeFileSync(mappingFilePath, JSON.stringify(mappingResults, null, 2), 'utf-8');
    console.log(`💾 Migration mapping saved to ${mappingFilePath}`);

    // 2. Update Database Tables
    console.log('\n🔄 Updating Supabase PostgreSQL Database Records...');

    // Function to find mapped new URL for an existing URL
    function findMappedUrl(oldUrl) {
      if (!oldUrl || typeof oldUrl !== 'string') return oldUrl;
      if (oldUrlToNewMap.has(oldUrl)) return oldUrlToNewMap.get(oldUrl);

      // Check if oldUrl contains any Supabase object name
      for (const entry of mappingResults) {
        if (entry.status !== 'SUCCESS') continue;
        if (oldUrl.includes(entry.originalName) || oldUrl.includes(encodeURIComponent(entry.originalName))) {
          return entry.imageKitUrl;
        }
      }
      return oldUrl;
    }

    // 2.1 Update Products Table
    const productsRes = await client.query('SELECT id, title, image_url, gallery_images FROM products');
    let productsUpdated = 0;

    for (const prod of productsRes.rows) {
      let changed = false;
      let newImageUrl = prod.image_url;
      let newGalleryImages = prod.gallery_images || [];

      if (prod.image_url && prod.image_url.includes('supabase.co')) {
        newImageUrl = findMappedUrl(prod.image_url);
        if (newImageUrl !== prod.image_url) changed = true;
      }

      if (Array.isArray(newGalleryImages) && newGalleryImages.length > 0) {
        const updatedGallery = newGalleryImages.map(imgUrl => {
          if (typeof imgUrl === 'string' && imgUrl.includes('supabase.co')) {
            const mapped = findMappedUrl(imgUrl);
            if (mapped !== imgUrl) changed = true;
            return mapped;
          }
          return imgUrl;
        });
        newGalleryImages = updatedGallery;
      }

      if (changed) {
        await client.query(
          'UPDATE products SET image_url = $1, gallery_images = $2 WHERE id = $3',
          [newImageUrl, JSON.stringify(newGalleryImages), prod.id]
        );
        console.log(`   ✨ Updated Product [${prod.id}] "${prod.title}"`);
        console.log(`      Old Image: ${prod.image_url}`);
        console.log(`      New Image: ${newImageUrl}`);
        productsUpdated++;
      }
    }

    // 2.2 Update Bonus Offers Table
    const bonusRes = await client.query('SELECT id, title, image_url FROM bonus_offers');
    let bonusUpdated = 0;

    for (const bonus of bonusRes.rows) {
      if (bonus.image_url && bonus.image_url.includes('supabase.co')) {
        const newImageUrl = findMappedUrl(bonus.image_url);
        if (newImageUrl !== bonus.image_url) {
          await client.query(
            'UPDATE bonus_offers SET image_url = $1 WHERE id = $2',
            [newImageUrl, bonus.id]
          );
          console.log(`   ✨ Updated Bonus Offer [${bonus.id}] "${bonus.title}"`);
          console.log(`      Old Image: ${bonus.image_url}`);
          console.log(`      New Image: ${newImageUrl}`);
          bonusUpdated++;
        }
      }
    }

    console.log(`\n====================================================`);
    console.log(`📊 DATABASE UPDATE SUMMARY:`);
    console.log(`   Products Updated: ${productsUpdated}`);
    console.log(`   Bonus Offers Updated: ${bonusUpdated}`);
    console.log(`====================================================`);

    // 3. Verification Scan
    console.log('\n🔍 Verifying Database for remaining Supabase Storage references...');
    const verifyProd = await client.query("SELECT id, title, image_url, gallery_images FROM products WHERE image_url LIKE '%supabase.co%' OR gallery_images::text LIKE '%supabase.co%'");
    const verifyBonus = await client.query("SELECT id, title, image_url FROM bonus_offers WHERE image_url LIKE '%supabase.co%'");

    console.log(`   Remaining Products with Supabase Storage URL: ${verifyProd.rows.length}`);
    console.log(`   Remaining Bonus Offers with Supabase Storage URL: ${verifyBonus.rows.length}`);

    if (verifyProd.rows.length === 0 && verifyBonus.rows.length === 0) {
      console.log(`\n🎉 DATABASE MIGRATION 100% COMPLETE & VERIFIED! Zero remaining Supabase storage references.`);
    }

  } catch (err) {
    console.error('Fatal migration error:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
