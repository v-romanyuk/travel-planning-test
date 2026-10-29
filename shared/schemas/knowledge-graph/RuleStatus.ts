// `unenforceable` = the catalogue has no field for this fact; code can't check it, so the agent judges it from each entry's text and the plan discloses that
export enum ERuleStatus {
  COMPILED = 'compiled',
  UNENFORCEABLE = 'unenforceable'
}
