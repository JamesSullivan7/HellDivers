import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "decay liberation",
  { hours: 1 },
  internal.war.tickDecay,
);

export default crons;
