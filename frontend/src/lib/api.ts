// src/lib/api.ts
const API_BASE_URL = "https://cnu-backend-300664086590.us-central1.run.app/api";

export interface PerfilSimulado {
    banca: string;
    disciplinas: string[];
    num_questoes_por_disciplina?: number;
}

export interface Erro {
    disciplina: string;
    enunciado: string;
    resposta_usuario: string;
    resposta_correta: string;
}

export const fetchQuestoesSimulado = async (perfil: PerfilSimulado) => {
    const response = await fetch(`${API_BASE_URL}/gerar-simulado`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(perfil),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao buscar questões');
    }

    return response.json();
};

export const postGerarPodcast = async (erros: Erro[]) => {
    const response = await fetch(`${API_BASE_URL}/gerar-podcast`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ erros }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao gerar podcast');
    }

    return response.json();
};



export const fetchVagas = async (blockId: string) => {
    // Adicionamos o filtro por bloco na URL
    const response = await fetch(`${API_BASE_URL}/vagas?bloco_id=${blockId}`);
    if (!response.ok) {
        throw new Error('Falha ao buscar vagas para o bloco selecionado');
    }
    return response.json();
};


export const fetchBlocos = async () => {
    const response = await fetch(`${API_BASE_URL}/blocos`);
    if (!response.ok) {
        throw new Error('Falha ao buscar blocos');
    }
    return response.json();
};