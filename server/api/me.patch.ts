import { updateMe } from '~~/server/controllers/users/updateMe'
import { UpdateMeReqSchema } from '~~/shared/schemas/users/UpdateMeReqSchema'
import { UserResSchema } from '~~/shared/schemas/users/UserResSchema'

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, b => UpdateMeReqSchema.parse(b))
  const user = await updateMe(event.context.user!.id, body)

  return UserResSchema.parse(user)
})
