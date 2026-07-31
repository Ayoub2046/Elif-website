// Backend/services/storage.js
// Uploads files to Supabase Storage on Vercel (serverless = read-only filesystem).
// Falls back to local disk uploads/ when running locally (no SUPABASE_URL set).

const fs = require('fs');
const path = require('path');

function getSupabase() {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
    const { createClient } = require('@supabase/supabase-js');
    return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'uploads';

// Uploads a file buffer to Supabase Storage, returns a public URL.
// Falls back to local disk (uploads/<folder>/<filename>) when Supabase isn't configured.
async function uploadBuffer(buffer, folder, filename, contentType) {
    const supabase = getSupabase();
    if (supabase) {
        const safeName = Date.now() + '-' + Math.random().toString(36).substring(2, 8) + path.extname(filename || '.bin');
        const storagePath = `${folder}/${safeName}`;
        const { error } = await supabase.storage.from(BUCKET).upload(storagePath, buffer, {
            contentType: contentType || 'application/octet-stream',
            upsert: false
        });
        if (error) throw new Error(error.message);
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
        return data.publicUrl;
    }

    // Local fallback
    const dir = path.join(__dirname, '..', '..', 'uploads', folder);
    fs.mkdirSync(dir, { recursive: true });
    const safeName = Date.now() + '-' + Math.random().toString(36).substring(2, 8) + path.extname(filename || '.bin');
    const filePath = path.join(dir, safeName);
    fs.writeFileSync(filePath, buffer);
    return '/uploads/' + folder + '/' + safeName;
}

module.exports = { uploadBuffer, getSupabase };
