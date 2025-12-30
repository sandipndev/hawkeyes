import { auth, signOut } from "@/auth"
import { redirect } from "next/navigation"
import Image from "next/image"

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl">
            <h3 className="text-lg font-semibold mb-2">My Floorplans</h3>
            <p className="text-neutral-400 text-sm mb-4">View and edit your 3D floorplans.</p>
            <div className="aspect-video bg-neutral-800 rounded-lg flex items-center justify-center border border-neutral-700 dashed">
              <span className="text-neutral-500">No floorplans yet</span>
            </div>
            <button className="mt-4 w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-sm font-medium transition-colors">
              Create New
            </button>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl">
            <h3 className="text-lg font-semibold mb-2">Sensors</h3>
            <p className="text-neutral-400 text-sm mb-4">Active IoT sensors and alerts.</p>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-neutral-800 rounded-xl border border-neutral-700">
                <span className="text-sm">Temperature</span>
                <span className="text-xs font-mono text-green-400">Active</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-neutral-800 rounded-xl border border-neutral-700">
                <span className="text-sm">Occupancy</span>
                <span className="text-xs font-mono text-green-400">Active</span>
              </div>
            </div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl">
            <h3 className="text-lg font-semibold mb-2">Team</h3>
            <p className="text-neutral-400 text-sm mb-4">Manage access and collaborators.</p>
            <button className="w-full border border-neutral-700 hover:bg-neutral-800 py-2 rounded-lg text-sm font-medium transition-colors">
              Invite Members
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

