const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const paymentRoutes = require('./routes/paymentRoutes.js')
const walletRoutes = require('./routes/walletRoutes.js')
const FAQRoutes = require('./routes/FAQRoutes.js')
const PDFRoutes = require('./routes/PDFRoutes.js')
const excelRoutes = require('./routes/excelRoutes.js')
const invoiceRoutes = require('./routes/invoiceRoutes.js')
const cookieParser = require('cookie-parser');
const initializeSocket = require('./socket/socketConfig');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const http = require('http'); 
const KYC = require("./models/KYC.js");
const path = require("path");
require('dotenv').config();

const queueService = require('./services/queueService.js');
const PaymentMonitorService = require('./services/paymentMoniterService.js');
const NotificationService = require('./services/notificationServices.js');

const app = express();
const server = http.createServer(app);
const io = initializeSocket(server);
NotificationService.initialize(io);

connectDB();

app.use(
  cors({
    origin: ["https://week11-timeless-motors.vercel.app", "http://localhost:5173", "https://app.timeless-motors.live"],
    credentials: true,
  })
);

app.set('io', io);

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG & PDF files are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: fileFilter
});

const uploadToCloudinary = async (file) => {
    return new Promise((resolve, reject) => {
      // Create a readable stream from buffer
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'kyc-documents', 
          resource_type: 'auto', 
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
  
      // Convert buffer to stream and pipe to Cloudinary
      const { Readable } = require('stream');
        const bufferStream = new Readable();
        bufferStream.push(file.buffer);
        bufferStream.push(null);
        bufferStream.pipe(stream);
    });
};

app.post('/api/kyc/upload', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
  
      // Upload file to Cloudinary
      const cloudinaryResponse = await uploadToCloudinary(req.file);
  
      // Here you might want to save the Cloudinary response details to your database
      const newKYC = new KYC({
        user: req.body.userId,
        documentType: req.body.documentType,
        documentUrl: cloudinaryResponse.secure_url
      });
      
      await newKYC.save();
      
  
      res.json({
        message: 'File uploaded successfully',
        file: {
          url: cloudinaryResponse.secure_url,
          publicId: cloudinaryResponse.public_id,
          format: cloudinaryResponse.format,
          size: cloudinaryResponse.bytes
        }
      });
  
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ 
        message: 'Error uploading file',
        error: error.message 
      });
    }
  });

app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/FAQ', FAQRoutes);
app.use('/api/PDF', PDFRoutes)
app.use('/api/excel', excelRoutes)
app.use('/api/invoice', invoiceRoutes)
app.use("/reports", express.static(path.join(__dirname, "public/reports")));
app.use("/invoices", express.static(path.join(__dirname, "public/invoices")))

app.get('/api/queue-health', async (req, res) => {
  try {
    const [auctionHealth, paymentHealth] = await Promise.all([
      queueService.getQueueHealth(),
      PaymentMonitorService.getQueueHealth()
    ]);

    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      queues: {
        ...auctionHealth,
        ...paymentHealth
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to get queue health',
      error: error.message
    });
  }
});

app.use((req, res) => {
  res.status(404);
  res.json({ message: 'Resource not found' });
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  await Promise.all([
    queueService.shutdown(),
    PaymentMonitorService.shutdown()
  ]);
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", async () => {
  try {
    console.log(`Server is running on port: http://0.0.0.0:${PORT}`);
    
    // Process existing auctions and payments
    console.log('Processing existing auctions and payments...');
    const [auctionResult, paymentResult] = await Promise.all([
      queueService.processExistingAuctions(),
      PaymentMonitorService.processExistingPayments()
    ]);
    
    console.log('Auction processing result:', auctionResult);
    console.log('Payment processing result:', paymentResult);
    
    // Log queue health after initialization
    const [auctionHealth, paymentHealth] = await Promise.all([
      queueService.getQueueHealth(),
      PaymentMonitorService.getQueueHealth()
    ]);
    
    console.log('Initial queue health:', {
      ...auctionHealth,
      ...paymentHealth
    });
  } catch (error) {
    console.error('Error during server startup:', error);
  }
});