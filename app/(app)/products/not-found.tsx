import { Button, Icon } from "@/components/df";
import { EmptyState } from "@/components/shell/page-header";

export default function NotFound() {
  return (
    <EmptyState
      icon={<Icon name="box" />}
      title="No encontramos este producto"
      action={
        <Button href="/products" variant="primary">
          Ver tus productos
        </Button>
      }
    >
      Puede que lo hayas eliminado o que el enlace esté incompleto.
    </EmptyState>
  );
}
