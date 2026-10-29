export enum EGapReason {
  NONE_IN_CATALOGUE = 'none_in_catalogue',
  ALL_EXCLUDED = 'all_excluded',
  // Set by code, never by the agent: an item it chose failed the checks and was left out of a salvaged plan
  NOT_PLANNED = 'not_planned'
}
