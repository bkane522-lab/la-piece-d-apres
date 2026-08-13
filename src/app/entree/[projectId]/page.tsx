import { EntryGate } from "@/components/EntryGate";

export default async function EntreePage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  return <EntryGate projectId={projectId} />;
}
