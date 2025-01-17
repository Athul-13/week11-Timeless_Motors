const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();

connectDB();

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
}));

app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(cookieParser());

app.use('/api/auth', authRoutes);

app.use((req, res) => {
    res.status(404);
    res.json({ message: 'Resource not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=>{
    console.log(`console is running on port: http//:localhost:${PORT}`);
})