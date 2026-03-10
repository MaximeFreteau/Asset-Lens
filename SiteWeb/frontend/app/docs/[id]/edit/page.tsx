// app/docs/[id]/edit/page.tsx
import DocFormPage from '@/components/DocFormPage'

export default function EditDocPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return <DocFormPage params={params} mode="edit" />
}