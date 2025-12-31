import { auth, signOut } from "@/auth"
import { redirect } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { prisma } from "@/lib/prisma"

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const sitePlans = await prisma.sitePlan.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-8">
      <header className="flex justify-between items-center mb-12 max-w-6xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold">Hawkeyes</h1>
          <p className="text-neutral-400">Dashboard</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium">{session.user.name}</p>
            <p className="text-xs text-neutral-500">{session.user.email}</p>
          </div>
          {session.user.image && (
            <Image
              src={session.user.image}
              alt={session.user.name || "User"}
              width={40}
              height={40}
              className="rounded-full border border-neutral-800"
            />
          )}
          <form
            action={async () => {
              "use server"
              await signOut({ redirectTo: "/" })
            }}
          >
            <button
              type="submit"
              className="bg-neutral-800 hover:bg-neutral-700 text-sm py-2 px-4 rounded-lg transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl flex flex-col">
            <h3 className="text-lg font-semibold mb-2">My Siteplans</h3>
            <p className="text-neutral-400 text-sm mb-4">View and edit your site plans and 3D neighborhoods.</p>
            
            <div className="flex-1 space-y-4 mb-4">
              {sitePlans.length === 0 ? (
                <div className="aspect-video bg-neutral-800 rounded-lg flex items-center justify-center border border-neutral-700 border-dashed">
                  <span className="text-neutral-500">No siteplans yet</span>
                </div>
              ) : (
                <div className="grid gap-3">
                  {sitePlans.map((plan) => (
                    <Link
                      key={plan.id}
                      href={`/siteplan/${plan.id}`}
                      className="p-3 bg-neutral-800 rounded-xl border border-neutral-700 hover:border-blue-500/50 hover:bg-neutral-800/80 transition-all group block"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-sm group-hover:text-blue-400 transition-colors">{plan.name}</span>
                        <span className="text-[10px] text-neutral-500 uppercase">
                          {new Date(plan.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link href="/dashboard/new-site">
              <button className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-sm font-medium transition-colors">
                Create New Siteplan
              </button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

