import json
import uuid
from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin
import sys

from openai_services import gerar_questoes_ia, gerar_script_explicativo, gerar_podcast

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": [
    "https://cnu-datempo.web.app",
    "https://cnu-datempo.firebaseapp.com",
    "http://localhost:5173",
    "http://localhost:8080"
]}}, supports_credentials=True) 

# --- CARREGANDO OS DADOS NA INICIALIZAÇÃO ---
def load_json_data(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

PERFIS_BANCAS = load_json_data('data/perfis_bancas.json')
VAGAS = load_json_data('data/vagas.json')
EIXOS = load_json_data('data/eixos.json')
BLOCOS = load_json_data('data/blocos.json')

# --- NOVAS ROTAS PARA SERVIR OS DADOS ---



@app.route('/api/vagas', methods=['GET'])
def get_vagas():
    # Pega o argumento 'bloco_id' da URL
    bloco_id_filtro = request.args.get('bloco_id')
    
    if bloco_id_filtro:
        # Filtra a lista de vagas se o parâmetro for fornecido
        vagas_filtradas = [vaga for vaga in VAGAS if vaga['bloco_id'] == bloco_id_filtro]
        return jsonify(vagas_filtradas)
    
    # Retorna todas as vagas se nenhum filtro for aplicado
    return jsonify(VAGAS)

@app.route('/api/eixos', methods=['GET'])
def get_eixos():
    return jsonify(EIXOS)

@app.route('/api/blocos', methods=['GET'])
def get_blocos():
    return jsonify(BLOCOS)

# --- ROTAS EXISTENTES (GERAÇÃO DE SIMULADO E PODCAST) ---

@app.route('/api/gerar-simulado', methods=['POST'])
def api_gerar_simulado():
    print('Recebida requisição para gerar simulado', file=sys.stderr)
    data = request.get_json()
    print(f'Dados recebidos: {data}', file=sys.stderr)
    if not data:
        print('Requisição inválida: sem dados', file=sys.stderr)
        return jsonify({"error": "Requisição inválida"}), 400

    banca = data.get('banca', 'FGV')
    disciplinas = data.get('disciplinas', [])
    num_questoes_por_disciplina = data.get('num_questoes_por_disciplina', 2)
    print(f'Banca: {banca}, Disciplinas: {disciplinas}, Num questões: {num_questoes_por_disciplina}', file=sys.stderr)
    
    perfil_banca = PERFIS_BANCAS.get(banca)
    if not perfil_banca:
        print(f'Perfil da banca {banca} não encontrado', file=sys.stderr)
        return jsonify({"error": f"Perfil da banca '{banca}' não encontrado."}), 404

    simulado_completo = []
    for disciplina in disciplinas:
        print(f'Gerando questões para disciplina: {disciplina}', file=sys.stderr)
        questoes_geradas = gerar_questoes_ia(disciplina, perfil_banca, num_questoes_por_disciplina)
        print(f'Questões geradas: {questoes_geradas}', file=sys.stderr)
        for q in questoes_geradas:
            q['id'] = str(uuid.uuid4())
            # Encontra o nome completo do eixo para associar à questão
            nome_eixo = next((e['nome'] for e in EIXOS if e['id'] == disciplina), disciplina)
            q['eixo'] = nome_eixo 
            simulado_completo.append(q)
    
    if not simulado_completo:
        print('Falha ao gerar questões com a IA', file=sys.stderr)
        return jsonify({"error": "Falha ao gerar questões com a IA."}), 500
        
    print(f'Simulado completo gerado: {simulado_completo}', file=sys.stderr)
    return jsonify(simulado_completo)

@app.route('/api/gerar-podcast', methods=['POST'])
def api_gerar_podcast():
    data = request.get_json()
    if not data or 'erros' not in data:
        return jsonify({"error": "Dados de erros não fornecidos"}), 400
    
    erros = data['erros']
    session_id = str(uuid.uuid4())
    script_podcast = gerar_script_explicativo(erros)
    caminho_podcast = gerar_podcast(script_podcast, session_id)

    if not caminho_podcast:
        return jsonify({"error": "Falha ao gerar o arquivo de podcast."}), 500

    url_completa_podcast = f"http://127.0.0.1:5000/static/{caminho_podcast}"
    
    return jsonify({"podcastUrl": url_completa_podcast})

@app.errorhandler(500)
@cross_origin()
def internal_error(error):
    return jsonify({"error": "Internal Server Error"}), 500


if __name__ == '__main__':
    app.run(host="0.0.0.0", port=8080)