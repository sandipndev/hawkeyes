import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()

  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const { cameras } = await req.json()

    // Verify ownership
    const sitePlan = await prisma.sitePlan.findUnique({
      where: {
        id: id,
        userId: session.user.id,
      }
    })

    if (!sitePlan) {
      return new NextResponse("Not Found", { status: 404 })
    }

    // Update cameras: Simple approach - delete and recreate
    // In a production app, you'd want to perform a more sophisticated sync
    await prisma.$transaction([
      prisma.camera.deleteMany({
        where: {
          sitePlanId: id,
        },
      }),
      prisma.camera.createMany({
        data: cameras.map((c: any) => ({
          name: c.name,
          rtspFeed: c.rtspFeed,
          sitePlanId: id,
        })),
      }),
    ])

    return new NextResponse("OK", { status: 200 })
  } catch (error) {
    console.error("[CAMERAS_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

