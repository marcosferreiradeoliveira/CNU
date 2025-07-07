
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Calendar, TrendingUp, Target, Award, Play, BarChart3 } from 'lucide-react';

interface DashboardProps {
  profile: {
    name: string;
    cargo: string;
    weights: {
      eixo1: number;
      eixo2: number;
      eixo3: number;
      eixo4: number;
      eixo5: number;
    };
  };
  onStartSimulado: () => void;
  onViewResults: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ profile, onStartSimulado, onViewResults }) => {
  const simuladosRealizados = 12;
  const streak = 7;
  const mediaGeral = 78;
  const melhorEixo = "Eixo 1";
  const piorEixo = "Eixo 3";

  const eixosData = [
    { name: 'Gestão Governamental', progress: 85, weight: profile.weights.eixo1, color: 'bg-blue-500' },
    { name: 'Riscos e Inovação', progress: 72, weight: profile.weights.eixo2, color: 'bg-green-500' },
    { name: 'Políticas Públicas', progress: 65, weight: profile.weights.eixo3, color: 'bg-yellow-500' },
    { name: 'Administração Financeira', progress: 80, weight: profile.weights.eixo4, color: 'bg-purple-500' },
    { name: 'Transparência', progress: 75, weight: profile.weights.eixo5, color: 'bg-pink-500' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            Olá, {profile.name}! 👋
          </h1>
          <p className="text-lg text-muted-foreground">
            Cargo: {profile.cargo}
          </p>
          <Badge variant="secondary" className="text-sm">
            Simulado Diário Disponível
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="gradient-primary text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Simulados Realizados</p>
                  <p className="text-3xl font-bold">{simuladosRealizados}</p>
                </div>
                <Calendar className="h-8 w-8 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Sequência (dias)</p>
                  <p className="text-3xl font-bold">{streak}</p>
                </div>
                <TrendingUp className="h-8 w-8 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-purple-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Média Geral</p>
                  <p className="text-3xl font-bold">{mediaGeral}%</p>
                </div>
                <Target className="h-8 w-8 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-orange-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Ranking</p>
                  <p className="text-3xl font-bold">#47</p>
                </div>
                <Award className="h-8 w-8 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-2 border-blue-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5 text-blue-600" />
                Simulado Diário
              </CardTitle>
              <CardDescription>
                Seu simulado personalizado está pronto com base nos pesos do seu cargo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-blue-100 to-green-100 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-700">Composição do Simulado</p>
                  <div className="mt-2 space-y-1">
                    {eixosData.map((eixo, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{eixo.name}</span>
                        <span className="font-semibold">{eixo.weight * 5} questões</span>
                      </div>
                    ))}
                  </div>
                </div>
                <Button onClick={onStartSimulado} className="w-full gradient-primary text-white py-6 text-lg">
                  Iniciar Simulado do Dia 🎯
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-600" />
                Análise de Performance
              </CardTitle>
              <CardDescription>
                Acompanhe seu progresso por eixo temático
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {eixosData.map((eixo, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{eixo.name}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant={eixo.weight >= 3 ? "default" : "secondary"} className="text-xs">
                          Peso {eixo.weight}
                        </Badge>
                        <span className="text-sm font-bold">{eixo.progress}%</span>
                      </div>
                    </div>
                    <Progress value={eixo.progress} className="h-2" />
                  </div>
                ))}
                <Button onClick={onViewResults} variant="outline" className="w-full mt-4">
                  Ver Análise Completa
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Insights */}
        <Card>
          <CardHeader>
            <CardTitle>Insights Inteligentes 🤖</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-800">✅ Ponto Forte</h4>
                <p className="text-sm text-green-700 mt-1">
                  Você está indo muito bem em <strong>{melhorEixo}</strong>! Continue focando nessa área de alta pontuação.
                </p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h4 className="font-semibold text-yellow-800">⚠️ Área de Melhoria</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  <strong>{piorEixo}</strong> precisa de mais atenção. Sugestão: 30 min extras por dia neste tema.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
