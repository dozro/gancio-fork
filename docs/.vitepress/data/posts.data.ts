import { createContentLoader } from 'vitepress'

function formatDate(date: string) {
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' }
  return new Date(date).toLocaleDateString(undefined, options)
}

export default createContentLoader('blog/*.md', {
  render: true,
  excerpt: true,
  transform(raw) {
    return raw
      .sort((a, b) => +new Date(b.frontmatter.date) - +new Date(a.frontmatter.date))
      .map((post) => {
        return {
          title: post.frontmatter.title,
          date: formatDate(post.frontmatter.date),
          description: post.frontmatter.description,
          excerpt: post.excerpt,
          author: post.frontmatter.author ?? 'Gancio Team',
          url: post.url
        }
      })
  }
})