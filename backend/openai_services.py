# openai_services.py

import os
import json
from openai import OpenAI
from pathlib import Path
from typing import Optional
import sys

# Carrega as variáveis de ambiente (sua chave da API) do arquivo .env
from dotenv import load_dotenv
load_dotenv()

# Inicializa o cliente da OpenAI
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def gerar_questoes_ia(disciplina: str, perfil_banca: dict, numero_de_questoes: int = 3) -> list:
    """
    Usa o GPT para gerar questões de simulado no estilo de uma banca específica.
    Retorna uma lista de dicionários de questões ou uma lista vazia em caso de erro.
    """
    
    # --- PROMPT ESTRATÉGICO E DETALHADO ---
    
    # 1. Definição do Papel (Role-Playing)
    prompt_lines = [
        f"Você é um especialista sênior na criação de questões de concurso público, com profundo conhecimento do estilo da banca {perfil_banca['nome']}.",
        "Sua tarefa é gerar questões originais e desafiadoras para a disciplina informada."
    ]

    # 2. Instruções de Estilo (Baseadas no Perfil da Banca)
    prompt_lines.append("\nSiga RIGOROSAMENTE estas diretrizes de estilo:")
    for instrucao in perfil_banca['instrucoes']:
        prompt_lines.append(f"- {instrucao}")

    # 3. Exemplos para Aprendizado (Few-Shot Learning)
    prompt_lines.append("\nUse os seguintes exemplos como referência de estilo e complexidade:")
    for exemplo in perfil_banca['exemplos']:
        prompt_lines.append(f"Exemplo de questão para '{exemplo['disciplina']}': {json.dumps(exemplo['questao'], ensure_ascii=False)}")
    
    # 4. A Tarefa Principal
    prompt_lines.append(f"\nTAREFA: Agora, gere {numero_de_questoes} novas questões para a disciplina de '{disciplina}'.")

    # 5. Formato de Saída Obrigatório para garantir a integração com o sistema
    prompt_lines.append("\nIMPORTANTE: Sua resposta DEVE ser um objeto JSON válido. O objeto deve conter uma única chave chamada 'questoes', que é uma lista de objetos. Cada objeto na lista representa uma questão e deve conter as chaves 'enunciado', 'alternativas' (uma lista de 5 strings), 'resposta_correta' (o texto exato de uma das alternativas) e 'explicacao' (uma justificativa clara e detalhada).")
    prompt_lines.append("Exemplo do formato de saída: {\"questoes\": [{\"enunciado\": \"...\", \"alternativas\": [\"A) ...\", \"B) ...\", \"C) ...\", \"D) ...\", \"E) ...\"], \"resposta_correta\": \"A) ...\", \"explicacao\": \"...\"}]}")

    prompt_completo = "\n".join(prompt_lines)

    print(f"[LOG][IA] Chamando OpenAI para disciplina: {disciplina}", file=sys.stderr)
    print("[LOG][IA] Prompt enviado:", prompt_completo, file=sys.stderr)
    try:
        print("[LOG][IA] Antes do client.chat.completions.create", file=sys.stderr)
        response = client.chat.completions.create(
            model="gpt-4o",  # Modelo recomendado pela sua capacidade e velocidade
            messages=[
                {"role": "system", "content": "Você é um gerador de questões de concurso que responde estritamente no formato JSON solicitado."},
                {"role": "user", "content": prompt_completo}
            ],
            response_format={"type": "json_object"}, # Força a resposta a ser um JSON válido
            temperature=0.8, # Aumenta a criatividade para questões mais originais
        )
        print("[LOG][IA] Depois do client.chat.completions.create", file=sys.stderr)
        print("[LOG][IA] Resposta recebida da OpenAI:", response, file=sys.stderr)
        content = response.choices[0].message.content
        if not content:
            print("[LOG][IA] Conteúdo da resposta está vazio ou None.", file=sys.stderr)
            return []
        print("[LOG][IA] Conteúdo da resposta:", content, file=sys.stderr)
        resultado_json = json.loads(content)
        return resultado_json.get("questoes", []) # Retorna a lista de questões ou uma lista vazia se a chave não existir

    except Exception as e:
        print(f"[LOG][IA] Erro ao chamar OpenAI: {e}", file=sys.stderr)
        return []

def gerar_script_explicativo(erros: list) -> str:
    """
    Usa o GPT para gerar um script didático explicando os erros do usuário.
    'erros' é uma lista de dicionários, cada um contendo a questão, a resposta do usuário e a resposta correta.
    """
    if not erros:
        return "Parabéns, você gabaritou o simulado! Não há erros para revisar. Continue com o excelente trabalho e dedicação!"

    # Prompt para a IA: claro, com contexto e instruções de formato
    prompt_lines = [
        "Você é um tutor especialista em concursos públicos, com uma voz calma e encorajadora. Sua tarefa é criar o roteiro de um podcast para um candidato que acabou de fazer um simulado.",
        "O tom deve ser didático, positivo e direto ao ponto. Aja como um professor particular explicando os erros do aluno de forma clara e construtiva.",
        "Para cada erro abaixo, explique o conceito por trás da resposta correta e, se possível, por que a alternativa marcada pelo usuário estava errada. Agrupe os erros por disciplina.",
        "Seja conciso, pois isso será convertido em áudio. Comece com uma saudação e termine com uma mensagem motivacional, reforçando que o erro faz parte do processo de aprendizado.",
        "\nAqui estão os erros do aluno para você analisar:\n"
    ]

    for erro in erros:
        texto_erro = (
            f"- Disciplina: {erro['disciplina']}\n"
            f"  Enunciado da questão: '{erro['enunciado']}'\n"
            f"  Sua resposta foi: '{erro['resposta_usuario']}'\n"
            f"  A resposta correta é: '{erro['resposta_correta']}'\n"
        )
        prompt_lines.append(texto_erro)
    
    prompt_completo = "\n".join(prompt_lines)

    print("[LOG][IA] Prompt enviado para explicação de erros:")
    print(prompt_completo)
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",  # Ótimo custo-benefício para resumo e explicação
            messages=[
                {"role": "system", "content": "Você é um tutor de concursos que cria roteiros para podcasts de revisão de erros."},
                {"role": "user", "content": prompt_completo}
            ],
            temperature=0.5,
        )
        print("[LOG][IA] Resposta recebida da OpenAI:")
        print(response)
        content = response.choices[0].message.content
        if not content:
            print("[LOG][IA] Conteúdo da resposta está vazio ou None.")
            return "Houve um erro ao gerar seu resumo em áudio. Por favor, tente novamente mais tarde."
        print("[LOG][IA] Conteúdo da resposta:")
        print(content)
        return content
    except Exception as e:
        print(f"Erro ao gerar script com a API da OpenAI: {e}")
        return "Houve um erro ao gerar seu resumo em áudio. Por favor, tente novamente mais tarde."

def gerar_podcast(script: str, user_session_id: str) -> Optional[str]:
    """
    Converte o script de texto em um arquivo de áudio MP3 usando a API TTS da OpenAI.
    Retorna o caminho relativo para o arquivo de áudio.
    """
    # Garante que o diretório para salvar os podcasts exista
    podcast_dir = Path(__file__).parent / "static/podcasts"
    podcast_dir.mkdir(parents=True, exist_ok=True)
    
    # Nomeia o arquivo de forma única usando o ID da sessão do usuário
    podcast_file_path = podcast_dir / f"resumo_{user_session_id}.mp3"

    print(f"[LOG][IA] Script enviado para TTS:\n{script}")
    try:
        response = client.audio.speech.create(
            model="tts-1",       # Modelo padrão, de alta qualidade
            voice="nova",        # Voz "nova" soa natural e clara em português
            input=script
        )
        print("[LOG][IA] Resposta recebida da OpenAI para TTS:")
        print(response)
        # Salva o fluxo de áudio diretamente no arquivo
        response.stream_to_file(podcast_file_path)
        
        # Retorna o caminho relativo para ser usado no template HTML
        return f"podcasts/resumo_{user_session_id}.mp3"
    except Exception as e:
        print(f"Erro ao gerar áudio com a API TTS da OpenAI: {e}")
        return None