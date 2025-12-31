import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { spawn, execSync } from "child_process";

// Cache the availability of ffmpeg to avoid checking on every request
let isFfmpegAvailable: boolean | null = null;

function checkFfmpeg() {
  if (isFfmpegAvailable !== null) return isFfmpegAvailable;
  try {
    execSync("ffmpeg -version", { stdio: "ignore" });
    isFfmpegAvailable = true;
  } catch (e) {
    isFfmpegAvailable = false;
  }
  return isFfmpegAvailable;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const camera = await prisma.camera.findUnique({
      where: { id },
      include: {
        sitePlan: true,
      },
    });

    if (!camera || camera.sitePlan.userId !== session.user.id) {
      return new NextResponse("Not Found", { status: 404 });
    }

    // Capture a single frame from the RTSP stream
    // We try to use local ffmpeg first for performance, fallback to Docker
    const frameBuffer = await new Promise<Buffer>((resolve, reject) => {
      const buffers: Buffer[] = [];
      const hasLocalFfmpeg = checkFfmpeg();
      
      const cmd = hasLocalFfmpeg ? "ffmpeg" : "docker";
      const baseArgs = [
        "-rtsp_transport", "tcp",
        "-i", camera.rtspFeed,
        "-vframes", "1",
        "-f", "image2",
        "-vcodec", "mjpeg",
        "-loglevel", "error",
        "-"
      ];

      const args = hasLocalFfmpeg 
        ? baseArgs 
        : [
            "run", "--rm", "--network", "host",
            "linuxserver/ffmpeg:version-4.4-cli",
            ...baseArgs
          ];

      const ffmpegProcess = spawn(cmd, args);

      ffmpegProcess.stdout.on("data", (chunk) => {
        buffers.push(chunk);
      });

      ffmpegProcess.stderr.on("data", (data) => {
        if (data.toString().includes("Error")) {
          console.error(`FFmpeg stderr: ${data}`);
        }
      });

      ffmpegProcess.on("close", (code) => {
        if (code === 0 && buffers.length > 0) {
          resolve(Buffer.concat(buffers));
        } else {
          reject(new Error(`FFmpeg process ${cmd} exited with code ${code}`));
        }
      });

      ffmpegProcess.on("error", (err) => {
        reject(err);
      });
    });

    return new NextResponse(frameBuffer as any, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("[CAMERA_FRAME_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

