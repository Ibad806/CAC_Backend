import express from 'express';
import morgan from 'morgan';
import cors from "cors";
import 'dotenv/config'
import mongoose from 'mongoose';
import authRoutes from "./routers/auth.js";

const app = express();
// const PORT = 4000;

app.use(morgan('tiny'));
app.use(express.json());

app.use(
    cors({
      origin: "http://localhost:5173",
      methods: ["GET", "POST", "PUT", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    })
  );
  

mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('mongodb Connected'))
.catch(err => console.log('mongodb Connection Error: ', err));

// Use routes
app.use("/auth", authRoutes);



app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(process.env.PORT , () => console.log('SERVER IS RUNNING'))