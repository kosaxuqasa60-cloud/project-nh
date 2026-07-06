import { MicrolessonForm } from "@/components/admin/microlesson-form"

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <MicrolessonForm id={id} />
}
