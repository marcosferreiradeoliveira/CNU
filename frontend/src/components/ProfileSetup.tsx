import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchVagas } from '@/lib/api'; 
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton"; 
import { Badge } from "@/components/ui/badge";

// Interface para representar uma vaga vinda da API
interface Vaga {
  id: string;
  titulo: string;
  bloco_id: string;
  pesos: {
    [key: string]: number;
  };
}

interface ProfileSetupProps {
  onProfileComplete: (profile: { name: string; vaga: Vaga }) => void;
  blockId: string; // Recebe o ID do bloco selecionado como propriedade
}

const ProfileSetup: React.FC<ProfileSetupProps> = ({ onProfileComplete, blockId }) => {
  const [name, setName] = useState('');
  const [selectedVagaId, setSelectedVagaId] = useState('');

  // A query agora depende do blockId. Se o blockId mudar, a query será refeita.
  const { data: vagas, isLoading, isError } = useQuery<Vaga[]>({
    queryKey: ['vagas', blockId], // Adiciona blockId à chave da query
    queryFn: () => fetchVagas(blockId), // Passa o blockId para a função de fetch
    enabled: !!blockId, // A query só será executada se o blockId existir
  });

  const selectedVaga = vagas?.find(v => v.id === selectedVagaId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && selectedVaga) {
      onProfileComplete({
        name,
        vaga: selectedVaga
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4 flex items-center justify-center">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            Configure seu Perfil CNU
          </CardTitle>
          <CardDescription className="text-lg">
            Personalize seus simulados de acordo com o seu cargo e prioridades
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Seu Nome</Label>
              <Input
                id="name"
                placeholder="Digite seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-lg"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cargo">Cargo Pretendido</Label>
              {isLoading && <Skeleton className="h-10 w-full" />}
              {isError && <p className="text-red-500 text-sm">Erro ao carregar os cargos.</p>}
              {vagas && (
                <Select value={selectedVagaId} onValueChange={setSelectedVagaId} required>
                  <SelectTrigger className="text-lg">
                    <SelectValue placeholder="Selecione seu cargo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {vagas.map((vaga) => (
                      <SelectItem key={vaga.id} value={vaga.id}>
                        {vaga.titulo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {selectedVaga && (
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-semibold">Pesos dos Eixos para "{selectedVaga.titulo}"</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  {Object.entries(selectedVaga.pesos).map(([eixoId, peso]) => (
                    <div key={eixoId} className="flex justify-between items-center text-sm">
                      <Label className="font-medium capitalize">{eixoId.replace('-', ' ')}</Label>
                      <Badge variant="secondary">Peso {peso}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full gradient-primary text-white text-lg py-6"
              disabled={!name || !selectedVaga}
            >
              Começar a Estudar 🚀
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSetup;