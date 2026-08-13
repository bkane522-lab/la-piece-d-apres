import { ConfirmReset } from "@/components/ConfirmReset";

export default async function ResetPasswordConfirmPage({ params }: { params: Promise<{ token_hash: string }> }) {
  const { token_hash } = await params;
  return <ConfirmReset tokenHash={token_hash} />;
}
