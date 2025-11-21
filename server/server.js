import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './configs/mongodb.js';
import { clerkWebhooks, stripeWebhooks } from './controllers/webhooks.js';
import educatorRouter from './routes/educatorRoutes.js';
import { clerkMiddleware } from '@clerk/express';
import connectCloudinay from './configs/cloudinary.js';
import courseRouter from './routes/courseRoute.js';
import userRouter from './routes/userRoutes.js';

// initialize express 
const app = express();

// connect to db
await connectDB();
await connectCloudinay();

// --- CRITICAL MIDDLEWARE ---

// 1. Webhook Isolation: Clerk webhooks must run BEFORE the main JSON parser
// Note: Webhooks often require the raw body or a specific parser.
app.post('/clerk', express.json({ verify: (req, res, buf) => { req.rawBody = buf; } }), clerkWebhooks);
// app.post('/stripe', express.raw({type: 'application/json'}), stripeWebhooks); // Stripe is fine with express.raw

// 2. Global JSON Body Parsing: THIS IS THE FIX.
// All other routes can now read req.body
app.use(express.json());

// 3. CORS and Clerk Middleware
app.use(cors());
app.use(clerkMiddleware()); 

// --- ROUTES ---
app.get('/', (req,res)=>{res.send("STEMA API is working fine NOW!")})

// Routers no longer need the express.json() middleware inline
app.use('/api/educator', educatorRouter);
app.use('/api/course', courseRouter);
app.use('/api/user', userRouter);


// port
const PORT = process.env.PORT || 3000;

app.listen(PORT, ()=> {
    console.log(`Server is running on ${PORT}`);
})