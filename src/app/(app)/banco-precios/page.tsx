import { PageHeader } from "@/components/ui/PageHeader";
import { getPriceItems, getPriceMaterials } from "@/lib/quotes/bank";
import { BankView } from "./BankView";

export default async function BancoPreciosPage() {
  const [items, materials] = await Promise.all([getPriceItems(), getPriceMaterials()]);

  return (
    <div>
      <PageHeader
        title="Banco de precios"
        description="Tus partidas y materiales de referencia para crear presupuestos más rápido."
      />
      <BankView items={items} materials={materials} />
    </div>
  );
}
