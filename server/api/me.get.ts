import { UserResSchema } from '~~/shared/schemas/users/UserResSchema'

export default defineEventHandler((event) => {
  return UserResSchema.parse(event.context.user!)
})
