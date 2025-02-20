import express from 'express';
import morgan from 'morgan';
import 'dotenv/config'
import mongoose from 'mongoose';

const app = express();
const PORT = 4000;

app.use(morgan('tiny'));
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('mongodb Connected'))
.catch(err => console.log('mongodb Connection Error: ', err));



app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(PORT , () => console.log('SERVER IS RUNNING'))