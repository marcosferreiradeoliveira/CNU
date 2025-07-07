import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { fetchQuestoesSimulado } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface Question {
  id: string;
  eixo: string;
  enunciado: string;
  alternativas: string[];
  resposta_correta: string;
  explicacao?: string;
}

interface SimuladoProps {
  profile: {
    weights: {
      eixo1: number;
      eixo2: number;
      eixo3: number;
      eixo4: number;
      eixo5: number;
    };
  };
  onFinish: (resultado: any) => void;
}

const Simulado: React.FC<SimuladoProps> = ({ profile, onFinish }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [timeLeft, setTimeLeft] = useState(3600); // 1 hora em segundos
  const [questions, setQuestions] = useState<Question[]>([]);

  // Mapear os pesos para os IDs dos eixos
  const getEixosFromWeights = () => {
    const eixos = [];
    if (profile.weights.eixo1 > 0) eixos.push('eixo-1');
    if (profile.weights.eixo2 > 0) eixos.push('eixo-2');
    if (profile.weights.eixo3 > 0) eixos.push('eixo-3');
    if (profile.weights.eixo4 > 0) eixos.push('eixo-4');
    if (profile.weights.eixo5 > 0) eixos.push('eixo-5');
    return eixos;
  };

  // Gerar questões usando a API
  const generateQuestionsMutation = useMutation({
    mutationFn: async () => {
      const eixos = getEixosFromWeights();
      const perfil = {
        banca: 'FGV', // Pode ser configurável no futuro
        disciplinas: eixos,
        num_questoes_por_disciplina: 2 // Questões por eixo - reduzido para teste
      };
      
      const questoes = await fetchQuestoesSimulado(perfil);
      return questoes as Question[];
    },
    onSuccess: (data) => {
      setQuestions(data);
    },
    onError: (error) => {
      console.error('Erro ao gerar questões:', error);
      // Fallback para questões mockadas em caso de erro
      setQuestions(generateMockQuestions());
    }
  });

  // Fallback: gerar questões mockadas
  const generateMockQuestions = (): Question[] => {
    const mockQuestions: Question[] = [];
    let id = 1;

    const eixos = [
      { name: 'Eixo 1', weight: profile.weights.eixo1, tema: 'Gestão Governamental e Governança Pública' },
      { name: 'Eixo 2', weight: profile.weights.eixo2, tema: 'Riscos, Inovação, Participação e Coordenação' },
      { name: 'Eixo 3', weight: profile.weights.eixo3, tema: 'Políticas Públicas' },
      { name: 'Eixo 4', weight: profile.weights.eixo4, tema: 'Administração Financeira e Orçamentária' },
      { name: 'Eixo 5', weight: profile.weights.eixo5, tema: 'Transparência e Proteção de Dados' },
    ];

    eixos.forEach(eixo => {
      const numQuestions = eixo.weight * 2; // 2 questões por peso - reduzido para teste
      for (let i = 0; i < numQuestions; i++) {
        mockQuestions.push({
          id: `mock-${id++}`,
          eixo: eixo.name,
          enunciado: `Questão sobre ${eixo.tema} - ${i + 1}. Em relação aos princípios fundamentais da administração pública, assinale a alternativa correta sobre ${eixo.tema.toLowerCase()}.`,
          alternativas: [
            'A implementação deve seguir rigorosamente os protocolos estabelecidos pela administração superior.',
            'Os processos devem ser transparentes e acessíveis ao controle social, respeitando a legislação vigente.',
            'As decisões devem priorizar a eficiência operacional em detrimento dos aspectos legais.',
            'O controle interno é suficiente para garantir a conformidade com as normas estabelecidas.',
            'A participação popular deve ser limitada aos casos expressamente previstos em lei.'
          ],
          resposta_correta: 'B',
          explicacao: `Esta questão aborda conceitos fundamentais de ${eixo.tema}. A alternativa correta enfatiza a importância da transparência e controle social, princípios essenciais na administração pública moderna.`
        });
      }
    });

    return mockQuestions.sort(() => Math.random() - 0.5);
  };

  // Iniciar geração de questões quando o componente montar
  useEffect(() => {
    generateQuestionsMutation.mutate();
  }, []);

  // Timer
  useEffect(() => {
    if (timeLeft > 0 && questions.length > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && questions.length > 0) {
      handleFinish();
    }
  }, [timeLeft, questions.length]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleFinish = () => {
    let correctAnswers = 0;
    const resultsByEixo: { [key: string]: { correct: number; total: number } } = {};

    questions.forEach(question => {
      const eixo = question.eixo;
      if (!resultsByEixo[eixo]) {
        resultsByEixo[eixo] = { correct: 0, total: 0 };
      }
      resultsByEixo[eixo].total++;

      // Corrigir: comparar apenas a letra
      const correctLetter = question.resposta_correta.trim().charAt(0);
      if (answers[question.id] === correctLetter) {
        correctAnswers++;
        resultsByEixo[eixo].correct++;
      }
    });

    const resultado = {
      totalQuestions: questions.length,
      correctAnswers,
      score: Math.round((correctAnswers / questions.length) * 100),
      resultsByEixo,
      answers,
      questions,
      timeSpent: 3600 - timeLeft
    };

    onFinish(resultado);
  };

  // Loading state
  if (generateQuestionsMutation.isPending || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">
            {generateQuestionsMutation.isPending ? 'Gerando seu simulado personalizado com IA...' : 'Carregando questões...'}
          </p>
          {generateQuestionsMutation.isError && (
            <p className="text-sm text-red-500 mt-2">Usando questões de exemplo devido a erro na conexão</p>
          )}
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const answered = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-white shadow-lg">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-4">
                <Badge variant="secondary" className="text-sm">
                  {currentQ.eixo}
                </Badge>
                <span className="text-sm font-medium">
                  Questão {currentQuestion + 1} de {questions.length}
                </span>
              </div>
              <div className="flex items-center gap-2 text-red-600">
                <Clock className="h-4 w-4" />
                <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
              </div>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>Respondidas: {answered}/{questions.length}</span>
              <span>{Math.round(progress)}% concluído</span>
            </div>
          </CardContent>
        </Card>

        {/* Questão */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg leading-relaxed">
              {currentQ.enunciado}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {currentQ.alternativas.map((alternativa, index) => {
              const optionLetter = String.fromCharCode(65 + index); // A, B, C, D, E
              return (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    answers[currentQ.id] === optionLetter
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-25'
                  }`}
                  onClick={() => handleAnswer(currentQ.id, optionLetter)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-bold ${
                      answers[currentQ.id] === optionLetter
                        ? 'border-blue-500 bg-blue-500 text-white'
                        : 'border-gray-300'
                    }`}>
                      {optionLetter}
                    </div>
                    <p className="text-sm leading-relaxed">{alternativa}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Navegação */}
        <Card className="bg-white shadow-lg">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <Button
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
                variant="outline"
              >
                ← Anterior
              </Button>
              
              <div className="flex gap-2">
                {answers[currentQ.id] !== undefined ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                )}
                <span className="text-sm text-gray-600">
                  {answers[currentQ.id] !== undefined ? 'Respondida' : 'Não respondida'}
                </span>
              </div>

              {currentQuestion < questions.length - 1 ? (
                <Button onClick={handleNext} className="gradient-primary text-white">
                  Próxima →
                </Button>
              ) : (
                <Button onClick={handleFinish} className="bg-green-600 text-white hover:bg-green-700">
                  Finalizar Simulado
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Simulado;