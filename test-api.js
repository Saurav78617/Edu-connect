fetch("https://educonnects.app/api/debug")
  .then(res => res.text())
  .then(text => console.log("Debug response (first 200 chars):", text.slice(0, 200)))
  .catch(console.error);

fetch("https://educonnects.app/api/mentors")
  .then(res => res.text())
  .then(text => console.log("Mentors response:", text))
  .catch(console.error);
