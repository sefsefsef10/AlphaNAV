import cron from "node-cron";
import { checkAllDueCovenants } from "./services/covenantMonitoring";

/**
 * Initialize all scheduled jobs for AlphaNAV
 */
export function initializeScheduler() {
  console.log("Initializing automated job scheduler...");

  // Run covenant monitoring daily at 2 AM
  // Cron format: minute hour day month weekday
  // "0 2 * * *" = Every day at 2:00 AM
  const covenantMonitoringJob = cron.schedule("0 2 * * *", async () => {
    console.log("Running automated covenant monitoring check...");
    
    try {
      const results = await checkAllDueCovenants();
      const breaches = results.filter((r) => r.breachDetected);
      
      console.log(`Covenant monitoring complete:`);
      console.log(`  - Total covenants checked: ${results.length}`);
      console.log(`  - New breaches detected: ${breaches.length}`);
      
      if (breaches.length > 0) {
        console.warn(`ALERT: ${breaches.length} covenant breaches detected`);
        breaches.forEach((breach) => {
          console.warn(`  - Covenant ${breach.covenantId}: ${breach.previousStatus} → ${breach.newStatus}`);
        });
      }
    } catch (error) {
      console.error("Covenant monitoring job failed:", error);
    }
  });

  // Run a more frequent check during business hours (Mon-Fri, every 4 hours 8am-6pm)
  // "0 8,12,16 * * 1-5" = Mon-Fri at 8am, 12pm, 4pm
  const frequentCheckJob = cron.schedule("0 8,12,16 * * 1-5", async () => {
    console.log("Running business hours covenant check...");
    
    try {
      const results = await checkAllDueCovenants();
      const urgent = results.filter(
        (r) => r.breachDetected || (r.newStatus === "warning" && r.previousStatus === "compliant")
      );
      
      if (urgent.length > 0) {
        console.warn(`BUSINESS HOURS ALERT: ${urgent.length} urgent covenant issues`);
      }
    } catch (error) {
      console.error("Business hours covenant check failed:", error);
    }
  });

  console.log("✓ Automated covenant monitoring scheduled:");
  console.log("  - Daily check: Every day at 2:00 AM");
  console.log("  - Business hours check: Mon-Fri at 8am, 12pm, 4pm");

  // Return job objects for potential manual control
  return {
    covenantMonitoringJob,
    frequentCheckJob,
  };
}

/**
 * Stop all scheduled jobs (useful for testing or graceful shutdown)
 */
export function stopScheduler(jobs: ReturnType<typeof initializeScheduler>) {
  console.log("Stopping all scheduled jobs...");
  jobs.covenantMonitoringJob.stop();
  jobs.frequentCheckJob.stop();
  console.log("✓ All scheduled jobs stopped");
}
