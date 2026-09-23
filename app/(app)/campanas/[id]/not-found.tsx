import { Button, Icon } from "@/components/df";
import { EmptyState } from "@/components/shell/page-header";

export default function NotFound() {
  return (
    <EmptyState
      icon={<Icon name="megaphone" />}
      title="No encontramos esta campaña"
      action={
        <Button href="/campanas" variant="primary">
          Ver tus campañas
        </Button>
      }
    >
      Puede que la hayas eliminado en Meta Ads o que el enlace esté incompleto.
    </EmptyState>
  );
}
