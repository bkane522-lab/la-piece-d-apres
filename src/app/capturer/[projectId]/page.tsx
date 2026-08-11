import { CameraCapture } from "@/components/CameraCapture";

export default async function CapturerPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  return <CameraCapture projectId={projectId} />;
}
