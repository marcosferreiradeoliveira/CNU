import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Trophy, Target, TrendingUp, Clock, Headphones, BarChart3 } from 'lucide-react';

interface ResultadoProps {
  resultado: {
    totalQuestions: number;
    correctAnswers: number;
    score: number;
    resultsByEixo: { [key: string]: { correct: number; total: number } };
    timeSpent: number;
    questions?: any[]; // para gabarito
    answers?: { [key: string]: string };
  };
  onBackToDashboard: () => void;
  onGeneratePodcast: () => void;
  podcastUrl?: string | null;
  isGeneratingPodcast?: boolean;
}

const Resultado: React.FC<ResultadoProps> = ({ resultado, onBackToDashboard, onGeneratePodcast, podcastUrl, isGeneratingPodcast }) => {
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreMessage = (score: number) => {
    if (score >= 90) return { message: "Excelente! 🎉", description: "Você está muito bem preparado!" };
    if (score >= 80) return { message: "Muito Bom! 👏", description: "Continue assim, você está no caminho certo!" };
    if (score >= 70) return { message: "Bom! 👍", description: "Bom desempenho, mas ainda há espaço para melhorar." };
    if (score >= 60) return { message: "Regular 📚", description: "Precisa focar mais nos estudos." };
    return { message: "Precisa Melhorar 💪", description: "Não desanime! Todo mundo começa de algum lugar." };
  };

  const scoreInfo = getScoreMessage(resultado.score);
  
  const eixosPerformance = Object.entries(resultado.resultsByEixo).map(([eixo, data]) => ({
    name: eixo,
    percentage: Math.round((data.correct / data.total) * 100),
    correct: data.correct,
    total: data.total
  })).sort((a, b) => b.percentage - a.percentage);

  const bestEixo = eixosPerformance[0];
  const worstEixo = eixosPerformance[eixosPerformance.length - 1];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header com Score */}
        <Card className="text-center gradient-primary text-white">
          <CardContent className="p-8">
            <Trophy className="h-16 w-16 mx-auto mb-4 opacity-90" />
            <h1 className="text-4xl font-bold mb-2">{resultado.score}%</h1>
            <h2 className="text-2xl font-semibold mb-2">{scoreInfo.message}</h2>
            <p className="text-lg opacity-90">{scoreInfo.description}</p>
            <div className="flex justify-center items-center gap-6 mt-6 text-sm">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                <span>{resultado.correctAnswers}/{resultado.totalQuestions} acertos</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Tempo: {formatTime(resultado.timeSpent)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ações Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-2 border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Headphones className="h-5 w-5 text-purple-600" />
                Podcast Personalizado
              </CardTitle>
              <CardDescription>
                Análise detalhada dos seus erros em formato de áudio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={onGeneratePodcast} className="w-full bg-purple-600 hover:bg-purple-700 text-white" disabled={isGeneratingPodcast}>
                {isGeneratingPodcast ? 'Gerando Podcast...' : '🎧 Gerar Podcast de Análise'}
              </Button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                IA analisará seus erros e criará um áudio explicativo
              </p>
              {isGeneratingPodcast && (
                <div className="text-center text-purple-700 mt-2">Aguarde, gerando áudio...</div>
              )}
              {podcastUrl && (
                <div className="mt-4 text-center">
                  <audio controls src={podcastUrl} className="w-full">
                    Seu navegador não suporta o elemento de áudio.
                  </audio>
                  <div className="text-xs text-gray-500 mt-1">Podcast gerado com base nos seus erros</div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-600" />
                Continuar Estudando
              </CardTitle>
              <CardDescription>
                Volte ao dashboard para mais simulados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={onBackToDashboard} variant="outline" className="w-full border-green-200 hover:bg-green-50">
                📊 Voltar ao Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Performance por Eixo */}
        <Card>
          <CardHeader>
            <CardTitle>Performance por Eixo Temático</CardTitle>
            <CardDescription>
              Veja como você se saiu em cada área do conhecimento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {eixosPerformance.map((eixo, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{eixo.name}</span>
                      {index === 0 && <Badge className="bg-green-100 text-green-800">Melhor</Badge>}
                      {index === eixosPerformance.length - 1 && eixosPerformance.length > 1 && (
                        <Badge variant="secondary">Precisa melhorar</Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <span className={`font-bold ${getScoreColor(eixo.percentage)}`}>
                        {eixo.percentage}%
                      </span>
                      <span className="text-sm text-gray-500 ml-2">
                        ({eixo.correct}/{eixo.total})
                      </span>
                    </div>
                  </div>
                  <Progress value={eixo.percentage} className="h-3" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Insights e Recomendações */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-green-800 flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Pontos Fortes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-green-700">
                <strong>{bestEixo.name}:</strong> Excelente performance com {bestEixo.percentage}% de acertos!
                Continue focando nesta área pois ela tem alta pontuação no seu cargo.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-yellow-50 border-yellow-200">
            <CardHeader>
              <CardTitle className="text-yellow-800 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Oportunidades
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-yellow-700">
                <strong>{worstEixo.name}:</strong> Área que precisa de mais atenção ({worstEixo.percentage}% de acertos).
                Sugestão: dedique 30 minutos extras por dia estudando este tema.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Estatísticas Detalhadas */}
        <Card>
          <CardHeader>
            <CardTitle>Estatísticas Detalhadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="space-y-1">
                <p className="text-2xl font-bold text-blue-600">{resultado.correctAnswers}</p>
                <p className="text-sm text-gray-600">Acertos</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-red-600">{resultado.totalQuestions - resultado.correctAnswers}</p>
                <p className="text-sm text-gray-600">Erros</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-green-600">{Math.round((resultado.correctAnswers / resultado.totalQuestions) * 100)}%</p>
                <p className="text-sm text-gray-600">Aproveitamento</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-purple-600">{formatTime(resultado.timeSpent)}</p>
                <p className="text-sm text-gray-600">Tempo Gasto</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gabarito e Correção */}
        <Card>
          <CardHeader>
            <CardTitle>Gabarito e Correção</CardTitle>
            <CardDescription>
              Veja abaixo suas respostas e as corretas para cada questão.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {resultado.questions?.map((q: any, idx: number) => {
                const userAnswer = resultado.answers?.[q.id];
                const correctAnswer = q.resposta_correta;
                return (
                  <div key={q.id} className="p-4 border rounded-lg bg-white">
                    <div className="font-semibold mb-2">
                      {idx + 1}. {q.enunciado}
                    </div>
                    <ul className="mb-2">
                      {q.alternativas.map((alt: string, i: number) => {
                        const optionLetter = String.fromCharCode(65 + i);
                        const isUser = userAnswer === optionLetter;
                        const isCorrect = correctAnswer.startsWith(optionLetter);
                        return (
                          <li
                            key={optionLetter}
                            className={`flex items-center gap-2 ${isCorrect ? 'text-green-700 font-bold' : ''} ${isUser && !isCorrect ? 'text-red-600 font-bold' : ''}`}
                          >
                            <span>{optionLetter})</span>
                            <span>{alt}</span>
                            {isUser && <span className="ml-2">(Sua resposta)</span>}
                            {isCorrect && <span className="ml-2">(Correta)</span>}
                          </li>
                        );
                      })}
                    </ul>
                    {userAnswer && !correctAnswer.startsWith(userAnswer) && (
                      <div className="text-sm text-gray-600">
                        Explicação: {q.explicacao}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Resultado;