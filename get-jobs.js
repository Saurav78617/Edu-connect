async function main() {
  try {
    const res = await fetch("https://api.github.com/repos/Saurav78617/Edu-connect/actions/runs/25750320986/jobs");
    const data = await res.json();
    if (!data.jobs || data.jobs.length === 0) {
      console.log("No jobs found or API error:", data);
      return;
    }
    const job = data.jobs[0];
    console.log("Job status:", job.status, "conclusion:", job.conclusion);
    for(const step of job.steps) {
      if(step.conclusion !== "success" && step.conclusion !== "skipped") {
         console.log("Failed step:", step.name, "Status:", step.conclusion);
      }
    }
  } catch(e) {
    console.error(e);
  }
}
main();
