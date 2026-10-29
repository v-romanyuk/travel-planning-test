/**
 * Builds the fixture catalogue: used by `POST /api/catalogue/seed` and by the SQL seed generator
 * (supabase/seed/catalogue/generate-catalogue.ts). Relative imports only, so the generator can run under plain tsx.
 *
 * Transport follows the geography: flights between airport cities 350 km+ apart, trains inside a rail group under
 * 800 km (plus RAIL_LINKS), buses on one landmass, frequent local links to day-trip towns. Stays and places fill the
 * rest, weighted by city size. Names are made up from local word pools; times, prices and tags are plausible, not real.
 */
import type { ISeedCity } from './catalogueCities'
import {
  AIRLINES,
  BUS_OPERATORS,
  CITIES,
  COUNTRY_RAIL_OPERATOR,
  HUB_CODES,
  HUB_NAMES,
  LOCAL_FIRST_NAMES,
  LOCAL_FOOD,
  RAIL_LINKS,
  STAY_PREFIX
} from './catalogueCities'

// The shape of a catalogue_entries row without its id; validated with InsertCatalogueEntrySchema before it's written
export interface ICatalogueSeedEntry {
  ref: string
  kind: 'transport' | 'stay' | 'place'
  cityId: number
  cityName: string
  name: string
  description: string
  priceAmount: number | null
  priceCurrency: string | null
  priceUnit: 'per_night' | 'per_person' | 'per_adult' | 'free' | null
  attributes: Record<string, unknown>
}

const TOTAL = 10_000

interface IRow {
  ref: string
  kind: 'transport' | 'stay' | 'place'
  city: ISeedCity
  name: string
  description: string
  priceAmount: number | null
  priceUnit: 'per_night' | 'per_person' | 'per_adult' | 'free' | null
  attributes: Record<string, unknown>
}

// mulberry32; reset by buildCatalogue so every build is identical
const SEED = 20261028
let state = SEED
const random = () => {
  state = (state + 0x6D2B79F5) | 0
  let t = Math.imul(state ^ (state >>> 15), 1 | state)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t

  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const pick = <T>(list: readonly T[]): T => list[Math.floor(random() * list.length)]!
const between = (min: number, max: number) => min + random() * (max - min)
const int = (min: number, max: number) => Math.floor(between(min, max + 1))
const chance = (p: number) => random() < p
const pickSome = <T>(list: readonly T[], count: number) => [...list].sort(() => random() - 0.5).slice(0, count)

const distanceKm = (a: ISeedCity, b: ISeedCity) => {
  const rad = (deg: number) => deg * Math.PI / 180
  const dLat = rad(b.latitude - a.latitude)
  const dLon = rad(b.longitude - a.longitude)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2

  return 2 * 6371 * Math.asin(Math.sqrt(h))
}

const round5 = (minutes: number) => Math.round(minutes / 5) * 5
const clock = (minutes: number) => {
  const inDay = ((minutes % 1440) + 1440) % 1440

  return `${String(Math.floor(inDay / 60)).padStart(2, '0')}:${String(inDay % 60).padStart(2, '0')}`
}
const money = (amount: number) => amount >= 20 ? Math.round(amount) : Math.round(amount * 10) / 10

const rows: IRow[] = []
const refCounters = new Map<string, number>()
const nextRef = (prefix: string) => {
  const n = (refCounters.get(prefix) ?? 0) + 1
  refCounters.set(prefix, n)

  return `${prefix}-${String(n).padStart(prefix.startsWith('TR') ? 2 : 3, '0')}`
}

// ---------- Transport ----------

interface ILeg {
  from: ISeedCity
  to: ISeedCity
  mode: 'flight' | 'train' | 'bus'
  departs: number
  durationMin: number
  stops: number
  operator: string
  name: string
  description: string
  price: number
}

const addLeg = (leg: ILeg) => {
  const arrives = leg.departs + Math.round(leg.durationMin)
  rows.push({
    ref: nextRef(`TR-${leg.from.code}-${leg.to.code}`),
    kind: 'transport',
    city: leg.from,
    name: leg.name,
    description: leg.description,
    priceAmount: money(leg.price),
    priceUnit: 'per_person',
    attributes: {
      mode: leg.mode,
      toCityId: leg.to.id,
      toCityName: leg.to.name,
      fromCountry: leg.from.countryCode,
      toCountry: leg.to.countryCode,
      international: leg.from.countryCode !== leg.to.countryCode,
      departs: clock(leg.departs),
      arrives: clock(arrives),
      arrivesNextDay: arrives >= 1440,
      stops: leg.stops,
      operator: leg.operator
    }
  })
}

// Departures spread over the service day, jittered so routes don't share a timetable
const spreadDepartures = (count: number, first: number, last: number) => Array.from({ length: count }, (_, i) => {
  const slot = count === 1 ? (first + last) / 2 : first + (last - first) * i / (count - 1)

  return round5(slot + between(-25, 25))
})

const LOW_COST = AIRLINES.filter(airline => ['FR', 'W6', 'U2'].includes(airline.code))
// By the two cities' sizes summed; two big cities are always connected
const ROUTE_CHANCE: Record<number, number> = { 6: 1, 5: 0.6, 4: 0.35, 3: 0.18, 2: 0.06 }

const airlineFor = (a: ISeedCity, b: ISeedCity) => {
  const home = AIRLINES.filter(airline => airline.home.includes(a.countryCode) || airline.home.includes(b.countryCode))

  return home.length > 0 && chance(0.55) ? pick(home) : pick(chance(0.6) ? LOW_COST : AIRLINES.filter(x => x.home.length > 0))
}

const addFlights = (a: ISeedCity, b: ISeedCity, km: number) => {
  for (const [from, to] of [[a, b], [b, a]] as const) {
    const count = a.size + b.size >= 5 ? int(1, 3) : int(1, 2)
    for (let i = 0; i < count; i++) {
      const airline = airlineFor(from, to)
      const lowCost = LOW_COST.includes(airline)
      const redEye = chance(0.12)
      const departs = redEye
        ? (chance(0.6) ? round5(between(22 * 60 + 30, 23 * 60 + 55)) : round5(between(5 * 60, 5 * 60 + 55)))
        : round5(between(6 * 60, 21 * 60 + 30))
      const hub = chance(0.22) ? HUB_CODES.find(code => code !== from.code && code !== to.code && chance(0.3)) : undefined
      const direct = km / 780 * 60 + 35
      const durationMin = hub ? direct * 1.15 + int(70, 180) : direct
      const number = `${airline.code}${int(100, 9899)}`
      const arrivesNextDay = departs + durationMin >= 1440

      addLeg({
        from,
        to,
        mode: 'flight',
        departs,
        durationMin,
        stops: hub ? 1 : 0,
        operator: airline.name,
        name: hub ? `${airline.name} ${number} via ${HUB_NAMES[hub]}` : `${airline.name} ${number} ${from.name} → ${to.name}`,
        description: [
          hub ? `One stop in ${HUB_NAMES[hub]}.` : 'Direct flight.',
          departs < 6 * 60 ? 'Pre-dawn departure.' : '',
          arrivesNextDay ? 'Lands after midnight.' : ''
        ].filter(Boolean).join(' '),
        price: (35 + km * 0.075) * (lowCost ? 0.6 : 1) * (hub ? 0.85 : 1) * (redEye ? 0.7 : 1) * between(0.8, 1.3)
      })
    }
  }
}

const railOperator = (from: ISeedCity, to: ISeedCity) => [from.code, to.code].includes('LON') && from.countryCode !== to.countryCode
  ? 'Eurostar'
  : COUNTRY_RAIL_OPERATOR[from.countryCode] ?? 'Regional rail'

const addTrains = (a: ISeedCity, b: ISeedCity, km: number) => {
  const highSpeed = km > 250 && ['ES', 'FR', 'IT', 'DE', 'GB', 'AT'].includes(a.countryCode)
  for (const [from, to] of [[a, b], [b, a]] as const) {
    const count = km < 300 ? int(3, 5) : km < 500 ? int(2, 4) : int(1, 2)
    const operator = railOperator(from, to)
    for (const departs of spreadDepartures(count, 6 * 60 + 15, 19 * 60 + 30)) {
      addLeg({
        from,
        to,
        mode: 'train',
        departs,
        durationMin: km / (highSpeed ? 165 : 105) * 60 + 15,
        stops: km < 150 ? 0 : int(1, 4),
        operator,
        name: `${operator} ${from.name} → ${to.name} (${clock(departs)})`,
        description: highSpeed ? 'High-speed train.' : 'Intercity train.',
        price: (9 + km * 0.11) * (highSpeed ? 1.25 : 1) * between(0.85, 1.2)
      })
    }
    if (km > 550 && chance(0.6)) {
      const departs = round5(between(20 * 60 + 30, 22 * 60 + 45))
      addLeg({
        from,
        to,
        mode: 'train',
        departs,
        durationMin: km / 75 * 60 + 60,
        stops: int(3, 8),
        operator,
        name: `${operator} night train ${from.name} → ${to.name}`,
        description: 'Overnight train with couchettes; arrives next morning.',
        price: (30 + km * 0.09) * between(0.9, 1.2)
      })
    }
  }
}

const addBuses = (a: ISeedCity, b: ISeedCity, km: number) => {
  for (const [from, to] of [[a, b], [b, a]] as const) {
    const operator = BUS_OPERATORS[from.countryCode] ?? BUS_OPERATORS.default!
    const departures = km > 450 && chance(0.5)
      ? [round5(between(21 * 60, 23 * 60)), ...spreadDepartures(int(0, 1), 8 * 60, 14 * 60)]
      : spreadDepartures(int(1, 3), 7 * 60, 18 * 60)
    for (const departs of departures) {
      const durationMin = km / 68 * 60 + 25
      addLeg({
        from,
        to,
        mode: 'bus',
        departs,
        durationMin,
        stops: int(1, 5),
        operator,
        name: `${operator} bus ${from.name} → ${to.name} (${clock(departs)})`,
        description: departs + durationMin >= 1440 ? 'Overnight coach.' : 'Coach with a few stops on the way.',
        price: (7 + km * 0.05) * between(0.8, 1.2)
      })
    }
  }
}

const addDayTripLinks = (town: ISeedCity, hub: ISeedCity) => {
  const km = distanceKm(town, hub)
  const modes = town.rail ? (['train', 'bus'] as const) : (['bus'] as const)
  for (const [from, to] of [[hub, town], [town, hub]] as const) {
    for (const mode of modes) {
      const operator = mode === 'train'
        ? `${COUNTRY_RAIL_OPERATOR[from.countryCode] ?? 'Regional rail'} regional`
        : BUS_OPERATORS[from.countryCode] ?? BUS_OPERATORS.default!
      for (const departs of spreadDepartures(mode === 'train' ? int(5, 7) : int(2, 4), 7 * 60, 20 * 60)) {
        addLeg({
          from,
          to,
          mode,
          departs,
          durationMin: Math.max(20, round5(km / (mode === 'train' ? 45 : 35) * 60 + 10)),
          stops: int(1, 6),
          operator,
          name: `${operator} ${mode} ${from.name} → ${to.name} (${clock(departs)})`,
          description: mode === 'train' ? 'Local train, no booking needed.' : 'Local bus.',
          price: between(2, 6)
        })
      }
    }
  }
}

// ---------- Stays and places ----------

const WORDS = ['Aurora', 'Linden', 'Harbour', 'Garden', 'Lantern', 'Meridian', 'Atlas', 'Corner', 'Courtyard', 'Riverside',
  'Tower', 'Bridge', 'Orchard', 'Willow', 'Amber', 'Cedar', 'Marble', 'Compass', 'Saffron', 'Juniper', 'Olive', 'Laurel',
  'Sparrow', 'Heron', 'Copper', 'Granite', 'Velvet', 'Ivory', 'Indigo', 'Cobalt', 'Clover', 'Fig', 'Lark', 'Mosaic', 'Ember',
  'Quill', 'Tide', 'Pebble', 'Thistle', 'Magnolia', 'Rowan', 'Starling', 'Sage', 'Hazel', 'Birch', 'Anchor', 'Lighthouse']

const STAY_TYPES = ['Hotel', 'Boutique Hotel', 'Guesthouse', 'Apartments', 'Hostel', 'Suites', 'B&B', 'Aparthotel', 'Residence', 'Inn']
const STAY_TAGS = ['quiet', 'walkable', 'central', 'family', 'pool', 'nightlife', 'budget', 'boutique', 'modern']
const STAY_NOTES: Record<string, string> = {
  quiet: 'Quiet rooms facing a courtyard.',
  walkable: 'Most sights are a walk away.',
  central: 'Right in the centre.',
  family: 'Family rooms and a play corner.',
  pool: 'Outdoor pool open in summer.',
  nightlife: 'Bars on the doorstep.',
  budget: 'Shared kitchen and lockers.',
  boutique: 'Individually designed rooms.',
  modern: 'Modern rooms with large windows.'
}

const FOOD_TYPES = ['Café', 'Bakery', 'Vegan Kitchen', 'Ramen Bar', 'Falafel House', 'Pizza Bar', 'Burger Joint', 'Seafood House',
  'Grill', 'Wine Bar', 'Food Hall', 'Noodle Bar', 'Deli', 'Brunch Spot', 'Ice Cream Parlour', 'Steakhouse', 'Dumpling Bar',
  'Bistro', 'Kitchen', 'Canteen']
const CAFE_TYPES = /Café|Cafe|Bakery|Brunch|Pastelaria|Konditorei|Kaffeehaus|Tea Room|Fika|Cukiernia|Cukrászda|Kavárna|Coffee|Kahvila|Kohvik|Kafejnīca|Kavinė|Covrigărie|Banitsa|Pekara|Pastizzeria|Börek|Boulangerie|Churrería|Gelateria|Ice Cream/
const SEAFOOD_TYPES = /Seafood|Marisqueira|Fish/
const MARKET_TYPES = /Food Hall|Fish Market/
const BAR_TYPES = /Wine Bar|Pub|Beisl|Biergarten|Meyhane|Kafana|Krčma|Hospoda|Estaminet|Eetcafé|Tapas Bar/
const MEATY_TYPES = /Steakhouse|Grill|Kebab|Burger|Souvlaki|Seafood|Marisqueira|Fish|Wirtshaus|Mehana|Kafana/

const CUISINES: Record<string, string> = {
  PT: 'Portuguese',
  ES: 'Spanish',
  IT: 'Italian',
  FR: 'French',
  DE: 'German',
  AT: 'Austrian',
  CH: 'Swiss',
  PL: 'Polish',
  CZ: 'Czech',
  HU: 'Hungarian',
  GB: 'British',
  IE: 'Irish',
  NL: 'Dutch',
  BE: 'Belgian',
  DK: 'Danish',
  SE: 'Swedish',
  NO: 'Norwegian',
  FI: 'Finnish',
  GR: 'Greek',
  TR: 'Turkish',
  HR: 'Croatian',
  UA: 'Ukrainian',
  EE: 'Estonian',
  LV: 'Latvian',
  LT: 'Lithuanian',
  RO: 'Romanian',
  BG: 'Bulgarian',
  RS: 'Serbian',
  MT: 'Maltese',
  SK: 'Slovak',
  SI: 'Slovenian'
}
const MUSEUM_TOPICS = ['Modern Art', 'City History', 'Photography', 'Design', 'Science', 'Natural History', 'Decorative Arts',
  'Archaeology', 'Maritime History', 'Contemporary Art', 'Folk Art', 'Music', 'Childhood', 'Architecture', 'Fashion', 'Cinema',
  'Literature', 'Transport', 'Applied Arts', 'Ceramics', 'Illusions', 'Technology', 'Medieval Life', 'Coffee']
const KID_TOPICS = ['Science', 'Natural History', 'Childhood', 'Illusions', 'Technology', 'Transport']
const SAINTS = ['Peter', 'Mary', 'Nicholas', 'Anne', 'James', 'John', 'Catherine', 'George', 'Stephen', 'Michael', 'Francis', 'Barbara']

// Picks a name not used in this city yet; the fallback keeps the catalogue unique without endless retries
const uniqueName = (used: Set<string>, make: () => string) => {
  for (let attempt = 0; attempt < 30; attempt++) {
    const name = make()
    if (!used.has(name)) {
      used.add(name)

      return name
    }
  }
  let n = 2
  const base = make()
  while (used.has(`${base} ${n}`)) n++
  used.add(`${base} ${n}`)

  return `${base} ${n}`
}

const hours = (opensAt: number | null, closesAt: number | null) => ({
  opensAt: opensAt === null ? null : clock(opensAt),
  closesAt: closesAt === null ? null : clock(closesAt)
})

const addStay = (city: ISeedCity, used: Set<string>) => {
  const type = pick(STAY_TYPES)
  const area = pick(city.districts)
  const prefix = STAY_PREFIX[city.countryCode]
  const name = uniqueName(used, () => pick([
    () => `${pick(WORDS)} ${type}`,
    () => `${area} ${type}`,
    () => prefix ? `${prefix} ${pick(WORDS)}` : `The ${pick(WORDS)} ${type}`,
    () => `${type} ${pick(WORDS)} ${area}`
  ])())
  const tags = type === 'Hostel'
    ? ['budget', ...pickSome(['nightlife', 'central', 'walkable'], int(1, 2))]
    : pickSome(STAY_TAGS.filter(tag => tag !== 'budget' || type !== 'Boutique Hotel'), int(2, 3))
  const base = { Hostel: 28, Guesthouse: 75, Apartments: 95, 'B&B': 80, Inn: 85, Residence: 105, Aparthotel: 110, Hotel: 125, Suites: 160, 'Boutique Hotel': 185 }[type] ?? 100

  rows.push({
    ref: nextRef(`ST-${city.code}`),
    kind: 'stay',
    city,
    name,
    description: `${type} in ${area}. ${tags.map(tag => STAY_NOTES[tag]).join(' ')}`,
    priceAmount: money(base * city.cost * between(0.75, 1.35)),
    priceUnit: 'per_night',
    attributes: {
      area,
      tags,
      checkIn: pick(['14:00', '15:00', '15:00', '16:00']),
      checkOut: pick(['10:00', '11:00', '11:00', '12:00'])
    }
  })
}

const addFood = (city: ISeedCity, used: Set<string>) => {
  const local = LOCAL_FOOD[city.countryCode] ?? []
  const type = pick([...FOOD_TYPES, ...local, ...local, ...local])
  const area = pick(city.districts)
  const firstName = pick(LOCAL_FIRST_NAMES[city.countryCode] ?? ['Ana'])
  const name = uniqueName(used, () => pick([
    () => `${pick(WORDS)} ${type}`,
    () => local.includes(type) ? `${type} ${firstName}` : `${firstName}'s ${type}`,
    () => `${type} ${area}`,
    () => `${pick(WORDS)} & ${pick(WORDS)}`
  ])())

  const isCafe = CAFE_TYPES.test(type)
  const isMarket = MARKET_TYPES.test(type)
  const isBar = BAR_TYPES.test(type)
  const vegan = type === 'Vegan Kitchen' || (chance(0.12) && !MEATY_TYPES.test(type))
  const vegetarian = vegan || chance(isCafe ? 0.85 : MEATY_TYPES.test(type) ? 0.25 : 0.55)
  const halal = /Falafel|Kebab/.test(type) ? chance(0.8) : city.countryCode === 'TR' ? chance(0.7) : chance(0.04)
  const dietaryTags = [
    ...(vegetarian ? ['vegetarian'] : []),
    ...(vegan ? ['vegan'] : []),
    ...(chance(0.12) ? ['gluten_free'] : []),
    ...(halal ? ['halal'] : [])
  ]
  const tags = [
    isCafe ? 'cafe' : isMarket ? 'market' : isBar ? 'bar' : 'restaurant',
    ...(SEAFOOD_TYPES.test(type) ? ['seafood'] : []),
    ...(chance(0.15) ? ['outdoor'] : []),
    ...(chance(0.12) ? ['kid_friendly'] : [])
  ]
  const [opensAt, closesAt, minutes, price] = isCafe
    ? [pick([7, 7.5, 8, 9]) * 60, pick([18, 19, 20]) * 60, int(25, 45), between(4, 12)]
    : isMarket
      ? [10 * 60, pick([22, 23]) * 60, int(45, 75), between(10, 22)]
      : isBar
        ? [pick([16, 17, 18]) * 60, pick([24, 25, 26]) * 60, int(60, 90), between(12, 30)]
        : chance(0.15)
          ? [18 * 60, pick([23, 23.5]) * 60, int(75, 120), between(30, 60)]
          : [pick([11.5, 12, 12]) * 60, pick([22, 22.5, 23]) * 60, int(60, 105), between(12, 40)]

  rows.push({
    ref: nextRef(`PL-${city.code}`),
    kind: 'place',
    city,
    name,
    description: [
      `${type} in ${area}.`,
      vegan ? 'Fully plant-based.' : vegetarian ? 'Vegetarian dishes on the menu.' : '',
      halal ? 'Halal.' : ''
    ].filter(Boolean).join(' '),
    // A few places don't publish prices: the plan shows "Price not in catalogue"
    priceAmount: chance(0.05) ? null : money(price * city.cost),
    priceUnit: 'per_person',
    attributes: {
      category: 'food',
      ...hours(round5(opensAt), round5(closesAt)),
      durationMin: minutes,
      dietaryTags,
      tags
    }
  })
}

const SIGHT_MAKERS: ((city: ISeedCity) => { name: string; tags: string[]; open: [number, number] | null; price: number | null; unit: 'per_adult' | 'free'; minutes: number; text: string })[] = [
  (city) => {
    const topic = pick(MUSEUM_TOPICS)

    return { name: `Museum of ${topic}`, tags: ['museum', ...(KID_TOPICS.includes(topic) ? ['kid_friendly'] : [])], open: [10 * 60, 18 * 60], price: between(6, 20) * city.cost, unit: 'per_adult', minutes: int(60, 120), text: `Collections on ${topic.toLowerCase()}.` }
  },
  city => ({ name: `${pick(city.districts)} Cathedral`, tags: ['monument'], open: [9 * 60, 18 * 60], price: chance(0.5) ? 0 : between(3, 8), unit: 'per_adult', minutes: int(30, 60), text: 'Gothic cathedral with a climbable tower.' }),
  () => ({ name: `Church of St. ${pick(SAINTS)}`, tags: ['monument'], open: [9 * 60, 17 * 60], price: 0, unit: 'free', minutes: int(20, 40), text: 'Baroque interior and frescoes.' }),
  city => ({ name: `${pick(['Royal', 'Summer', 'Archbishop\'s', 'Governor\'s', 'Winter', 'Old'])} Palace`, tags: ['monument', 'museum'], open: [9.5 * 60, 17.5 * 60], price: between(10, 24) * city.cost, unit: 'per_adult', minutes: int(75, 150), text: 'State rooms and gardens; timed entry.' }),
  city => ({ name: `${pick(city.districts)} Viewpoint`, tags: ['viewpoint', 'outdoor'], open: null, price: 0, unit: 'free', minutes: int(20, 40), text: 'Panorama over the rooftops; best at sunset.' }),
  () => ({ name: `${pick(WORDS)} Gardens`, tags: ['outdoor', 'kid_friendly'], open: [8 * 60, 20 * 60], price: chance(0.6) ? 0 : between(3, 9), unit: 'per_adult', minutes: int(45, 90), text: 'Landscaped park with a pond and shaded paths.' }),
  city => ({ name: `${pick(WORDS)} Gallery`, tags: ['museum'], open: [11 * 60, 19 * 60], price: chance(0.4) ? 0 : between(5, 12) * city.cost, unit: 'per_adult', minutes: int(45, 75), text: 'Rotating exhibitions of local artists.' }),
  city => ({ name: `${pick(['City Walls', 'Fortress', 'Castle', 'Citadel'])} of ${city.name}`, tags: ['monument', 'viewpoint'], open: [9 * 60, 19 * 60], price: between(6, 15) * city.cost, unit: 'per_adult', minutes: int(60, 120), text: 'Walk the ramparts for views over the old town.' }),
  city => ({ name: `${pick(city.districts)} Old Town Hall`, tags: ['monument'], open: [10 * 60, 17 * 60], price: between(4, 9), unit: 'per_adult', minutes: int(30, 60), text: 'Council chambers and a clock tower.' }),
  () => ({ name: 'Botanical Garden', tags: ['outdoor', 'kid_friendly'], open: [9 * 60, 18 * 60], price: between(3, 8), unit: 'per_adult', minutes: int(60, 120), text: 'Glasshouses and a palm house.' })
]

const addSight = (city: ISeedCity, used: Set<string>) => {
  let sight = pick(SIGHT_MAKERS)(city)
  for (let attempt = 0; used.has(sight.name) && attempt < 30; attempt++) sight = pick(SIGHT_MAKERS)(city)
  const name = uniqueName(used, () => sight.name)
  const free = sight.price === null || sight.price === 0

  rows.push({
    ref: nextRef(`PL-${city.code}`),
    kind: 'place',
    city,
    name,
    description: sight.text,
    priceAmount: free ? 0 : money(sight.price!),
    priceUnit: free ? 'free' : sight.unit,
    attributes: {
      category: 'sight',
      ...hours(sight.open?.[0] ?? null, sight.open?.[1] ?? null),
      durationMin: sight.minutes,
      dietaryTags: [],
      tags: sight.tags
    }
  })
}

interface IActivity {
  name: string
  tags: string[]
  open: [number, number]
  price: number | null
  minutes: number
  text: string
}

const ACTIVITY_MAKERS: ((city: ISeedCity) => IActivity)[] = [
  city => ({ name: `${pick(city.districts)} walking tour`, tags: ['walking', 'outdoor'], open: [10 * 60, 17 * 60], price: chance(0.35) ? null : between(10, 25), minutes: int(120, 180), text: 'Guided walk with a local; pay what you like on some dates.' }),
  city => ({ name: `Bike tour: ${pick(city.districts)}`, tags: ['outdoor'], open: [9 * 60, 18 * 60], price: between(25, 40) * city.cost, minutes: int(150, 180), text: 'Bikes and helmets included.' }),
  city => ({ name: `Food tour: ${pick(city.districts)}`, tags: ['walking'], open: [11 * 60, 20 * 60], price: between(45, 85) * city.cost, minutes: 180, text: 'Six tastings at small family places.' }),
  city => ({ name: `Cooking class: ${CUISINES[city.countryCode] ?? 'local'} classics`, tags: ['kid_friendly'], open: [10 * 60, 20 * 60], price: between(50, 90) * city.cost, minutes: int(150, 180), text: 'Cook three dishes and eat them together.' }),
  city => ({ name: `${pick(WORDS)} Spa`, tags: [], open: [9 * 60, 22 * 60], price: between(25, 60) * city.cost, minutes: 120, text: 'Thermal pools and saunas.' }),
  () => ({ name: `Escape room: ${pick(WORDS)} ${pick(['Mystery', 'Heist', 'Laboratory', 'Vault', 'Expedition'])}`, tags: ['kid_friendly'], open: [10 * 60, 23 * 60], price: between(20, 35), minutes: 60, text: 'Puzzle room for two to six players.' }),
  () => ({ name: `${pick(WORDS)} Climbing Wall`, tags: ['kid_friendly'], open: [10 * 60, 22 * 60], price: between(15, 25), minutes: 120, text: 'Bouldering hall with a kids\' area.' }),
  city => ({ name: `${pick([city.name, pick(WORDS)])} Aquarium`, tags: ['kid_friendly'], open: [10 * 60, 19 * 60], price: between(15, 28) * city.cost, minutes: 120, text: 'Tanks from local rivers to the open sea.' }),
  city => ({ name: `Boat trip from ${pick(city.districts)}`, tags: ['outdoor', 'viewpoint'], open: [10 * 60, 18 * 60], price: between(15, 35) * city.cost, minutes: int(60, 90), text: 'Sightseeing cruise along the waterfront.' }),
  city => ({ name: `Jazz night at ${pick(WORDS)} Club`, tags: [], open: [19 * 60, 24.5 * 60], price: between(15, 30) * city.cost, minutes: 120, text: 'Live sets every evening.' }),
  city => ({ name: `Street art tour: ${pick(city.districts)}`, tags: ['walking', 'outdoor'], open: [10 * 60, 18 * 60], price: between(12, 22), minutes: 120, text: 'Murals and the stories behind them.' }),
  city => ({ name: `Wine tasting at ${pick(WORDS)} Cellar`, tags: [], open: [12 * 60, 21 * 60], price: between(25, 60) * city.cost, minutes: 90, text: 'Five regional wines with cheese.' }),
  () => ({ name: `Pottery workshop: ${pick(WORDS)} Studio`, tags: ['kid_friendly'], open: [10 * 60, 18 * 60], price: between(35, 60), minutes: 150, text: 'Throw a bowl on the wheel; posted to you later.' })
]

const addActivity = (city: ISeedCity, used: Set<string>) => {
  let activity = pick(ACTIVITY_MAKERS)(city)
  for (let attempt = 0; used.has(activity.name) && attempt < 30; attempt++) activity = pick(ACTIVITY_MAKERS)(city)
  const name = uniqueName(used, () => activity.name)

  rows.push({
    ref: nextRef(`PL-${city.code}`),
    kind: 'place',
    city,
    name,
    description: activity.text,
    priceAmount: activity.price === null ? null : money(activity.price),
    priceUnit: activity.price === null ? null : 'per_person',
    attributes: {
      category: 'activity',
      ...hours(activity.open[0], activity.open[1]),
      durationMin: activity.minutes,
      dietaryTags: [],
      tags: activity.tags
    }
  })
}

const weight = (city: ISeedCity) => city.dayTripFrom ? 0.6 : { 1: 1.3, 2: 2, 3: 3 }[city.size]

/**
 * The fixture catalogue: exactly TOTAL entries across CITIES, identical on every call (fixed PRNG seed, stable refs),
 * so seeding twice upserts the same rows. Synchronous on purpose: it resets and fills module state in one go.
 */
export const buildCatalogue = (): ICatalogueSeedEntry[] => {
  state = SEED
  rows.length = 0
  refCounters.clear()

  const hubs = CITIES.filter(city => !city.dayTripFrom)
  for (const [i, a] of hubs.entries()) {
    for (const b of hubs.slice(i + 1)) {
      const km = distanceKm(a, b)
      const sameCountry = a.countryCode === b.countryCode
      if (a.airport && b.airport && km >= 350 && chance(sameCountry ? 0.8 : ROUTE_CHANCE[a.size + b.size] ?? 0)) {
        addFlights(a, b, km)
      }
      const railLinked = (a.rail !== null && a.rail === b.rail) ||
        RAIL_LINKS.some(([x, y]) => (x === a.code && y === b.code) || (x === b.code && y === a.code))
      const hasTrain = railLinked && km < 800
      if (hasTrain) addTrains(a, b, km)
      if (a.land !== null && a.land === b.land && km >= 120 && km < 750 && chance(hasTrain ? 0.45 : 0.9)) addBuses(a, b, km)
    }
  }
  for (const town of CITIES.filter(city => city.dayTripFrom)) {
    addDayTripLinks(town, CITIES.find(city => city.id === town.dayTripFrom)!)
  }

  const remaining = TOTAL - rows.length
  const totalWeight = CITIES.reduce((sum, city) => sum + weight(city), 0)
  const shares = CITIES.map(city => Math.floor(remaining * weight(city) / totalWeight))
  // Rounding leftovers go to the biggest cities first, so the total is exact
  const order = CITIES.map((city, i) => ({ i, w: weight(city) })).sort((a, b) => b.w - a.w)
  for (let left = remaining - shares.reduce((a, b) => a + b, 0), k = 0; left > 0; left--, k++) {
    shares[order[k % order.length]!.i]! += 1
  }

  for (const [i, city] of CITIES.entries()) {
    const count = shares[i]!
    const used = new Set<string>()
    const stays = Math.round(count * (city.dayTripFrom ? 0.15 : 0.18))
    const food = Math.round(count * 0.38)
    const sights = Math.round(count * 0.24)
    const activities = count - stays - food - sights
    for (let n = 0; n < stays; n++) addStay(city, used)
    for (let n = 0; n < food; n++) addFood(city, used)
    for (let n = 0; n < sights; n++) addSight(city, used)
    for (let n = 0; n < activities; n++) addActivity(city, used)
  }

  if (rows.length !== TOTAL) throw new Error(`expected ${TOTAL} rows, got ${rows.length}`)

  return rows.map(({ city, ...row }) => ({
    ...row,
    cityId: city.id,
    cityName: city.name,
    priceCurrency: row.priceAmount === null ? null : 'EUR'
  }))
}
