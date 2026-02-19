const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const uploadDirs = {
  signatures: path.join(__dirname, '../../uploads/signatures'),
  photos: path.join(__dirname, '../../uploads/photos'),
  profiles: path.join(__dirname, '../../uploads/profiles'),
  cvs: path.join(__dirname, '../../uploads/cvs'),
};

Object.values(uploadDirs).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = uploadDirs.photos;

    if (file.fieldname === 'signature') {
      uploadPath = uploadDirs.signatures;
    } else if (file.fieldname === 'photo') {
      uploadPath = uploadDirs.photos;
    } else if (file.fieldname === 'profilePicture') {
      uploadPath = uploadDirs.profiles;
    } else if (file.fieldname === 'cv') {
      uploadPath = uploadDirs.cvs;
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-userid-originalname
    const uniqueName = `${Date.now()}-${req.user?.id || 'applicant'}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'cv') {

    const allowedTypes = /pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = /pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document/.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF and Word documents (DOC, DOCX) are allowed for CV uploads!'));
    }
  } else {

    const allowedTypes = /jpeg|jpg|png|gif|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, GIF) and PDF are allowed!'));
    }
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: fileFilter,
});


const uploadMiddleware = {

  signature: upload.single('signature'),

  photo: upload.single('photo'),

  profilePicture: upload.single('profilePicture'),

  cv: upload.single('cv'),

  photos: upload.array('photos', 5),

  proofOfDelivery: upload.fields([
    { name: 'signature', maxCount: 1 },
    { name: 'photo', maxCount: 3 }
  ]),
};

module.exports = uploadMiddleware;
