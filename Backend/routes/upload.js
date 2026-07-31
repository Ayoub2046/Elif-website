const express = require('express');
const multer = require('multer');
const path = require('path');
const { uploadBuffer } = require('../services/storage');
const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = /\.(jpg|jpeg|png|gif|webp|svg)$/i;
        if (allowed.test(path.extname(file.originalname))) {
            cb(null, true);
        } else {
            cb(new Error('Only image files (jpg, jpeg, png, gif, webp, svg) are allowed.'));
        }
    }
});

router.post('/', (req, res) => {
    upload.single('image')(req, res, async (err) => {
        if (err) {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'File too large. Max 5MB.' });
                return res.status(400).json({ error: err.message });
            }
            return res.status(400).json({ error: err.message });
        }
        if (!req.file) return res.status(400).json({ error: 'No image uploaded.' });
        try {
            const url = await uploadBuffer(req.file.buffer, 'images', req.file.originalname, req.file.mimetype);
            res.json({ url, filename: path.basename(url) });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });
});

module.exports = router;
