import { TopicMobilePreview } from "@/components/admin/topic-mobile-preview"

export default async function TopicMobilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <TopicMobilePreview topicId={id} />
}
