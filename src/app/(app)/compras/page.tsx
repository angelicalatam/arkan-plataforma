import { ShoppingCart } from "lucide-react";
import { ModulePlaceholder } from "@/components/ui/ModulePlaceholder";

export default function ComprasPage() {
  return (
    <ModulePlaceholder
      title="Compras"
      description="Pedidos a proveedores vinculados a obra y partida, con facturas y estados."
      icon={ShoppingCart}
      phase="Fase 6 · Compras y materiales"
    />
  );
}
