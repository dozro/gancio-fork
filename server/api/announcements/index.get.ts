// return id and title of visible announcements
// this is used to show a preview at homepage
export default defineEventHandler(async evt => {
  const user = await getUser(evt)
  if (user?.is_admin || user?.is_editor) {
    return Announcement.findAll()
  } else {
    return Announcement.findAll({ attributes: ['title', 'id'], where: { visible: true }})
  }
})
