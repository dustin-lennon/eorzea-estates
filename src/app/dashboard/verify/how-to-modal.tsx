"use client"

import { useState } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const STEPS: { title: string; description: string; image?: string }[] = [
  {
    title: "Copy your verification code",
    description:
      "Click the copy button next to your verification code on the previous screen. The code will be copied to your clipboard.",
    image: "/images/code_how_to/step_1.png",
  },
  {
    title: "Go to the Lodestone and log in",
    description:
      "Open na.finalfantasyxiv.com/lodestone in your browser. Click the 'Log In' button in the top-right corner of the page.",
    image: "/images/code_how_to/step_2.png",
  },
  {
    title: "Log in with your Square Enix account",
    description:
      "Enter your Square Enix ID and password. If you have a security token (authenticator), you will also need your one-time password.",
  },
  {
    title: "Select your character",
    description:
      "After logging in, you will be prompted to select a character. Choose the character you want to verify on Eorzea Estates.",
  },
  {
    title: "Open Character Profile settings",
    description:
      "Click your character portrait in the top-right corner to open the account menu. Select 'Character Profile' from the dropdown.",
  },
  {
    title: "Edit your profile bio",
    description:
      "Scroll down to the 'Character Profile' section. Click the pencil (edit) icon to open the bio editor.",
  },
  {
    title: "Paste the verification code",
    description:
      "Paste your verification code anywhere in the text field. You can keep any existing bio — the code just needs to be present somewhere. Click 'Confirm' when done.",
  },
  {
    title: "Confirm your changes",
    description:
      "A preview of your profile will appear. Click 'Confirm' again to publish the updated bio.",
  },
  {
    title: "Return here and click Verify",
    description:
      "Come back to Eorzea Estates and click the 'Verify' button. Once verified, you can remove the code from your Lodestone bio.",
  },
]

export function HowToModal() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)

  function handleOpenChange(o: boolean) {
    setOpen(o)
    if (!o) setStep(0)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-1 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors">
          <HelpCircle className="h-3.5 w-3.5" />
          How do I add this code?
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>How to add your verification code</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Progress bar */}
          <div className="flex items-center gap-1">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors duration-200 ${
                  i <= step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>

          {/* Step content */}
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Step {step + 1} of {STEPS.length}
            </p>
            <h3 className="font-semibold text-base">{STEPS[step].title}</h3>

            {/* Screenshot */}
            {STEPS[step].image ? (
              <div className="relative aspect-video rounded-lg overflow-hidden border">
                <Image
                  src={STEPS[step].image}
                  alt={`Step ${step + 1}`}
                  fill
                  className="object-contain"
                />
              </div>
            ) : (
              <div className="aspect-video rounded-lg bg-muted flex items-center justify-center border border-dashed">
                <p className="text-sm text-muted-foreground">Screenshot — Step {step + 1}</p>
              </div>
            )}

            <p className="text-sm text-muted-foreground leading-relaxed">
              {STEPS[step].description}
            </p>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep((s) => s - 1)}
              disabled={step === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            {step < STEPS.length - 1 ? (
              <Button size="sm" onClick={() => setStep((s) => s + 1)}>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button size="sm" onClick={() => setOpen(false)}>
                Got it!
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
