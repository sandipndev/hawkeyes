import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const session = await auth()

  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const { name, data } = await req.json()

    if (!name || !data) {
      return new NextResponse("Missing required fields", { status: 400 })
    }

    const sitePlan = await prisma.sitePlan.create({
      data: {
        name,
        data,
        userId: session.user.id,
      },
    })

    return NextResponse.json(sitePlan)
  } catch (error) {
    console.error("[SITE_PLANS_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function GET() {
  const session = await auth()

  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const sitePlans = await prisma.sitePlan.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(sitePlans)
  } catch (error) {
    console.error("[SITE_PLANS_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

