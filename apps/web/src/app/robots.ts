import type { MetadataRoute } from "next";
import { env } from "../env";
import { buildRobots } from "../metadata/build-robots";

/** Served at `/robots.txt`. */
const robots = (): MetadataRoute.Robots => buildRobots(env.AUTH_PROXY_URL);

export default robots;
