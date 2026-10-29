import { signUp } from '~~/server/controllers/auth/signUp'
import { SignUpReqSchema } from '~~/shared/schemas/auth/SignUpReqSchema'
import { UserResSchema } from '~~/shared/schemas/users/UserResSchema'

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, b => SignUpReqSchema.parse(b))
  const user = await signUp(event, body)

  setResponseStatus(event, 201)

  return UserResSchema.parse(user)
})
