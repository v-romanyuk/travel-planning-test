export interface ITripTravellersRepo {
  insertTripTravellers: (tripId: string, personIds: string[]) => Promise<void>
  findTripTravellerIdsByTripId: (tripId: string) => Promise<string[]>
  countTripTravellersByPersonId: (personId: string) => Promise<number>
}
