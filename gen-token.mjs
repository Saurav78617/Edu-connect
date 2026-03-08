import jwt from 'jsonwebtoken';

const token = jwt.sign({ id: 5, role: 'STUDENT' }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '24h' });
console.log(token);
