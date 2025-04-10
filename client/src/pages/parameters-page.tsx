
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ParametersPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [orderValue, setOrderValue] = useState("");

  const { data: parameters, isLoading } = useQuery({
    queryKey: ["/api/parameters"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/parameters");
      const data = await res.json();
      setOrderValue(data.orderValue.toString());
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (value: number) => {
      const res = await apiRequest("PUT", "/api/parameters", { orderValue: value });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parameters"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({
        title: "Parametri aggiornati",
        description: "I parametri sono stati aggiornati con successo",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseInt(orderValue);
    if (!isNaN(value)) {
      updateMutation.mutate(value);
    }
  };

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Parametri Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Valore dell'ordine (€)</label>
              <Input
                type="number"
                value={orderValue}
                onChange={(e) => setOrderValue(e.target.value)}
                placeholder="Inserisci il valore"
                className="mt-1"
              />
            </div>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Salvataggio..." : "Salva"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ParametersPage;
