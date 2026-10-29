export const PUBLIC_ROUTES = [
  '/api/health',
  '/api/auth/signup',
  // Signup needs the home-city search before a session exists
  '/api/cities'
] as const

export const isPublicRoute = (path: string) => {
  const cleanPath = path.split('?')[0] ?? path

  return PUBLIC_ROUTES.some(route => cleanPath === route)
}
