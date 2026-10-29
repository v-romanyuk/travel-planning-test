import type { TSignUpReq } from '~~/shared/schemas/auth/SignUpReqSchema'
import type { TUpdateMeReq } from '~~/shared/schemas/users/UpdateMeReqSchema'

class AuthService {
  signUp (body: TSignUpReq) {
    return $fetch('/api/auth/signup', { method: 'POST', body })
  }

  getMe () {
    return $fetch('/api/me')
  }

  updateMe (body: TUpdateMeReq) {
    return $fetch('/api/me', { method: 'PATCH', body })
  }
}

export const authService = new AuthService()
