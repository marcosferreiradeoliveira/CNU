# app.py

import json
import uuid
from flask import Flask, render_template, request, redirect, url_for

# Importa as funções do nosso módulo de serviços da OpenAI
from openai_services import gerar_questoes_ia, gerar_script_explicativo, gerar_podcast

app = Flask(__name__)

# Cache em memória para os simulados gerados.
# ATENÇÃO: Em uma aplicação real, use um banco de dados (como Redis para cache ou PostgreSQL para persistência)
# para não perder os dados quando o servidor reiniciar.
generated_simulados = {}

# Carregando os dados de configuração na inicialização do app
def load_data():
    with open('data/vagas.json', 'r', encoding='utf-8') as f:
        vagas = json.load(f)
    with open('data/perfis_bancas.json', 'r', encoding='utf-8') as f:
        perfis = json.load(f)
    return vagas, perfis

VAGAS, PERFIS_BANCAS = load_data()

# Função stub para registrar eventos de analytics
def log_analytics_event(event_name, properties):
    # Em um app real, aqui você integraria com Mixpanel, PostHog, Google Analytics, etc.
    print(f"[ANALYTICS] Evento: '{event_name}', Propriedades: {properties}")

@app.route('/')
def index():
    """Página inicial para seleção de vaga e banca."""
    log_analytics_event("page_view", {"page": "selecao_vaga"})
    return render_template('index.html', vagas=VAGAS, bancas=list(PERFIS_BANCAS.keys()))

@app.route('/gerar_simulado', methods=['POST'])
def gerar_simulado():
    """Recebe a seleção do usuário, gera as questões via IA e redireciona para o simulado."""
    id_vaga = request.form.get('id_vaga')
    banca_selecionada = request.form.get('banca')
    
    vaga_info = next((v for v in VAGAS if v['id'] == id_vaga), None)
    perfil_banca = PERFIS_BANCAS.get(banca_selecionada)

    if not vaga_info or not perfil_banca:
        return "Configuração de vaga ou banca inválida.", 400

    log_analytics_event("geracao_simulado_iniciada", {"vaga_id": id_vaga, "banca": banca_selecionada})
    
    simulado_completo = []
    num_questoes_por_disciplina = 3 # Ajuste conforme necessário

    for disciplina in vaga_info['disciplinas']:
        questoes_geradas = gerar_questoes_ia(disciplina, perfil_banca, num_questoes_por_disciplina)
        
        for i, q in enumerate(questoes_geradas):
            q['id'] = f"{disciplina.replace(' ', '_')}_{i}_{uuid.uuid4().hex[:6]}" # ID único para a questão
            q['disciplina'] = disciplina
            simulado_completo.append(q)
    
    if not simulado_completo:
        log_analytics_event("geracao_simulado_falhou", {"vaga_id": id_vaga, "banca": banca_selecionada})
        return "Houve uma falha ao gerar as questões do seu simulado. Por favor, tente novamente.", 500

    simulado_id = str(uuid.uuid4())
    # Salva o simulado junto com o id_vaga
    generated_simulados[simulado_id] = {
        'questoes': simulado_completo,
        'id_vaga': id_vaga
    }

    log_analytics_event("geracao_simulado_sucesso", {"vaga_id": id_vaga, "banca": banca_selecionada, "num_questoes": len(simulado_completo)})
    
    return redirect(url_for('simulado', simulado_id=simulado_id))

@app.route('/simulado/<simulado_id>')
def simulado(simulado_id):
    """Exibe a página do simulado com as questões geradas."""
    simulado_data = generated_simulados.get(simulado_id)
    if not simulado_data:
        return "Simulado não encontrado ou sessão expirada. Por favor, gere um novo simulado.", 404

    questoes = simulado_data['questoes']
    id_vaga = simulado_data['id_vaga']
    vaga = next((v for v in VAGAS if v['id'] == id_vaga), None)
    if vaga is None:
        vaga = {'titulo': 'Vaga não encontrada', 'id': ''}

    return render_template('simulado.html', questoes=questoes, simulado_id=simulado_id, vaga=vaga)

@app.route('/resultado', methods=['POST'])
def resultado():
    """Processa as respostas, calcula o resultado e gera o podcast de revisão."""
    respostas_usuario = request.form
    simulado_id = respostas_usuario.get('simulado_id')
    
    questoes_simulado = generated_simulados.get(simulado_id)
    if not questoes_simulado:
        return "Sua sessão do simulado expirou. Não foi possível carregar o resultado.", 404
        
    acertos = 0
    erros = []
    detalhes_resultado = []

    for questao in questoes_simulado:
        id_questao = questao['id']
        resposta_usuario = respostas_usuario.get(f"q-{id_questao}")
        resposta_correta = questao['resposta_correta']
        
        is_correct = (resposta_usuario == resposta_correta)
        
        if is_correct:
            acertos += 1
        else:
            erros.append({
                "disciplina": questao['disciplina'],
                "enunciado": questao['enunciado'],
                "resposta_usuario": resposta_usuario or "Não respondida",
                "resposta_correta": resposta_correta
            })
        
        detalhes_resultado.append({**questao, "resposta_usuario": resposta_usuario, "correta": is_correct})

    # --- Onde a Mágica do Podcast Acontece ---
    user_session_id = str(uuid.uuid4())
    script_podcast = gerar_script_explicativo(erros)
    caminho_podcast = gerar_podcast(script_podcast, user_session_id)
    
    log_analytics_event("simulado_finalizado", {
        "simulado_id": simulado_id,
        "score_percentual": round((acertos / len(questoes_simulado)) * 100, 2),
        "num_acertos": acertos,
        "num_erros": len(erros),
        "podcast_gerado_sucesso": bool(caminho_podcast)
    })
    
    # Opcional: Limpar o simulado da memória após o uso para economizar recursos
    if simulado_id in generated_simulados:
        del generated_simulados[simulado_id]

    return render_template(
        'resultado.html',
        acertos=acertos,
        total=len(questoes_simulado),
        detalhes=detalhes_resultado,
        caminho_podcast=caminho_podcast
    )

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)