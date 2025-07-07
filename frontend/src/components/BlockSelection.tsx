// frontend/src/components/BlockSelection.tsx

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchBlocos } from '@/lib/api'; // Criaremos essa função a seguir
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight } from 'lucide-react';

interface Bloco {
  id: string;
  nome: string;
  eixos_tematicos_ids: string[];
}

interface BlockSelectionProps {
  onBlockSelected: (blockId: string) => void;
}

const BlockSelection: React.FC<BlockSelectionProps> = ({ onBlockSelected }) => {
  const { data: blocos, isLoading, isError } = useQuery<Bloco[]>({
    queryKey: ['blocos'],
    queryFn: fetchBlocos
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4 flex items-center justify-center">
        <div className="w-full max-w-2xl space-y-4">
          <Skeleton className="h-12 w-3/4 mx-auto" />
          <Skeleton className="h-8 w-1/2 mx-auto" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (isError) {
    return <div className="text-center text-red-500">Erro ao carregar os blocos do concurso.</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4 flex items-center justify-center">
      <div className="w-full max-w-2xl text-center">
        <CardHeader>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            Concurso Público Nacional Unificado
          </CardTitle>
          <CardDescription className="text-lg mt-2">
            Primeiro passo: escolha o seu bloco temático de interesse.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {blocos?.map((bloco) => (
            <Card 
              key={bloco.id} 
              className="text-left hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all"
              onClick={() => onBlockSelected(bloco.id)}
            >
              <CardContent className="p-6 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-semibold">{bloco.nome}</h3>
                  <p className="text-sm text-gray-600">{bloco.eixos_tematicos_ids.length} Eixos Temáticos</p>
                </div>
                <ArrowRight className="h-6 w-6 text-gray-400" />
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </div>
    </div>
  );
};

export default BlockSelection;