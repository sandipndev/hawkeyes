import * as dotenv from "dotenv";
import path from "path";
import { prisma } from "./lib/prisma";
import { Client } from "pg";

// Load environment variables from the root .env if it exists
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// Map to track active streams and prevent duplicate initializations
const activeStreams = new Map<string, { name: string; rtspFeed: string; startedAt: Date }>();

async function initStream(camera: { id: string; name: string; rtspFeed: string }) {
  if (activeStreams.has(camera.id)) {
    console.log(`[STREAM] Camera ${camera.name} (${camera.id}) already has an active stream. Skipping initialization.`);
    return;
  }

  console.log(`[STREAM INIT] ${new Date().toISOString()} - Initializing stream for camera: ${camera.name}`);
  console.log(`[STREAM INIT] ID: ${camera.id}`);
  console.log(`[STREAM INIT] RTSP Feed: ${camera.rtspFeed}`);
  
  // Track the stream
  activeStreams.set(camera.id, {
    name: camera.name,
    rtspFeed: camera.rtspFeed,
    startedAt: new Date(),
  });

  // TODO: Implement actual RTSP analysis/logging logic here
  // This could involve spawning ffmpeg processes, connecting to a worker, etc.
  console.log(`[STREAM] Stream for ${camera.name} is now active and being logged.`);
}

async function setupDatabaseListener() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.warn("DATABASE_URL not found in environment. Database listener will not be started.");
    return;
  }

  const pgClient = new Client({
    connectionString: dbUrl,
  });

  try {
    await pgClient.connect();
    console.log("Connected to PostgreSQL for real-time notifications");

    // Create the trigger and function to notify on new camera insertions
    // We use "Camera" because Prisma's default table name is PascalCase
    await pgClient.query(`
      CREATE OR REPLACE FUNCTION notify_camera_created()
      RETURNS trigger AS $$
      BEGIN
        PERFORM pg_notify('camera_created', row_to_json(NEW)::text);
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS camera_created_trigger ON "Camera";
      CREATE TRIGGER camera_created_trigger
      AFTER INSERT ON "Camera"
      FOR EACH ROW EXECUTE FUNCTION notify_camera_created();
    `);

    await pgClient.query('LISTEN camera_created');

    pgClient.on('notification', async (msg) => {
      if (msg.channel === 'camera_created' && msg.payload) {
        try {
          const newCamera = JSON.parse(msg.payload);
          console.log(`[NOTIFICATION] New camera creation detected in database: ${newCamera.name}`);
          await initStream({
            id: newCamera.id,
            name: newCamera.name,
            rtspFeed: newCamera.rtspFeed
          });
        } catch (err) {
          console.error("Error parsing camera_created notification payload:", err);
        }
      }
    });

    console.log("Successfully setup database listener for 'camera_created' events");

    // Optional: Keep the connection alive
    pgClient.on('error', (err) => {
      console.error('PostgreSQL client error:', err);
      // In a real app, you'd want to implement reconnection logic here
    });

  } catch (err) {
    console.error("Failed to setup database listener:", err);
  }
}

async function main() {
  console.log("=========================================");
  console.log("   HAWKEYES BACKEND STARTING UP          ");
  console.log("=========================================");

  try {
    // 1. Initialize existing cameras from the database
    console.log("Fetching existing cameras from database...");
    const existingCameras = await prisma.camera.findMany();
    console.log(`Found ${existingCameras.length} existing cameras. Initializing streams...`);
    
    for (const camera of existingCameras) {
      await initStream(camera);
    }

    // 2. Setup real-time listener for new cameras
    await setupDatabaseListener();

    console.log("=========================================");
    console.log("   BACKEND READY AND LISTENING           ");
    console.log("=========================================");

  } catch (err) {
    console.error("Error during backend startup:", err);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error in backend:", err);
  process.exit(1);
});
