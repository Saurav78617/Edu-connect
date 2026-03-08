import jwt from 'jsonwebtoken';
import 'dotenv/config';

async function test() {
  const token = jwt.sign({ id: 5, role: 'STUDENT' }, process.env.JWT_SECRET);
  const result = await fetch('http://localhost:3000/api/sessions/book', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      mentorId: 1,
      scheduledAt: new Date().toISOString(),
      price: 1500
    })
  });
  console.log(result.status, await result.text());
}
test();
