"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Save, Layout, Code } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export default function NewSiteWizard() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [name, setName] = useState("")
  const [jsonContent, setJsonContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleNext = () => {
    if (step === 1 && name.trim()) {
      setStep(2)
    }
  }

  const handleBack = () => {
    if (step === 2) {
      setStep(1)
    }
  }

  const handleSave = async () => {
    setIsLoading(true)
    setError("")

    try {
      // Basic JSON validation
      let data
      try {
        data = JSON.parse(jsonContent)
      } catch (e) {
        throw new Error("Invalid JSON format. Please ensure you've pasted valid neighborhood data.")
      }

      const response = await fetch("/api/siteplans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          data,
        }),
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(errorData || "Failed to save site plan")
      }

      router.push("/dashboard")
      router.refresh()
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/dashboard"
            className="w-10 h-10 bg-neutral-900 rounded-xl flex items-center justify-center hover:bg-neutral-800 transition-colors border border-neutral-800"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-sm font-bold uppercase tracking-widest text-neutral-500">Create New</h1>
            <h2 className="text-2xl font-black tracking-tight uppercase">Site Plan Wizard</h2>
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl">
          {/* Progress Bar */}
          <div className="flex gap-2 mb-10">
            <div className={cn("h-1.5 flex-1 rounded-full transition-all duration-500", step >= 1 ? "bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)]" : "bg-neutral-800")} />
            <div className={cn("h-1.5 flex-1 rounded-full transition-all duration-500", step >= 2 ? "bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)]" : "bg-neutral-800")} />
          </div>

          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="space-y-4">
                <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-neutral-400 flex items-center gap-2">
                  <Layout className="w-4 h-4" /> Step 1: Site Name
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Downtown Neighborhood"
                  className="bg-neutral-950 border-neutral-800 focus:border-blue-600 h-14 text-lg rounded-xl"
                  autoFocus
                />
                <p className="text-neutral-500 text-xs">Choose a descriptive name for your site plan.</p>
              </div>

              <Button
                onClick={handleNext}
                disabled={!name.trim()}
                className="w-full py-7 text-sm font-bold uppercase tracking-widest rounded-2xl bg-blue-600 hover:bg-blue-500"
              >
                Continue to JSON <ChevronRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="space-y-4">
                <Label htmlFor="json" className="text-xs font-bold uppercase tracking-widest text-neutral-400 flex items-center gap-2">
                  <Code className="w-4 h-4" /> Step 2: Site JSON
                </Label>
                <textarea
                  id="json"
                  value={jsonContent}
                  onChange={(e) => setJsonContent(e.target.value)}
                  placeholder='{ "buildings": [], "roads": [], ... }'
                  className="w-full h-64 bg-neutral-950 border border-neutral-800 focus:border-blue-600 rounded-xl p-4 font-mono text-sm text-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  autoFocus
                />
                <p className="text-neutral-500 text-xs">Paste the neighborhood JSON data here. It should follow the schema defined in the floorplan directory.</p>
              </div>

              {error && (
                <div className="p-4 bg-red-900/20 border border-red-900/50 rounded-xl text-red-500 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1 py-7 border-neutral-800 bg-transparent hover:bg-neutral-800 text-neutral-400"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!jsonContent.trim() || isLoading}
                  className="flex-[2] py-7 text-sm font-bold uppercase tracking-widest rounded-2xl bg-blue-600 hover:bg-blue-500"
                >
                  {isLoading ? "Saving..." : (
                    <>
                      <Save className="mr-2 w-4 h-4" /> Save Site Plan
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
