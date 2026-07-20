const endpoints = [
  "/api/mentors",
  "/api/masterclasses",
  "/api/users/profile"
];
Promise.all(endpoints.map(ep => 
  fetch("https://educonnects.app" + ep)
    .then(res => res.text())
    .then(text => console.log(ep, text))
)).catch(console.error);
