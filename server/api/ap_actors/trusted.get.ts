// import { APUser } from "~/server/utils/sequelize"

export default defineEventHandler(event => {
    return APUser.findAll({where: { trusted: true }})
})
