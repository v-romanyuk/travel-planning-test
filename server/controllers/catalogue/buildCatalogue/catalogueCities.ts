// Catalogue cities. `id` and the place fields are GeoNames data as the Open-Meteo geocoding API returns them (the
// city picker's source), so a trip's origin/destination id matches catalogue rows. Reykjavik is left out on purpose:
// a request there fails with "no options in the catalogue".

export interface ISeedCity {
  id: number
  name: string
  countryCode: string
  latitude: number
  longitude: number
  // Short code used in catalogue refs
  code: string
  districts: string[]
  // Price level against an average EU city (1)
  cost: number
  // Bigger cities get more stays, places and flights
  size: 1 | 2 | 3
  // Trains run between cities of one group (plus RAIL_LINKS); null = no rail links in the catalogue
  rail: string | null
  // Buses run between cities of one landmass
  land: string | null
  airport: boolean
  // A town visited on a day trip from this city id: frequent local trains/buses, no flights, few stays
  dayTripFrom?: number
}

export const CITIES: ISeedCity[] = [
  { id: 756135, name: 'Warsaw', countryCode: 'PL', latitude: 52.22977, longitude: 21.01178, code: 'WAW', districts: ['Śródmieście', 'Old Town', 'Praga', 'Mokotów', 'Powiśle'], cost: 0.75, size: 3, rail: 'core', land: 'eu', airport: true },
  { id: 3094802, name: 'Krakow', countryCode: 'PL', latitude: 50.06143, longitude: 19.93658, code: 'KRK', districts: ['Old Town', 'Kazimierz', 'Podgórze', 'Kleparz'], cost: 0.7, size: 2, rail: 'core', land: 'eu', airport: true },
  { id: 3099434, name: 'Gdansk', countryCode: 'PL', latitude: 54.35227, longitude: 18.64912, code: 'GDN', districts: ['Main Town', 'Oliwa', 'Wrzeszcz', 'Old Town'], cost: 0.7, size: 1, rail: 'core', land: 'eu', airport: true },
  { id: 3081368, name: 'Wroclaw', countryCode: 'PL', latitude: 51.1, longitude: 17.03333, code: 'WRO', districts: ['Old Town', 'Ostrów Tumski', 'Nadodrze', 'Krzyki'], cost: 0.65, size: 1, rail: 'core', land: 'eu', airport: true },
  { id: 2267057, name: 'Lisbon', countryCode: 'PT', latitude: 38.71667, longitude: -9.13333, code: 'LIS', districts: ['Baixa', 'Alfama', 'Chiado', 'Príncipe Real', 'Belém', 'Graça'], cost: 0.95, size: 3, rail: 'pt', land: 'eu', airport: true },
  { id: 2735943, name: 'Porto', countryCode: 'PT', latitude: 41.14961, longitude: -8.61099, code: 'OPO', districts: ['Ribeira', 'Baixa', 'Cedofeita', 'Boavista', 'Foz do Douro'], cost: 0.85, size: 2, rail: 'pt', land: 'eu', airport: true },
  { id: 3117735, name: 'Madrid', countryCode: 'ES', latitude: 40.4165, longitude: -3.70256, code: 'MAD', districts: ['Sol', 'Malasaña', 'La Latina', 'Salamanca', 'Chamberí', 'Lavapiés'], cost: 1, size: 3, rail: 'es', land: 'eu', airport: true },
  { id: 3128760, name: 'Barcelona', countryCode: 'ES', latitude: 41.38879, longitude: 2.15899, code: 'BCN', districts: ['Gothic Quarter', 'El Born', 'Gràcia', 'Eixample', 'Barceloneta', 'Poble-sec'], cost: 1.05, size: 3, rail: 'es', land: 'eu', airport: true },
  { id: 2510911, name: 'Seville', countryCode: 'ES', latitude: 37.38283, longitude: -5.97317, code: 'SVQ', districts: ['Santa Cruz', 'Triana', 'Alameda', 'El Arenal'], cost: 0.85, size: 2, rail: 'es', land: 'eu', airport: true },
  { id: 2509954, name: 'Valencia', countryCode: 'ES', latitude: 39.46975, longitude: -0.37739, code: 'VLC', districts: ['Ciutat Vella', 'Ruzafa', 'El Carmen', 'Cabanyal'], cost: 0.85, size: 2, rail: 'es', land: 'eu', airport: true },
  { id: 2988507, name: 'Paris', countryCode: 'FR', latitude: 48.85341, longitude: 2.3488, code: 'PAR', districts: ['Le Marais', 'Saint-Germain', 'Montmartre', 'Latin Quarter', 'Canal Saint-Martin', 'Bastille'], cost: 1.4, size: 3, rail: 'core', land: 'eu', airport: true },
  { id: 2990440, name: 'Nice', countryCode: 'FR', latitude: 43.70313, longitude: 7.26608, code: 'NCE', districts: ['Vieux Nice', 'Port', 'Cimiez', 'Carré d\'Or'], cost: 1.2, size: 1, rail: 'core', land: 'eu', airport: true },
  { id: 2996944, name: 'Lyon', countryCode: 'FR', latitude: 45.74846, longitude: 4.84671, code: 'LYS', districts: ['Vieux Lyon', 'Presqu\'île', 'Croix-Rousse', 'Confluence'], cost: 1, size: 2, rail: 'core', land: 'eu', airport: true },
  { id: 2643743, name: 'London', countryCode: 'GB', latitude: 51.50853, longitude: -0.12574, code: 'LON', districts: ['Soho', 'Shoreditch', 'South Bank', 'Kensington', 'Camden', 'Notting Hill'], cost: 1.5, size: 3, rail: 'uk', land: 'gb', airport: true },
  { id: 2650225, name: 'Edinburgh', countryCode: 'GB', latitude: 55.95206, longitude: -3.19648, code: 'EDI', districts: ['Old Town', 'New Town', 'Leith', 'Stockbridge'], cost: 1.2, size: 2, rail: 'uk', land: 'gb', airport: true },
  { id: 2964574, name: 'Dublin', countryCode: 'IE', latitude: 53.33306, longitude: -6.24889, code: 'DUB', districts: ['Temple Bar', 'Portobello', 'Smithfield', 'Ballsbridge'], cost: 1.35, size: 2, rail: null, land: null, airport: true },
  { id: 2759794, name: 'Amsterdam', countryCode: 'NL', latitude: 52.37403, longitude: 4.88969, code: 'AMS', districts: ['Jordaan', 'De Pijp', 'Canal Ring', 'Oost', 'Noord'], cost: 1.35, size: 3, rail: 'core', land: 'eu', airport: true },
  { id: 2800866, name: 'Brussels', countryCode: 'BE', latitude: 50.85045, longitude: 4.34878, code: 'BRU', districts: ['Grand Place', 'Sablon', 'Ixelles', 'Saint-Gilles'], cost: 1.1, size: 2, rail: 'core', land: 'eu', airport: true },
  { id: 2950159, name: 'Berlin', countryCode: 'DE', latitude: 52.52437, longitude: 13.41053, code: 'BER', districts: ['Mitte', 'Kreuzberg', 'Prenzlauer Berg', 'Friedrichshain', 'Charlottenburg', 'Neukölln'], cost: 1.05, size: 3, rail: 'core', land: 'eu', airport: true },
  { id: 2867714, name: 'Munich', countryCode: 'DE', latitude: 48.13743, longitude: 11.57549, code: 'MUC', districts: ['Altstadt', 'Schwabing', 'Maxvorstadt', 'Glockenbachviertel', 'Haidhausen'], cost: 1.25, size: 3, rail: 'core', land: 'eu', airport: true },
  { id: 2911298, name: 'Hamburg', countryCode: 'DE', latitude: 53.57532, longitude: 10.01534, code: 'HAM', districts: ['St. Pauli', 'Altona', 'Speicherstadt', 'Eimsbüttel', 'HafenCity'], cost: 1.15, size: 3, rail: 'core', land: 'eu', airport: true },
  { id: 2761369, name: 'Vienna', countryCode: 'AT', latitude: 48.20849, longitude: 16.37208, code: 'VIE', districts: ['Innere Stadt', 'Leopoldstadt', 'Neubau', 'Wieden', 'Josefstadt'], cost: 1.15, size: 3, rail: 'core', land: 'eu', airport: true },
  { id: 3067696, name: 'Prague', countryCode: 'CZ', latitude: 50.08804, longitude: 14.42076, code: 'PRG', districts: ['Old Town', 'Malá Strana', 'Vinohrady', 'Žižkov', 'Holešovice'], cost: 0.8, size: 3, rail: 'core', land: 'eu', airport: true },
  { id: 3054643, name: 'Budapest', countryCode: 'HU', latitude: 47.49835, longitude: 19.04045, code: 'BUD', districts: ['Castle District', 'Jewish Quarter', 'Belváros', 'Újlipótváros', 'Óbuda'], cost: 0.7, size: 3, rail: 'core', land: 'eu', airport: true },
  { id: 3060972, name: 'Bratislava', countryCode: 'SK', latitude: 48.14816, longitude: 17.10674, code: 'BTS', districts: ['Old Town', 'Petržalka', 'Nové Mesto', 'Ružinov'], cost: 0.75, size: 1, rail: 'core', land: 'eu', airport: true },
  { id: 3196359, name: 'Ljubljana', countryCode: 'SI', latitude: 46.05108, longitude: 14.50513, code: 'LJU', districts: ['Old Town', 'Center', 'Trnovo', 'Šiška'], cost: 0.85, size: 1, rail: 'core', land: 'eu', airport: true },
  { id: 2657896, name: 'Zurich', countryCode: 'CH', latitude: 47.36667, longitude: 8.55, code: 'ZRH', districts: ['Altstadt', 'Niederdorf', 'Seefeld', 'Zurich West', 'Enge'], cost: 1.8, size: 2, rail: 'core', land: 'eu', airport: true },
  { id: 3169070, name: 'Rome', countryCode: 'IT', latitude: 41.89193, longitude: 12.51133, code: 'ROM', districts: ['Trastevere', 'Monti', 'Centro Storico', 'Testaccio', 'Prati', 'Esquilino'], cost: 1.1, size: 3, rail: 'core', land: 'eu', airport: true },
  { id: 3173435, name: 'Milan', countryCode: 'IT', latitude: 45.46427, longitude: 9.18951, code: 'MIL', districts: ['Brera', 'Navigli', 'Porta Romana', 'Isola', 'Centro'], cost: 1.2, size: 3, rail: 'core', land: 'eu', airport: true },
  { id: 3176959, name: 'Florence', countryCode: 'IT', latitude: 43.77925, longitude: 11.24626, code: 'FLR', districts: ['Duomo', 'Oltrarno', 'Santa Croce', 'San Lorenzo', 'San Niccolò'], cost: 1.15, size: 2, rail: 'core', land: 'eu', airport: true },
  { id: 3164603, name: 'Venice', countryCode: 'IT', latitude: 45.43713, longitude: 12.33265, code: 'VCE', districts: ['San Marco', 'Cannaregio', 'Dorsoduro', 'Castello', 'San Polo'], cost: 1.4, size: 2, rail: 'core', land: 'eu', airport: true },
  { id: 3172394, name: 'Naples', countryCode: 'IT', latitude: 40.85216, longitude: 14.26811, code: 'NAP', districts: ['Centro Storico', 'Chiaia', 'Vomero', 'Quartieri Spagnoli', 'Posillipo'], cost: 0.8, size: 2, rail: 'core', land: 'eu', airport: true },
  { id: 2618425, name: 'Copenhagen', countryCode: 'DK', latitude: 55.67594, longitude: 12.56553, code: 'CPH', districts: ['Indre By', 'Nørrebro', 'Vesterbro', 'Christianshavn', 'Østerbro'], cost: 1.5, size: 3, rail: 'core', land: 'eu', airport: true },
  { id: 2673730, name: 'Stockholm', countryCode: 'SE', latitude: 59.33258, longitude: 18.0649, code: 'STO', districts: ['Gamla Stan', 'Södermalm', 'Östermalm', 'Norrmalm', 'Kungsholmen'], cost: 1.35, size: 3, rail: 'core', land: 'eu', airport: true },
  { id: 3143244, name: 'Oslo', countryCode: 'NO', latitude: 59.91273, longitude: 10.74609, code: 'OSL', districts: ['Sentrum', 'Grünerløkka', 'Frogner', 'Aker Brygge', 'Gamle Oslo'], cost: 1.6, size: 2, rail: 'core', land: 'eu', airport: true },
  { id: 658225, name: 'Helsinki', countryCode: 'FI', latitude: 60.16952, longitude: 24.93545, code: 'HEL', districts: ['Kruununhaka', 'Kallio', 'Punavuori', 'Kamppi', 'Töölö'], cost: 1.25, size: 2, rail: null, land: null, airport: true },
  { id: 588409, name: 'Tallinn', countryCode: 'EE', latitude: 59.43696, longitude: 24.75353, code: 'TLL', districts: ['Old Town', 'Kalamaja', 'Kadriorg', 'Rotermann'], cost: 0.8, size: 1, rail: null, land: 'eu', airport: true },
  { id: 456172, name: 'Riga', countryCode: 'LV', latitude: 56.946, longitude: 24.10589, code: 'RIX', districts: ['Old Riga', 'Art Nouveau District', 'Āgenskalns', 'Avotu'], cost: 0.7, size: 2, rail: null, land: 'eu', airport: true },
  { id: 593116, name: 'Vilnius', countryCode: 'LT', latitude: 54.68916, longitude: 25.2798, code: 'VNO', districts: ['Old Town', 'Užupis', 'Žvėrynas', 'Naujamiestis'], cost: 0.7, size: 2, rail: null, land: 'eu', airport: true },
  { id: 264371, name: 'Athens', countryCode: 'GR', latitude: 37.98376, longitude: 23.72784, code: 'ATH', districts: ['Plaka', 'Monastiraki', 'Kolonaki', 'Psyrri', 'Koukaki', 'Exarchia'], cost: 0.8, size: 2, rail: null, land: null, airport: true },
  { id: 745044, name: 'Istanbul', countryCode: 'TR', latitude: 41.01384, longitude: 28.94966, code: 'IST', districts: ['Sultanahmet', 'Beyoğlu', 'Karaköy', 'Kadıköy', 'Beşiktaş', 'Balat'], cost: 0.6, size: 3, rail: null, land: 'eu', airport: true },
  { id: 3201047, name: 'Dubrovnik', countryCode: 'HR', latitude: 42.64807, longitude: 18.09216, code: 'DBV', districts: ['Old Town', 'Ploče', 'Lapad', 'Gruž'], cost: 1, size: 1, rail: null, land: 'eu', airport: true },
  { id: 3190261, name: 'Split', countryCode: 'HR', latitude: 43.50891, longitude: 16.43915, code: 'SPU', districts: ['Diocletian\'s Palace', 'Varoš', 'Bačvice', 'Meje'], cost: 0.85, size: 1, rail: null, land: 'eu', airport: true },
  // No flights: Ukrainian airspace is closed, so these are reached by train and bus only
  { id: 703448, name: 'Kyiv', countryCode: 'UA', latitude: 50.45466, longitude: 30.5238, code: 'IEV', districts: ['Podil', 'Pechersk', 'Khreshchatyk', 'Shevchenkivskyi'], cost: 0.55, size: 3, rail: 'ua', land: 'eu', airport: false },
  { id: 702550, name: 'Lviv', countryCode: 'UA', latitude: 49.83826, longitude: 24.02324, code: 'LWO', districts: ['Old Town', 'Rynok', 'Lychakiv', 'Zalizniachnyi'], cost: 0.5, size: 2, rail: 'ua', land: 'eu', airport: false },
  { id: 2562305, name: 'Valletta', countryCode: 'MT', latitude: 35.89968, longitude: 14.5148, code: 'MLA', districts: ['City Gate', 'Upper Barrakka', 'Strait Street', 'Marsamxett'], cost: 0.85, size: 1, rail: null, land: null, airport: true },
  { id: 683506, name: 'Bucharest', countryCode: 'RO', latitude: 44.43225, longitude: 26.10626, code: 'BUH', districts: ['Old Town', 'Cotroceni', 'Dorobanți', 'Floreasca'], cost: 0.6, size: 3, rail: null, land: 'eu', airport: true },
  { id: 727011, name: 'Sofia', countryCode: 'BG', latitude: 42.69751, longitude: 23.32415, code: 'SOF', districts: ['Center', 'Oborishte', 'Lozenets', 'Doctor\'s Garden'], cost: 0.55, size: 2, rail: null, land: 'eu', airport: true },
  { id: 792680, name: 'Belgrade', countryCode: 'RS', latitude: 44.80401, longitude: 20.46513, code: 'BEG', districts: ['Stari Grad', 'Dorćol', 'Savamala', 'Vračar', 'Zemun'], cost: 0.6, size: 2, rail: null, land: 'eu', airport: true },

  // Day-trip towns
  { id: 2262912, name: 'Sintra', countryCode: 'PT', latitude: 38.80097, longitude: -9.37826, code: 'SNT', districts: ['Historic Centre', 'São Pedro'], cost: 0.95, size: 1, rail: 'pt', land: 'eu', airport: false, dayTripFrom: 2267057 },
  { id: 2269594, name: 'Cascais', countryCode: 'PT', latitude: 38.69979, longitude: -9.42146, code: 'CSC', districts: ['Centro', 'Estoril seafront'], cost: 1, size: 1, rail: 'pt', land: 'eu', airport: false, dayTripFrom: 2267057 },
  { id: 2969679, name: 'Versailles', countryCode: 'FR', latitude: 48.80359, longitude: 2.13424, code: 'VRS', districts: ['Notre-Dame', 'Saint-Louis'], cost: 1.3, size: 1, rail: 'core', land: 'eu', airport: false, dayTripFrom: 2988507 },
  { id: 2852458, name: 'Potsdam', countryCode: 'DE', latitude: 52.39886, longitude: 13.06566, code: 'PTD', districts: ['Sanssouci', 'Dutch Quarter'], cost: 1, size: 1, rail: 'core', land: 'eu', airport: false, dayTripFrom: 2950159 },
  { id: 2510409, name: 'Toledo', countryCode: 'ES', latitude: 39.8581, longitude: -4.02263, code: 'TOL', districts: ['Casco Histórico', 'Judería'], cost: 0.9, size: 1, rail: 'es', land: 'eu', airport: false, dayTripFrom: 3117735 },
  { id: 3170647, name: 'Pisa', countryCode: 'IT', latitude: 43.70853, longitude: 10.4036, code: 'PSA', districts: ['Piazza dei Miracoli', 'Lungarno'], cost: 1, size: 1, rail: 'core', land: 'eu', airport: false, dayTripFrom: 3176959 },
  { id: 2800931, name: 'Bruges', countryCode: 'BE', latitude: 51.20892, longitude: 3.22424, code: 'BRG', districts: ['Markt', 'Sint-Anna'], cost: 1.1, size: 1, rail: 'core', land: 'eu', airport: false, dayTripFrom: 2800866 },
  { id: 2755003, name: 'Haarlem', countryCode: 'NL', latitude: 52.38084, longitude: 4.63683, code: 'HRL', districts: ['Grote Markt', 'Spaarne'], cost: 1.2, size: 1, rail: 'core', land: 'eu', airport: false, dayTripFrom: 2759794 },
  { id: 3165624, name: 'Tivoli', countryCode: 'IT', latitude: 41.95952, longitude: 12.80133, code: 'TIV', districts: ['Centro Storico', 'Villa d\'Este'], cost: 0.95, size: 1, rail: 'core', land: 'eu', airport: false, dayTripFrom: 3169070 },
  { id: 755889, name: 'Wieliczka', countryCode: 'PL', latitude: 49.98738, longitude: 20.06473, code: 'WLK', districts: ['Rynek Górny', 'Salt Mine'], cost: 0.7, size: 1, rail: 'core', land: 'eu', airport: false, dayTripFrom: 3094802 },
  { id: 3085151, name: 'Sopot', countryCode: 'PL', latitude: 54.4418, longitude: 18.56003, code: 'SOP', districts: ['Monte Cassino', 'Molo'], cost: 0.85, size: 1, rail: 'core', land: 'eu', airport: false, dayTripFrom: 3099434 }
]

// Rail links across group borders that run in reality (Eurostar, Poland–Ukraine)
export const RAIL_LINKS: [string, string][] = [
  ['LON', 'PAR'], ['LON', 'BRU'], ['LON', 'AMS'],
  ['WAW', 'IEV'], ['WAW', 'LWO'], ['KRK', 'LWO'], ['KRK', 'IEV']
]

export const COUNTRY_RAIL_OPERATOR: Record<string, string> = {
  PL: 'PKP Intercity',
  PT: 'CP',
  ES: 'Renfe',
  FR: 'SNCF TGV',
  GB: 'LNER',
  NL: 'NS International',
  BE: 'SNCB',
  DE: 'Deutsche Bahn ICE',
  AT: 'ÖBB Railjet',
  CH: 'SBB',
  CZ: 'České dráhy',
  HU: 'MÁV',
  SK: 'ZSSK',
  SI: 'Slovenske železnice',
  IT: 'Trenitalia Frecciarossa',
  DK: 'DSB',
  SE: 'SJ',
  NO: 'Vy',
  UA: 'Ukrzaliznytsia'
}

export const AIRLINES = [
  { name: 'LOT', code: 'LO', home: ['PL'] },
  { name: 'TAP', code: 'TP', home: ['PT'] },
  { name: 'Iberia', code: 'IB', home: ['ES'] },
  { name: 'Vueling', code: 'VY', home: ['ES'] },
  { name: 'Air France', code: 'AF', home: ['FR'] },
  { name: 'British Airways', code: 'BA', home: ['GB'] },
  { name: 'Aer Lingus', code: 'EI', home: ['IE'] },
  { name: 'KLM', code: 'KL', home: ['NL'] },
  { name: 'Brussels Airlines', code: 'SN', home: ['BE'] },
  { name: 'Lufthansa', code: 'LH', home: ['DE'] },
  { name: 'Austrian', code: 'OS', home: ['AT'] },
  { name: 'Swiss', code: 'LX', home: ['CH'] },
  { name: 'ITA Airways', code: 'AZ', home: ['IT'] },
  { name: 'SAS', code: 'SK', home: ['DK', 'SE', 'NO'] },
  { name: 'Finnair', code: 'AY', home: ['FI'] },
  { name: 'airBaltic', code: 'BT', home: ['LV', 'LT', 'EE'] },
  { name: 'Aegean', code: 'A3', home: ['GR'] },
  { name: 'Turkish Airlines', code: 'TK', home: ['TR'] },
  { name: 'Croatia Airlines', code: 'OU', home: ['HR'] },
  { name: 'TAROM', code: 'RO', home: ['RO'] },
  { name: 'Air Serbia', code: 'JU', home: ['RS'] },
  { name: 'Ryanair', code: 'FR', home: [] },
  { name: 'Wizz Air', code: 'W6', home: [] },
  { name: 'easyJet', code: 'U2', home: [] },
  { name: 'Norwegian', code: 'DY', home: ['NO'] }
]

// Hubs a one-stop flight connects through
export const HUB_CODES = ['FRA', 'AMS', 'MUC', 'VIE', 'ZRH', 'IST', 'CPH', 'MAD', 'WAW', 'BRU']
export const HUB_NAMES: Record<string, string> = {
  FRA: 'Frankfurt',
  AMS: 'Amsterdam',
  MUC: 'Munich',
  VIE: 'Vienna',
  ZRH: 'Zurich',
  IST: 'Istanbul',
  CPH: 'Copenhagen',
  MAD: 'Madrid',
  WAW: 'Warsaw',
  BRU: 'Brussels'
}

export const BUS_OPERATORS: Record<string, string> = {
  default: 'FlixBus',
  PT: 'Rede Expressos',
  ES: 'Alsa',
  PL: 'FlixBus',
  CZ: 'RegioJet',
  SK: 'RegioJet',
  LV: 'Lux Express',
  LT: 'Lux Express',
  EE: 'Lux Express',
  UA: 'FlixBus',
  HR: 'FlixBus',
  TR: 'Metro Turizm',
  RS: 'Lasta',
  BG: 'Union Ivkoni',
  RO: 'Atlassib',
  FR: 'BlaBlaCar Bus'
}

// Food place styles a country is known for, on top of the generic ones
export const LOCAL_FOOD: Record<string, string[]> = {
  PT: ['Tasca', 'Marisqueira', 'Pastelaria'],
  ES: ['Taberna', 'Tapas Bar', 'Churrería'],
  IT: ['Trattoria', 'Osteria', 'Pizzeria', 'Gelateria'],
  FR: ['Bistro', 'Brasserie', 'Boulangerie'],
  DE: ['Wirtshaus', 'Biergarten', 'Konditorei'],
  AT: ['Beisl', 'Kaffeehaus', 'Konditorei'],
  CH: ['Fondue Stübli', 'Konditorei'],
  PL: ['Bar Mleczny', 'Pierogarnia', 'Cukiernia'],
  CZ: ['Hospoda', 'Kavárna'],
  HU: ['Étterem', 'Cukrászda'],
  GB: ['Pub', 'Fish & Chips', 'Tea Room'],
  IE: ['Pub', 'Tea Room'],
  NL: ['Eetcafé', 'Pannenkoekenhuis'],
  BE: ['Frituur', 'Estaminet'],
  DK: ['Smørrebrød Bar', 'Bakery'],
  SE: ['Fika Café', 'Bistro'],
  NO: ['Fish Market', 'Bakery'],
  FI: ['Kahvila', 'Fish Market'],
  GR: ['Taverna', 'Souvlaki Bar', 'Bakery'],
  TR: ['Meyhane', 'Kebab House', 'Börek Bakery'],
  HR: ['Konoba', 'Seafood Grill'],
  UA: ['Varenychna', 'Coffee House'],
  EE: ['Kohvik'],
  LV: ['Kafejnīca'],
  LT: ['Kavinė'],
  RO: ['Bistro', 'Covrigărie'],
  BG: ['Mehana', 'Banitsa Bakery'],
  RS: ['Kafana', 'Pekara'],
  MT: ['Pastizzeria', 'Fish Grill'],
  SK: ['Krčma'],
  SI: ['Gostilna']
}

export const LOCAL_FIRST_NAMES: Record<string, string[]> = {
  PT: ['Ana', 'João', 'Rita', 'Miguel'],
  ES: ['Lucía', 'Pablo', 'Carmen', 'Javier'],
  IT: ['Giulia', 'Marco', 'Sofia', 'Luca'],
  FR: ['Élise', 'Julien', 'Camille', 'Hugo'],
  DE: ['Anna', 'Lukas', 'Greta', 'Felix'],
  AT: ['Lena', 'Jakob'],
  CH: ['Mia', 'Noah'],
  PL: ['Zofia', 'Jan', 'Ola', 'Kuba'],
  CZ: ['Tereza', 'Jakub'],
  HU: ['Réka', 'Bence'],
  GB: ['Maggie', 'Oliver', 'Isla'],
  IE: ['Niamh', 'Seán'],
  NL: ['Fleur', 'Daan'],
  BE: ['Lotte', 'Arthur'],
  DK: ['Freja', 'Mads'],
  SE: ['Elsa', 'Oskar'],
  NO: ['Ingrid', 'Henrik'],
  FI: ['Aino', 'Eero'],
  GR: ['Eleni', 'Nikos'],
  TR: ['Elif', 'Emre'],
  HR: ['Ivana', 'Luka'],
  UA: ['Oksana', 'Taras', 'Solomiia'],
  EE: ['Kertu'],
  LV: ['Laura'],
  LT: ['Ieva'],
  RO: ['Ioana'],
  BG: ['Maria'],
  RS: ['Milica'],
  MT: ['Rebecca'],
  SK: ['Zuzana'],
  SI: ['Maja']
}

export const STAY_PREFIX: Record<string, string> = {
  PT: 'Casa',
  ES: 'Casa',
  IT: 'Palazzo',
  FR: 'Maison',
  DE: 'Haus',
  AT: 'Haus',
  CH: 'Haus',
  PL: 'Dom',
  NL: 'Huis',
  BE: 'Maison',
  HR: 'Vila',
  GR: 'Villa',
  TR: 'Konak'
}
