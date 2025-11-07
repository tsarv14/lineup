const express = require('express');
const upload = require('../middleware/upload');
const auth = require('../middleware/auth');
const path = require('path');

const router = express.Router();

// @route   POST /api/upload/image
// @desc    Upload an image file
// @access  Private
router.post('/image', auth, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Return the file URL (relative path that can be served statically)
    // In production, you'd want to upload to S3/Cloudinary and return that URL
    // For now, return the full URL based on the request origin
    const protocol = req.protocol;
    const host = req.get('host');
    const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
    
    res.json({
      url: fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Error uploading file' });
  }
});

module.exports = router;

