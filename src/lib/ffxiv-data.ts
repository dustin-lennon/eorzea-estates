// Static FFXIV world/server data
// Sources: https://na.finalfantasyxiv.com/lodestone/worldstatus/

export const REGIONS = [
  {
    name: "North America",
    dataCenters: [
      {
        name: "Aether",
        servers: ["Adamantoise", "Cactuar", "Faerie", "Gilgamesh", "Jenova", "Midgardsormr", "Sargatanas", "Siren"],
      },
      {
        name: "Primal",
        servers: ["Behemoth", "Excalibur", "Exodus", "Famfrit", "Hyperion", "Lamia", "Leviathan", "Ultros"],
      },
      {
        name: "Crystal",
        servers: ["Balmung", "Brynhildr", "Coeurl", "Diabolos", "Goblin", "Malboro", "Mateus", "Zalera"],
      },
      {
        name: "Dynamis",
        servers: ["Halicarnassus", "Maduin", "Marilith", "Seraph"],
      },
    ],
  },
  {
    name: "Europe",
    dataCenters: [
      {
        name: "Chaos",
        servers: ["Cerberus", "Louisoix", "Moogle", "Omega", "Phantom", "Ragnarok", "Sagittarius", "Spriggan"],
      },
      {
        name: "Light",
        servers: ["Alpha", "Lich", "Odin", "Phoenix", "Raiden", "Shiva", "Twintania", "Zodiark"],
      },
      {
        name: "Shadow",
        servers: ["Innocence", "Pixie", "Titania", "Tycoon"],
      },
    ],
  },
  {
    name: "Japan",
    dataCenters: [
      {
        name: "Elemental",
        servers: ["Aegis", "Atomos", "Carbuncle", "Garuda", "Gungnir", "Kujata", "Tonberry", "Typhon"],
      },
      {
        name: "Gaia",
        servers: ["Alexander", "Bahamut", "Durandal", "Fenrir", "Ifrit", "Ridill", "Tiamat", "Ultima"],
      },
      {
        name: "Mana",
        servers: ["Anima", "Asura", "Chocobo", "Hades", "Ixion", "Masamune", "Pandaemonium", "Titan"],
      },
      {
        name: "Meteor",
        servers: ["Bismarck", "Ravana", "Sephirot", "Sophia", "Zurvan"],
      },
    ],
  },
  {
    name: "Oceania",
    dataCenters: [
      {
        name: "Materia",
        servers: ["Bismarck", "Ravana", "Sephirot", "Sophia", "Zurvan"],
      },
    ],
  },
]

export const HOUSING_DISTRICTS = [
  { value: "MIST", label: "Mist", expansion: "A Realm Reborn" },
  { value: "LAVENDER_BEDS", label: "Lavender Beds", expansion: "A Realm Reborn" },
  { value: "GOBLET", label: "The Goblet", expansion: "A Realm Reborn" },
  { value: "SHIROGANE", label: "Shirogane", expansion: "Stormblood" },
  { value: "EMPYREUM", label: "Empyreum", expansion: "Endwalker" },
] as const

export const ESTATE_TYPES = [
  { value: "PRIVATE", label: "Private Estate" },
  { value: "FC_ESTATE", label: "Free Company Estate" },
  { value: "VENUE", label: "Venue" },
  { value: "APARTMENT", label: "Apartment" },
  { value: "FC_ROOM", label: "Free Company Room" },
] as const

export const ESTATE_SIZES = [
  { value: "SMALL", label: "Small" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LARGE", label: "Large" },
] as const

export const VENUE_TYPES = [
  { value: "BAR", label: "Bar" },
  { value: "NIGHTCLUB", label: "Nightclub" },
  { value: "CAFE", label: "Café" },
  { value: "RESTAURANT", label: "Restaurant" },
  { value: "GALLERY", label: "Gallery" },
  { value: "LIBRARY", label: "Library" },
  { value: "SHOP", label: "Shop" },
  { value: "BATHHOUSE", label: "Bathhouse" },
  { value: "INN", label: "Inn" },
  { value: "OTHER", label: "Other" },
] as const

export const PREDEFINED_TAGS = [
  "Cozy",
  "Gothic",
  "Japanese",
  "Modern",
  "Fantasy",
  "Minimalist",
  "Rustic",
  "Cafe",
  "Ocean View",
  "Garden",
  "Magical",
  "Industrial",
  "Victorian",
  "Tropical",
  "Snowy",
  "Desert",
  "Library",
  "Workshop",
  "Tavern",
  "Shrine",
  "Castle",
  "Underground",
  "Floating",
  "Seasonal",
  "RP Venue",
  "Roleplay",
  "Event Space",
  "Gallery",
  "Studio",
  "Lounge",
  "Message Book",
] as const

export const DAYS_OF_WEEK = [
  { key: "mon", label: "Monday" },
  { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" },
  { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" },
  { key: "sat", label: "Saturday" },
  { key: "sun", label: "Sunday" },
] as const

export type DayKey = (typeof DAYS_OF_WEEK)[number]["key"]

export type HoursSchedule = Partial<Record<DayKey, string | null>>

// Helper: get all servers flat
export function getAllServers(): string[] {
  return REGIONS.flatMap((r) => r.dataCenters.flatMap((dc) => dc.servers))
}

// Helper: get data centers for a given region name
export function getDataCenters(regionName: string) {
  return REGIONS.find((r) => r.name === regionName)?.dataCenters ?? []
}

// Helper: get servers for a given data center name
export function getServers(regionName: string, dcName: string): string[] {
  return getDataCenters(regionName).find((dc) => dc.name === dcName)?.servers ?? []
}

// Helper: get region name for a given data center name
export function getRegionByDataCenter(dcName: string): string {
  return REGIONS.find((r) => r.dataCenters.some((dc) => dc.name === dcName))?.name ?? ""
}

// Districts that don't apply to apartments/FC rooms
export const PLOT_BASED_TYPES = ["PRIVATE", "FC_ESTATE", "VENUE", "FC_ROOM"] as const
