import { createFileRoute, redirect } from '@tanstack/react-router'
import { getPostById } from '../../../lib/server/blog'
import JournalPostForm from '../../../components/journal-post-form'

export const Route = createFileRoute('/admin/journal/$id/edit')({
  loader: async ({ params }) => {
    const data = await getPostById({ data: params.id })
    if (!data.authed) throw redirect({ to: '/admin' })
    if (!data.post) throw redirect({ to: '/admin/journal' })
    return { post: data.post }
  },
  component: EditPost,
})

function EditPost() {
  const { post } = Route.useLoaderData()
  // Remount the form (and its lazy editor) when switching between posts.
  return <JournalPostForm key={post.id} post={post} />
}
