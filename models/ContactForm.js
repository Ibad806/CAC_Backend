// models/Contact.js
import mongoose from 'mongoose';
import User from './User.js';
const { Schema } = mongoose;

const contactSchema = new Schema({
    name: String,
    email: String,
    department: String,
    subject: String,
    message: String,
    User: {
        type: Schema.Types.ObjectId,
        ref: User
    }
});

const ContactForm = mongoose.model('ContactForm', contactSchema);
export default ContactForm;