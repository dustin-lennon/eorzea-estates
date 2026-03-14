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

type Step = { title: string; description: string; image?: string }

const TELEPORT_STEP: Step = {
  title: "Travel to a residential area",
  description:
    "Open the Teleportation menu and select a residential area aetheryte. Choose the appropriate option — Apartment, Estate Hall (Private), or Estate Hall (Free Company) — to travel directly to your estate or apartment building.",
  image: "/images/verification_how_to/estate_teleportation_selection.png",
}

const NAMEPLATE_STEPS: Step[] = [
  {
    title: "Open Character Configuration",
    description:
      "Open the System menu in-game and select Character Configuration, or press the associated keybind (default: K).",
    image: "/images/verification_how_to/character_configuration/character_configuration_1.png",
  },
  {
    title: "Go to Display Name Settings",
    description:
      "In the Character Configuration window, select the Own tab at the top, then locate the Display Name Settings option under the Own section.",
    image: "/images/verification_how_to/character_configuration/character_configuration_2.png",
  },
  {
    title: "Set Display Name to Always",
    description:
      "Click the dropdown next to Display Name Settings under Own and select Always so your nameplate is always visible.",
    image: "/images/verification_how_to/character_configuration/character_configuration_3.png",
  },
  {
    title: "Click Apply",
    description: "Click the Apply button at the bottom of the window to save the change.",
    image: "/images/verification_how_to/character_configuration/character_configuration_4.png",
  },
  {
    title: "Click Close",
    description: "Click Close to exit Character Configuration. Your nameplate will now be visible in the scene.",
    image: "/images/verification_how_to/character_configuration/character_configuration_5.png",
  },
]

const STEPS_BY_TYPE: Record<string, Step[]> = {
  PRIVATE: [
    TELEPORT_STEP,
    ...NAMEPLATE_STEPS,
    {
      title: "Open the estate placard",
      description:
        "Right-click the placard stone near your front gate. The Estate Profile panel must show your character name as Owner and your plot address. Take the screenshot capturing both the Estate Profile panel and your nameplate.",
      image: "/images/verification_how_to/estate_verification_a.png",
    },
  ],
  FC_ESTATE: [
    TELEPORT_STEP,
    ...NAMEPLATE_STEPS,
    {
      title: "Open the estate placard",
      description: "Right-click the placard stone near the front gate to open the Estate Profile panel, which must show Owner = your Free Company name.",
      image: "/images/verification_how_to/estate_verification_b.png",
    },
    {
      title: "Open the Company Profile and take the screenshot",
      description:
        "While the Estate Profile panel is still open, also open your FC's Company Profile. The Company Profile must show Master = your character name. Both panels and your nameplate must be on screen at the same time — then take the screenshot.",
      image: "/images/verification_how_to/free_company_verification/fc_estate_1.png",
    },
  ],
  APARTMENT: [
    TELEPORT_STEP,
    ...NAMEPLATE_STEPS,
    {
      title: "Go to the Apartment Building Entrance",
      description:
        "Approach the Apartment Building Entrance, or the Entrance to Apartments in the Lobby, click it, and select Go to specified apartment.",
      image: "/images/verification_how_to/apartment_verification/apartment_verification_1.png",
    },
    {
      title: "Select your room grouping",
      description:
        "Select the room grouping that your apartment number falls in.",
      image: "/images/verification_how_to/apartment_verification/apartment_verification_2.png",
    },
    {
      title: "Hover over your apartment and take the screenshot",
      description:
        "Hover over your apartment so your full character name is visible — if the name is truncated, hover until it expands. Ensure your character nameplate is visible in the scene, then take the screenshot.",
      image: "/images/verification_how_to/apartment_verification/apartment_verification_3.png",
    },
  ],
  FC_ROOM: [
    TELEPORT_STEP,
    ...NAMEPLATE_STEPS,
    {
      title: "Open Additional Chambers",
      description:
        "Find and interact with the 'Entrance to Additional Chambers' door inside the estate and select 'Move to specified private chambers' to open the Additional Chambers selection window.",
      image: "/images/verification_how_to/fc_room_verification/fc_room_1.png",
    },
    {
      title: "Select your room grouping",
      description:
        "Select the room grouping that your chamber number falls in.",
      image: "/images/verification_how_to/fc_room_verification/fc_room_2.png",
    },
    {
      title: "Highlight your chamber and take the screenshot",
      description:
        "Hover over your chamber room so your full character name is visible in the Occupant column with your nameplate visible, then take the screenshot.",
    },
  ],
}

const VENUE_STEPS: Record<"PRIVATE" | "FC_ESTATE", Step[]> = {
  PRIVATE: STEPS_BY_TYPE.PRIVATE,
  FC_ESTATE: STEPS_BY_TYPE.FC_ESTATE,
}

interface Props {
  estateType: string
}

export function EstateVerifyHowTo({ estateType }: Props) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [venueSubType, setVenueSubType] = useState<"PRIVATE" | "FC_ESTATE">("PRIVATE")

  const isVenue = estateType === "VENUE"
  const steps = isVenue
    ? VENUE_STEPS[venueSubType]
    : (STEPS_BY_TYPE[estateType] ?? STEPS_BY_TYPE.PRIVATE)

  function handleOpenChange(o: boolean) {
    setOpen(o)
    if (!o) {
      setStep(0)
      setVenueSubType("PRIVATE")
    }
  }

  function handleVenueSubType(sub: "PRIVATE" | "FC_ESTATE") {
    setVenueSubType(sub)
    setStep(0)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-1 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors">
          <HelpCircle className="h-3.5 w-3.5" />
          How to take this screenshot?
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>How to take the verification screenshot</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Venue sub-type selector */}
          {isVenue && (
            <div className="flex gap-2">
              <button
                onClick={() => handleVenueSubType("PRIVATE")}
                className={`flex-1 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                  venueSubType === "PRIVATE"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                Private Estate
              </button>
              <button
                onClick={() => handleVenueSubType("FC_ESTATE")}
                className={`flex-1 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                  venueSubType === "FC_ESTATE"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                Free Company Estate
              </button>
            </div>
          )}

          {/* Progress bar */}
          <div className="flex items-center gap-1">
            {steps.map((_, i) => (
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
              Step {step + 1} of {steps.length}
            </p>
            <h3 className="font-semibold text-base">{steps[step].title}</h3>

            {steps[step].image ? (
              <div className="relative aspect-video rounded-lg overflow-hidden border">
                <Image
                  src={steps[step].image}
                  alt={`Step ${step + 1}`}
                  fill
                  className="object-contain"
                />
              </div>
            ) : (
              <div className="aspect-video rounded-lg bg-muted flex items-center justify-center border border-dashed">
                <p className="text-sm text-muted-foreground">Step {step + 1}</p>
              </div>
            )}

            <p className="text-sm text-muted-foreground leading-relaxed">
              {steps[step].description}
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
            {step < steps.length - 1 ? (
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
