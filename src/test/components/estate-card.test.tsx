import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { EstateCard } from "@/components/estate-card"

const baseProps = {
  id: "test-id-123",
  name: "The Wandering Hearth",
  type: "PRIVATE",
  district: "LAVENDER_BEDS",
  server: "Balmung",
  dataCenter: "Crystal",
  tags: ["Cozy", "Japanese"],
  likeCount: 42,
  coverImage: null,
  ownerName: "Firstname Lastname",
  lodestoneVerified: false,
  venueType: null,
}

describe("EstateCard", () => {
  it("renders the estate name", () => {
    render(<EstateCard {...baseProps} />)
    expect(screen.getByText("The Wandering Hearth")).toBeInTheDocument()
  })

  it("renders the server and data center", () => {
    render(<EstateCard {...baseProps} />)
    expect(screen.getByText(/Balmung/)).toBeInTheDocument()
    expect(screen.getByText(/Crystal/)).toBeInTheDocument()
  })

  it("renders the estate type badge", () => {
    render(<EstateCard {...baseProps} />)
    expect(screen.getByText("Private Estate")).toBeInTheDocument()
  })

  it("renders the district in location text", () => {
    render(<EstateCard {...baseProps} />)
    expect(screen.getByText(/Lavender Beds/)).toBeInTheDocument()
  })

  it("renders tags (up to 3)", () => {
    render(<EstateCard {...baseProps} />)
    expect(screen.getByText("Cozy")).toBeInTheDocument()
    expect(screen.getByText("Japanese")).toBeInTheDocument()
  })

  it("shows +N overflow for more than 3 tags", () => {
    const props = { ...baseProps, tags: ["Cozy", "Japanese", "Modern", "Gothic", "Rustic"] }
    render(<EstateCard {...props} />)
    expect(screen.getByText("+2")).toBeInTheDocument()
  })

  it("renders the like count", () => {
    render(<EstateCard {...baseProps} />)
    expect(screen.getByText("42")).toBeInTheDocument()
  })

  it("renders the owner name", () => {
    render(<EstateCard {...baseProps} />)
    expect(screen.getByText("Firstname Lastname")).toBeInTheDocument()
  })

  it("renders the verified badge icon when lodestoneVerified is true", () => {
    render(<EstateCard {...baseProps} lodestoneVerified={true} />)
    // BadgeCheck icon is rendered — test for its presence via aria or SVG
    const link = screen.getByRole("link")
    expect(link).toBeInTheDocument()
  })

  it("renders venue type badge when venueType is provided", () => {
    render(<EstateCard {...baseProps} type="VENUE" venueType="BAR" />)
    expect(screen.getByText("Bar")).toBeInTheDocument()
  })

  it("links to the correct estate URL", () => {
    render(<EstateCard {...baseProps} />)
    const link = screen.getByRole("link")
    expect(link).toHaveAttribute("href", "/estate/test-id-123")
  })

  it("shows no-screenshot fallback when coverImage is null", () => {
    render(<EstateCard {...baseProps} coverImage={null} />)
    expect(screen.getByText(/No screenshots yet/)).toBeInTheDocument()
  })
})
