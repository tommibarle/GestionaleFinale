import CategoryTable from "@/components/categories/category-table";

export default function CategoriesPage() {
  return (
    <div className="container py-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Gestione Categorie</h1>
        <p className="text-muted-foreground">
          Gestisci le categorie per gli articoli nel magazzino.
        </p>
      </div>

      <CategoryTable />
    </div>
  );
}