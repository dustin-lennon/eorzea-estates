import { Metadata } from "next"
import { EstateSubmitForm } from "./estate-submit-form"

export const metadata: Metadata = { title: "Submit Estate" }

export default function SubmitPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Submit Your Estate</h1>
        <p className="text-muted-foreground mt-1">
          Share your housing creation with the community. All fields marked with * are required.
        </p>
      </div>
      <EstateSubmitForm />
    </div>
  )
}
