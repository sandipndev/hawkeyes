import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import SitePlanView from "./site-plan-view"

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function SitePlanPage({ params }: PageProps) {
  const { id } = await params
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const sitePlan = await prisma.sitePlan.findUnique({
    where: {
      id: id,
      userId: session.user.id,
    },
    include: {
      cameras: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  })

  if (!sitePlan) {
    notFound()
  }

  return <SitePlanView sitePlan={sitePlan as any} />
}

