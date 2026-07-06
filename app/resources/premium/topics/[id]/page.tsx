import { TopicEditor } from "@/components/admin/topic-editor"

export default async function TopicEditorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <TopicEditor id={id} />
}
