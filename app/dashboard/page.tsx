import { auth, signOut } from "@/auth"
import { redirect } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Camera, Video, MapPin, ExternalLink, Plus, LayoutDashboard, Settings, Bell } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { CameraStream } from "@/components/camera-stream"

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

  const cameras = await (prisma as any).camera.findMany({
    where: {
      sitePlan: {
        userId: session.user.id,
      },
    },
    include: {
      sitePlan: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Sidebar-style Header for consistent layout */}
      <header className="sticky top-0 z-50 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Video className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold tracking-tight">Hawkeyes</span>
              </div>
              
              <nav className="hidden md:flex items-center gap-1">
                <Link href="/dashboard" className="px-3 py-2 text-sm font-medium text-white bg-neutral-900 rounded-md">
                  Overview
                </Link>
                <Link href="#" className="px-3 py-2 text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-900 rounded-md transition-colors">
                  Detections
                </Link>
                <Link href="#" className="px-3 py-2 text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-900 rounded-md transition-colors">
                  Settings
                </Link>
              </nav>
            </div>
            
            <div className="flex items-center gap-4">
              <button className="p-2 text-neutral-400 hover:text-white transition-colors">
                <Bell className="w-5 h-5" />
              </button>
              
              <div className="h-8 w-[1px] bg-neutral-800 mx-2" />
              
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium leading-none">{session.user.name}</p>
                  <p className="text-[10px] text-neutral-500 mt-1 uppercase tracking-tighter">Premium Plan</p>
                </div>
                {session.user.image && (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    width={32}
                    height={32}
                    className="rounded-full border border-neutral-800 shadow-sm"
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
                    className="text-xs text-neutral-500 hover:text-red-400 transition-colors font-medium ml-2"
                  >
                    Sign out
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col gap-12">
          
          {/* Top Section: Siteplans Summary */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold">Your Siteplans</h2>
                <p className="text-sm text-neutral-500">Manage your locations and camera placements</p>
              </div>
              <Link href="/dashboard/new-site">
                <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-600/20 active:scale-95">
                  <Plus className="w-4 h-4" />
                  <span>New Siteplan</span>
                </button>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {sitePlans.length === 0 ? (
                <div className="col-span-full h-32 bg-neutral-900/50 border border-neutral-800 border-dashed rounded-2xl flex items-center justify-center">
                  <p className="text-neutral-500 text-sm">No siteplans created yet</p>
                </div>
              ) : (
                sitePlans.map((plan) => (
                  <Link
                    key={plan.id}
                    href={`/siteplan/${plan.id}`}
                    className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl hover:border-blue-500/50 hover:bg-neutral-900/80 transition-all group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ExternalLink className="w-3 h-3 text-neutral-500" />
                    </div>
                    <div className="flex flex-col gap-3">
                      <div className="w-10 h-10 bg-neutral-800 rounded-xl flex items-center justify-center text-neutral-400 group-hover:text-blue-400 group-hover:bg-blue-400/10 transition-colors">
                        <LayoutDashboard className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm group-hover:text-blue-400 transition-colors">{plan.name}</h4>
                        <p className="text-[10px] text-neutral-500 mt-1 uppercase tracking-wider">
                          Created {new Date(plan.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>

          {/* Main Section: Live Camera Feeds */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold">Live Camera Feeds</h2>
                <Badge variant="outline" className="border-green-500/30 text-green-400 bg-green-500/5 px-2 py-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse mr-1.5" />
                  {cameras.length} Online
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <select className="bg-neutral-900 border border-neutral-800 rounded-lg text-xs px-3 py-1.5 text-neutral-400 focus:outline-none focus:ring-1 focus:ring-blue-500">
                  <option>All Sites</option>
                  {sitePlans.map(p => <option key={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>
            
            {cameras.length === 0 ? (
              <div className="bg-neutral-900/50 border border-neutral-800 border-dashed rounded-3xl p-20 text-center">
                <div className="w-16 h-16 bg-neutral-800 rounded-2xl flex items-center justify-center mx-auto mb-4 text-neutral-600">
                  <Camera className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">No cameras connected</h3>
                <p className="text-neutral-500 text-sm max-w-xs mx-auto mb-6">
                  Add cameras to your siteplans to see live RTSP feeds directly on your dashboard.
                </p>
                <Link href="/dashboard/new-site">
                  <button className="text-blue-500 hover:text-blue-400 text-sm font-semibold transition-colors">
                    Get started by creating a siteplan →
                  </button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cameras.map((camera: any) => (
                  <div key={camera.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden flex flex-col group hover:border-blue-500/30 transition-all shadow-xl shadow-black/20">
                    {/* Video Stream Container */}
                    <div className="aspect-video bg-neutral-950 relative overflow-hidden">
                      <CameraStream 
                        rtspUrl={camera.rtspFeed} 
                        cameraId={camera.id}
                      />
                      
                      {/* Dark overlay for text readability - slightly lighter than before to see video */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none z-10" />
                      
                      {/* Overlay: Status & Site */}
                      <div className="absolute top-3 left-3 flex items-center gap-2 z-20">
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-black/60 backdrop-blur-md rounded-md border border-white/10">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                          <span className="text-[9px] font-black text-white uppercase tracking-wider">Live</span>
                        </div>
                      </div>

                      <div className="absolute top-3 right-3 z-20">
                        <div className="px-2 py-1 bg-blue-600/20 backdrop-blur-md rounded-md border border-blue-500/30">
                          <span className="text-[9px] font-bold text-blue-400 uppercase tracking-tighter">{camera.sitePlan.name}</span>
                        </div>
                      </div>
                      
                      {/* Overlay: Camera Feed Info */}
                      <div className="absolute bottom-3 left-3 right-3 z-20">
                         <div className="flex flex-col">
                            <h4 className="font-bold text-white text-sm mb-0.5">{camera.name}</h4>
                            <p className="text-[9px] font-mono text-neutral-400 truncate opacity-70">{camera.rtspFeed}</p>
                         </div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-neutral-900 flex justify-between items-center border-t border-neutral-800/50">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-neutral-500 uppercase tracking-widest leading-none mb-1">Detections</span>
                          <span className="text-xs font-bold text-neutral-300">0 today</span>
                        </div>
                        <div className="w-[1px] h-6 bg-neutral-800" />
                        <div className="flex flex-col">
                          <span className="text-[10px] text-neutral-500 uppercase tracking-widest leading-none mb-1">Uptime</span>
                          <span className="text-xs font-bold text-neutral-300">99.9%</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-1">
                        <button className="p-2 hover:bg-neutral-800 rounded-lg transition-colors text-neutral-500 hover:text-white" title="Camera Settings">
                          <Settings className="w-4 h-4" />
                        </button>
                        <Link href={`/siteplan/${camera.sitePlan.id}`}>
                          <button className="p-2 hover:bg-neutral-800 rounded-lg transition-colors text-neutral-500 hover:text-white" title="View on map">
                            <MapPin className="w-4 h-4" />
                          </button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}

