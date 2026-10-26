import { Op, col, fn, where } from '@sequelize/core'
import { User } from './db'

/** check if an e-mail is used by another user, ignoring case */
export async function isEmailTaken(email: string, excludeUserId?: number) {
  const count = await User.count({
    where: {
      [Op.and]: [
        where(fn('LOWER', col('email')), Op.eq, email.toLowerCase()),
        ...(excludeUserId != null ? [{ id: { [Op.ne]: excludeUserId } }] : [])
      ]
    }
  })
  return count > 0
}
