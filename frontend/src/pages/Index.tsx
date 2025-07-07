import React, { useState } from 'react';
import ProfileSetup from '@/components/ProfileSetup';
import Dashboard from '@/components/Dashboard';
import Simulado from '@/components/Simulado';
import Resultado from '@/components/Resultado';
import BlockSelection from '@/components/BlockSelection'; // Importar o novo componente
import { postGerarPodcast } from '@/lib/api';

interface Vaga {
  id: string;
  titulo: string;
  bloco_id: string;
  pesos: {
    [key: string]: number;
  };
}

interface Profile {
  name: string;
  vaga: Vaga;
  weights: {
    eixo1: number;
    eixo2: number;
    eixo3: number;
    eixo4: number;
    eixo5: number;
  };
}

type AppState = 'bloco_selection' | 'setup' | 'dashboard' | 'simulado' | 'resultado';

const Index = () => {
  const [currentState, setCurrentState] = useState<AppState>('bloco_selection'); // Estado inicial agora é a seleção de bloco
  const [profile, setProfile] = useState<Profile | null>(null);
  const [lastResult, setLastResult] = useState<any>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null); // Novo estado para guardar o bloco
  const [podcastUrl, setPodcastUrl] = useState<string | null>(null);
  const [isGeneratingPodcast, setIsGeneratingPodcast] = useState(false);

  const handleBlockSelect = (blockId: string) => {
    setSelectedBlockId(blockId);
    setCurrentState('setup'); // Avança para a tela de setup do perfil
  };

  const handleProfileComplete = (profileData: { name: string; vaga: Vaga }) => {
    // Convert the profile data to include weights
    const profileWithWeights: Profile = {
      name: profileData.name,
      vaga: profileData.vaga,
      weights: {
        eixo1: profileData.vaga.pesos['eixo-1'] || 1,
        eixo2: profileData.vaga.pesos['eixo-2'] || 1,
        eixo3: profileData.vaga.pesos['eixo-3'] || 1,
        eixo4: profileData.vaga.pesos['eixo-4'] || 1,
        eixo5: profileData.vaga.pesos['eixo-5'] || 1,
      }
    };
    setProfile(profileWithWeights);
    setCurrentState('dashboard');
  };

  const handleStartSimulado = () => {
    if (profile) {
      setCurrentState('simulado');
    }
  };

  const handleSimuladoFinish = (resultado: any) => {
    setLastResult(resultado);
    setCurrentState('resultado');
  };

  const handleBackToDashboard = () => {
    setCurrentState('dashboard');
  };
  
  const handleGeneratePodcast = async () => {
    if (!lastResult || !lastResult.questions || !lastResult.answers) {
      alert('Dados do simulado não encontrados');
      return;
    }
    
    setIsGeneratingPodcast(true);
    
    // Coletar erros com validação melhorada
    const erros = lastResult.questions
      .map((q: any) => {
        const userAnswer = lastResult.answers[q.id];
        const correctLetter = q.resposta_correta.trim().charAt(0);
        
        if (userAnswer !== correctLetter) {
          // Garantir que a resposta do usuário seja formatada corretamente
          let respostaUsuario = 'Não respondida';
          if (userAnswer) {
            const index = userAnswer.charCodeAt(0) - 65; // A=0, B=1, etc.
            if (index >= 0 && index < q.alternativas.length) {
              respostaUsuario = `${userAnswer}) ${q.alternativas[index]}`;
            } else {
              respostaUsuario = userAnswer;
            }
          }
          
          return {
            disciplina: q.eixo || 'Disciplina não identificada',
            enunciado: q.enunciado || 'Enunciado não disponível',
            resposta_usuario: respostaUsuario,
            resposta_correta: q.resposta_correta || 'Resposta não disponível',
          };
        }
        return null;
      })
      .filter(Boolean);
    
    if (erros.length === 0) {
      alert('Parabéns! Você não cometeu erros. Não há necessidade de gerar um podcast de análise.');
      setIsGeneratingPodcast(false);
      return;
    }
    
    console.log('Erros sendo enviados:', erros);
    
    try {
      const res = await postGerarPodcast(erros);
      console.log('Resposta da API:', res);
      setPodcastUrl(res.podcastUrl);
    } catch (e) {
      console.error('Erro detalhado:', e);
      setPodcastUrl(null);
      alert(`Erro ao gerar podcast: ${e instanceof Error ? e.message : 'Erro desconhecido'}`);
    } finally {
      setIsGeneratingPodcast(false);
    }
  };

  const renderState = () => {
    switch (currentState) {
      case 'bloco_selection':
        return <BlockSelection onBlockSelected={handleBlockSelect} />;
      case 'setup':
        if (!selectedBlockId) {
          // Caso de segurança, se o ID do bloco não estiver definido, volta para a seleção
          setCurrentState('bloco_selection');
          return null;
        }
        return <ProfileSetup onProfileComplete={handleProfileComplete} blockId={selectedBlockId} />;
      case 'dashboard':
        if (!profile) return null;
        // Convert the profile to match Dashboard's expected interface
        const dashboardProfile = {
          name: profile.name,
          cargo: profile.vaga.titulo,
          weights: profile.weights
        };
        return <Dashboard profile={dashboardProfile} onStartSimulado={handleStartSimulado} onViewResults={() => {}} />;
      case 'simulado':
        return <Simulado profile={profile!} onFinish={handleSimuladoFinish} />;
      case 'resultado':
        return (
          <Resultado
            resultado={lastResult!}
            onBackToDashboard={handleBackToDashboard}
            onGeneratePodcast={handleGeneratePodcast}
            podcastUrl={podcastUrl}
            isGeneratingPodcast={isGeneratingPodcast}
          />
        );
      default:
        return <BlockSelection onBlockSelected={handleBlockSelect} />;
    }
  };

  return <main>{renderState()}</main>;
};

export default Index;