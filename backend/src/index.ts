import * as dotenv from "dotenv";
import path from "path";
import { prisma } from "./lib/prisma";
import { Client } from "pg";
import ffmpeg from "fluent-ffmpeg";
import { Kafka, Partitioners } from "kafkajs";
import { Stream } from "stream";

// Load environment variables from the root .env if it exists
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// --- KAFKA SETUP ---
const kafka = new Kafka({
  clientId: "hawkeyes-backend",
  brokers: [process.env.CONFLUENT_BOOTSTRAP_SERVER || "localhost:9092"],
  ssl: !!process.env.CONFLUENT_BOOTSTRAP_SERVER,
  sasl: process.env.CONFLUENT_API_KEY
    ? {
        mechanism: "plain",
        username: process.env.CONFLUENT_API_KEY,
        password: process.env.CONFLUENT_API_SECRET!,
      }
    : undefined,
});

const producer = kafka.producer({
  createPartitioner: Partitioners.DefaultPartitioner,
});
let isProducerConnected = false;

async function ensureProducer() {
  if (!isProducerConnected) {
    await producer.connect();
    isProducerConnected = true;
    console.log("✅ Connected to Confluent Cloud/Kafka");
  }
  return producer;
}

// Map to track active streams and prevent duplicate initializations
const activeStreams = new Map<
  string,
  {
    name: string;
    rtspFeed: string;
    startedAt: Date;
    intervalId?: NodeJS.Timeout;
  }
>();

async function getCamera3DContext(cameraId: string) {
  const camera = await prisma.camera.findUnique({
    where: { id: cameraId },
    include: { sitePlan: true },
  });

  if (!camera || !camera.sitePlan) return null;

  const data = camera.sitePlan.data as any; // Neighborhood

  // Search in towerCctvs
  const towerCam = data.towerCctvs?.find((c: any) => c.id === cameraId);
  if (towerCam) {
    const yaw = ((towerCam.yaw || 0) * Math.PI) / 180;
    const pitch = ((towerCam.pitch || 0) * Math.PI) / 180;
    return {
      x: towerCam.position.x,
      y: towerCam.towerHeight + towerCam.height,
      z: towerCam.position.y,
      zone_label: camera.sitePlan.name,
      facing_vector: [
        Math.cos(pitch) * Math.sin(yaw),
        -Math.sin(pitch),
        Math.cos(pitch) * Math.cos(yaw),
      ],
    };
  }

  // Search in buildings -> floors -> rooms -> sensors -> cctvs
  for (const building of data.buildings || []) {
    const buildingPos = {
      x: building.position.x,
      y: 0,
      z: building.position.y,
    };
    let currentY = 0;
    for (const floor of building.floors || []) {
      for (const room of floor.rooms || []) {
        const cctv = room.sensors?.cctvs?.find((c: any) => c.id === cameraId);
        if (cctv) {
          const yaw = ((cctv.yaw || 0) * Math.PI) / 180;
          const pitch = ((cctv.pitch || 0) * Math.PI) / 180;
          return {
            x: cctv.position.x + room.position.x + buildingPos.x,
            y: currentY + cctv.height,
            z: cctv.position.y + room.position.y + buildingPos.z,
            zone_label: `${building.name} - ${room.name}`,
            facing_vector: [
              Math.cos(pitch) * Math.sin(yaw),
              -Math.sin(pitch),
              Math.cos(pitch) * Math.cos(yaw),
            ],
          };
        }
      }
      currentY += floor.height;
    }
  }

  return null;
}

async function captureFrame(camera: { id: string; rtspFeed: string }, context: any) {
  const timestamp = Date.now();
  let bufferStream = new Stream.PassThrough();
  let buffers: Buffer[] = [];

  ffmpeg(camera.rtspFeed)
    .inputOptions(["-rtsp_transport tcp"])
    .noAudio()
    .outputOptions([
      "-frames:v 1",
      "-f image2pipe",
      "-vcodec mjpeg",
      "-q:v 5",
    ])
    .on("error", (err) => {
      console.error(`[FFMPEG ERROR] Camera ${camera.id}:`, err.message);
    })
    .on("end", async () => {
      const imageBuffer = Buffer.concat(buffers);
      if (imageBuffer.length === 0) return;

      const payload = {
        camera_id: camera.id,
        timestamp,
        image_bytes: imageBuffer.toString("base64"),
        camera_3d_ctx: context,
      };

      try {
        const prod = await ensureProducer();
        await prod.send({
          topic: "raw_video_frames",
          messages: [{ value: JSON.stringify(payload) }],
        });
        console.log(
          `[${new Date().toISOString()}] 📸 Sent frame for ${camera.id} (${
            imageBuffer.length
          } bytes) to Confluent`
        );
      } catch (err) {
        console.error(
          `[KAFKA ERROR] Failed to send frame for ${camera.id}:`,
          err
        );
      }
    })
    .pipe(bufferStream);

  bufferStream.on("data", (chunk) => buffers.push(chunk));
}

async function initStream(camera: {
  id: string;
  name: string;
  rtspFeed: string;
}) {
  if (activeStreams.has(camera.id)) {
    console.log(
      `[STREAM] Camera ${camera.name} (${camera.id}) already has an active stream. Skipping initialization.`
    );
    return;
  }

  console.log(
    `[STREAM INIT] ${new Date().toISOString()} - Initializing stream for camera: ${
      camera.name
    }`
  );
  console.log(`[STREAM INIT] ID: ${camera.id}`);
  console.log(`[STREAM INIT] RTSP Feed: ${camera.rtspFeed}`);

  // Get 3D context
  const context = await getCamera3DContext(camera.id);
  if (!context) {
    console.warn(`[STREAM] Could not find 3D context for camera ${camera.id}. Using default context.`);
  }

  // Set up frame capture interval (every 2 seconds)
  const intervalId = setInterval(() => {
    captureFrame(camera, context || {
      x: 0, y: 0, z: 0,
      zone_label: "Unknown",
      facing_vector: [0, 0, 1]
    });
  }, 2000);

  // Track the stream
  activeStreams.set(camera.id, {
    name: camera.name,
    rtspFeed: camera.rtspFeed,
    startedAt: new Date(),
    intervalId,
  });

  console.log(
    `[STREAM] Stream for ${camera.name} is now active and frames are being sent to Kafka.`
  );
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
