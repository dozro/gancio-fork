import type { UserRole } from "~~/server/utils/sequelize"

// shared/types/auth.d.ts
declare module '#auth-utils' {
  interface User {
    id: number,
    email: string,
    role: UserRole,
    is_editor: boolean,
    is_admin: boolean
  }

}

export { }
