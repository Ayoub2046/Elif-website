const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'images');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname) || '.jpg';
        cb(null, Date.now() + '-' + Math.random().toString(36).substring(2, 8) + ext);
    }
});

const upload = multer({
    storage,
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
    upload.single('image')(req, res, (err) => {
        if (err) {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'File too large. Max 5MB.' });
                return res.status(400).json({ error: err.message });
            }
            return res.status(400).json({ error: err.message });
        }
        if (!req.file) return res.status(400).json({ error: 'No image uploaded.' });
        const url = '/uploads/images/' + req.file.filename;
        res.json({ url, filename: req.file.filename });
    });
});

module.exports = router;
