import { EPlaceCategory } from '~~/shared/schemas/catalogue/PlaceCategory'
import { ETransportMode } from '~~/shared/schemas/catalogue/TransportMode'
import { EPreferenceDomain } from '~~/shared/schemas/knowledge-graph/PreferenceDomain'
import { ERuleOperator } from '~~/shared/schemas/knowledge-graph/RuleOperator'
import type { TRule } from '~~/shared/schemas/knowledge-graph/RuleSchema'
import { EItemKind } from '~~/shared/schemas/trips/ItemKind'

export type TRuleFieldType = 'enum' | 'time' | 'boolean' | 'int' | 'number' | 'string' | 'string[]'

export interface IRuleField {
  type: TRuleFieldType
  values?: readonly string[]
  // How a value reads in a rule check's error, e.g. "departs 14:35"
  label: string
  description: string
}

// The only vocabulary a compiled rule may use: the save-time model sees it, validation checks against it,
// and the evaluator reads exactly these fields off a catalogue entry
export const RULE_FIELDS: Record<EItemKind, Record<string, IRuleField>> = {
  [EItemKind.TRANSPORT]: {
    mode: { type: 'enum', values: Object.values(ETransportMode), label: 'mode', description: 'flight, train or bus' },
    fromCountry: { type: 'string', label: 'from', description: 'departure country, ISO 3166-1 alpha-2 code, e.g. PL' },
    toCountry: { type: 'string', label: 'to', description: 'arrival country, ISO 3166-1 alpha-2 code, e.g. DE' },
    international: { type: 'boolean', label: 'international', description: 'departure and arrival are in different countries' },
    departs: { type: 'time', label: 'departs', description: 'local departure time, HH:mm' },
    arrives: { type: 'time', label: 'arrives', description: 'local arrival time, HH:mm, on the arrival day (see arrivesNextDay)' },
    arrivesNextDay: { type: 'boolean', label: 'arrives next day', description: 'arrival is after midnight of the departure day' },
    stops: { type: 'int', label: 'stops', description: 'number of stops; 0 = direct' },
    priceAmount: { type: 'number', label: 'price', description: 'price per person in EUR' }
  },
  [EItemKind.STAY]: {
    area: { type: 'string', label: 'area', description: 'neighbourhood name' },
    tags: { type: 'string[]', label: 'tags', description: 'e.g. quiet, walkable, central, family, pool, nightlife, budget' },
    priceAmount: { type: 'number', label: 'price', description: 'price per night in EUR' }
  },
  [EItemKind.PLACE]: {
    category: { type: 'enum', values: Object.values(EPlaceCategory), label: 'category', description: 'sight, food or activity' },
    dietaryTags: { type: 'string[]', label: 'dietary', description: 'food places: vegetarian, vegan, gluten_free, halal' },
    tags: { type: 'string[]', label: 'tags', description: 'e.g. outdoor, museum, kid_friendly, viewpoint, seafood, cafe' },
    opensAt: { type: 'time', label: 'opens', description: 'opening time, HH:mm' },
    closesAt: { type: 'time', label: 'closes', description: 'closing time, HH:mm' },
    priceAmount: { type: 'number', label: 'price', description: 'price per person in EUR' }
  }
}

const EQUALITY = [ERuleOperator.EQ, ERuleOperator.NEQ]
const MEMBERSHIP = [ERuleOperator.IN, ERuleOperator.NIN]
const ORDERING = [ERuleOperator.LT, ERuleOperator.LTE, ERuleOperator.GT, ERuleOperator.GTE, ERuleOperator.BETWEEN]

export const RULE_OPERATORS_BY_TYPE: Record<TRuleFieldType, readonly ERuleOperator[]> = {
  enum: [...EQUALITY, ...MEMBERSHIP],
  string: [...EQUALITY, ...MEMBERSHIP],
  boolean: EQUALITY,
  time: [...EQUALITY, ...ORDERING],
  int: [...EQUALITY, ...ORDERING, ...MEMBERSHIP],
  number: [...EQUALITY, ...ORDERING],
  'string[]': [ERuleOperator.CONTAINS]
}

// The domain fixes which entries a rule can touch — the model never chooses it
export const DOMAIN_SCOPE: Record<EPreferenceDomain, TRule['scope']> = {
  [EPreferenceDomain.STAY]: { kind: EItemKind.STAY },
  [EPreferenceDomain.TRANSPORT]: { kind: EItemKind.TRANSPORT },
  [EPreferenceDomain.FOOD]: { kind: EItemKind.PLACE, where: { field: 'category', op: ERuleOperator.EQ, value: EPlaceCategory.FOOD } }
}
