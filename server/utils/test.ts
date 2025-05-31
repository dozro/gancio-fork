import { connect, User } from './sequelize.ts'

const ret = await connect()
const users = await User.findAll()
console.error(users)