import { TopicTeacherPreview } from "@/components/admin/topic-teacher-preview"

export default async function TopicPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <TopicTeacherPreview topicId={id} />
}
