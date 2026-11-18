import { MovimentacoesProvider } from "@/components/providers/MovimentacoesProvider";
import { AppShell } from "@/components/layout/AppShell";

export default function PainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MovimentacoesProvider>
      <AppShell>{children}</AppShell>
    </MovimentacoesProvider>
  );
}
