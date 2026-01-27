const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const uploadDirs = {
  signatures: path.join(__dirname, '../../uploads/signatures'),
  photos: path.join(__dirname, '../../uploads/photos'),
  profiles: path.join(__dirname, '../../uploads/profiles'),
};

Object.values(uploadDirs).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = uploadDirs.photos; // default
    
    if (file.fieldname === 'signature') {
      uploadPath = uploadDirs.signatures;
    } else if (file.fieldname === 'photo') {
      uploadPath = uploadDirs.photos;
    } else if (file.fieldname === 'profilePicture') {
      uploadPath = uploadDirs.profiles;
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-userid-originalname
    const uniqueName = `${Date.now()}-${req.user?.id || 'user'}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, GIF) and PDF are allowed!'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: fileFilter,
});


const uploadMiddleware = {
  // Single signature upload
  signature: upload.single('signature'),

  photo: upload.single('photo'),
  
  profilePicture: upload.single('profilePicture'),
  
  photos: upload.array('photos', 5),
  
  proofOfDelivery: upload.fields([
    { name: 'signature', maxCount: 1 },
    { name: 'photo', maxCount: 3 }
  ]),
};

module.exports = uploadMiddleware;
