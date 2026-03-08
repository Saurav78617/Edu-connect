import jwt from 'jsonwebtoken';
import 'dotenv/config';

async function test() {
  const token = jwt.sign({ id: 5, role: 'STUDENT' }, process.env.JWT_SECRET);
  // Test with a null price
  let result = await fetch('http://localhost:3001/api/sessions/book', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      mentorId: 1,
      scheduledAt: new Date().toISOString(),
      price: null
    })
  });
  console.log("Null Price:", result.status, await result.text());

  // Test with missing mode
  result = await fetch('http://localhost:3001/api/sessions/book', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      mentorId: 1,
      scheduledAt: new Date().toISOString(),
      price: 1000
    })
  });
  console.log("No mode:", result.status, await result.text());
}
test();
