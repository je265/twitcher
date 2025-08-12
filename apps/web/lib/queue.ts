import { Queue, Job } from "bullmq";
import IORedis from "ioredis";

export const connection = new IORedis(process.env.REDIS_URL!);

class StreamQueue extends Queue {
  constructor(name: string, opts: any) {
    super(name, opts);
  }

  async getNextJob(workerName: string): Promise<Job | null> {
    try {
      // Get waiting jobs and remove the first one from the queue
      const waitingJobs = await this.getWaiting(0, 0);
      if (waitingJobs.length > 0) {
        const job = waitingJobs[0];
        // Remove the job from waiting state so it won't be picked up again
        await job.remove();
        return job;
      }
      return null;
    } catch (error) {
      console.error("Failed to get next job:", error);
      return null;
    }
  }
}

export const streamQueue = new StreamQueue("stream-jobs", { connection });
