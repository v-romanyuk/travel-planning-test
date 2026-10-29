export const MAX_TRIP_DAYS = 14

export const ACK_MESSAGE = 'I\'ll plan this trip and come back to you. I won\'t book or charge anything while you\'re away.'

// A re-plan over an existing plan; a retry after a failed first run gets ACK_MESSAGE
export const REPLAN_ACK_MESSAGE = 'I\'ll re-plan this trip from your changes and come back to you. Your current plan stays until the new one is ready. I won\'t book or charge anything.'
