import { PageHeader } from "@/components/ui/PageHeader";
import { getProducts } from "@/lib/products/queries";
import { ProductsView } from "./ProductsView";

export default async function ProductosPage() {
  const products = await getProducts();

  return (
    <div>
      <PageHeader
        title="Productos"
        description="Banco de productos con foto, precio y referencia para ofrecer al cliente."
      />
      <ProductsView products={products} />
    </div>
  );
}
