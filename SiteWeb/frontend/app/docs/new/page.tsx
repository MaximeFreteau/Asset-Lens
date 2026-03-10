// app/docs/new/page.tsx
import DocFormPage from '@/components/DocFormPage'

export default function NewDocPage({
  params,
}: {
  params: Promise<{ id?: string }>
}) {
  return <DocFormPage params={Promise.resolve({})} mode="new" />
}