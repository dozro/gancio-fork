export default defineEventHandler(event => {
    return Collection.findAll()
})