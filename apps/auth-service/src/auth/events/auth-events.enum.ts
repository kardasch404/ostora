export enum AuthEvents {
  USER_REGISTERED = 'auth.user.registered',
  USER_LOGIN = 'auth.user.login',
  USER_LOGOUT = 'auth.user.logout',
  PASSWORD_CHANGED = 'auth.password.changed',
  PASSWORD_RESET_REQUESTED = 'auth.password.reset.requested',
  PASSWORD_RESET_COMPLETED = 'auth.password.reset.completed',
  EMAIL_CHANGED = 'auth.email.changed',
  EMAIL_VERIFIED = 'auth.email.verified',

  TWO_FACTOR_ENABLED = 'auth.2fa.enabled',
  TWO_FACTOR_DISABLED = 'auth.2fa.disabled',
  NEW_DEVICE_LOGIN = 'auth.device.new',
  SESSION_REVOKED = 'auth.session.revoked',
  ACCOUNT_LOCKED = 'auth.account.locked',
  ACCOUNT_UNLOCKED = 'auth.account.unlocked',
}
