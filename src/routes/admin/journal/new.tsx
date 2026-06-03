import { createFileRoute, redirect } from '@tanstack/react-router'
import { listAllPosts } from '../../../lib/server/blog'
import JournalPostForm from '../../../components/journal-post-form'

export const Route = createFileRoute('/admin/journal/new')({
  // Reuse the gated list fn purely as a cheap session check for this route.
  loader: async () => {
    const data = await listAllPosts()
    if (!data.authed) throw redirect({ to: '/admin' })
    return null
  },
  component: NewPost,
})

function NewPost() {
  return <JournalPostForm />
}
