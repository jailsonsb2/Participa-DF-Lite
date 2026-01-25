import logging
import shutil
import os
import uuid
import json  # Importante para interoperabilidade
import httpx 
from datetime import datetime
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional

# --- CONFIGURAÇÃO DE LOGS ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ParticipaDF")

# --- IMPORTAÇÃO DA IA (COM FALLBACK) ---
try:
    from main_desafio_1 import DataProtector
    protector = DataProtector()
    logger.info("Módulo de IA carregado.")
except ImportError:
    logger.warning("IA não encontrada. Rodando em modo simulação.")
    class DataProtector:
        def analyze_text(self, text):
            return {"has_data": False, "types": [], "classification": "Público"}
    protector = DataProtector()

# --- INICIALIZAÇÃO DA API ---
app = FastAPI(title="Participa DF Lite")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuração de pastas
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# --- FUNÇÃO PARA CARREGAR DADOS DO DISCO (NOVIDADE) ---
def carregar_banco_de_dados():
    """Lê todos os JSONs da pasta uploads e recria a lista em memória."""
    lista_recuperada = []
    
    if not os.path.exists(UPLOAD_DIR):
        return []

    # Varre a pasta
    for nome_arquivo in os.listdir(UPLOAD_DIR):
        if nome_arquivo.endswith(".json"):
            caminho_completo = os.path.join(UPLOAD_DIR, nome_arquivo)
            try:
                with open(caminho_completo, "r", encoding="utf-8") as f:
                    dados = json.load(f)
                    lista_recuperada.append(dados)
            except Exception as e:
                logger.error(f"Erro ao ler o arquivo {nome_arquivo}: {e}")

    # Ordena: Mais recente primeiro (Para o topo da lista no App)
    try:
        lista_recuperada.sort(
            key=lambda x: datetime.strptime(x["data_criacao"], "%d/%m/%Y %H:%M"), 
            reverse=True
        )
    except Exception as e:
        logger.warning(f"Erro ao ordenar por data (pode haver datas antigas/inválidas): {e}")

    logger.info(f"Banco de dados restaurado: {len(lista_recuperada)} registros encontrados.")
    return lista_recuperada

# Inicializa o banco lendo os arquivos
db_manifestacoes = carregar_banco_de_dados()

# --- MODELOS ---
class AnaliseRequest(BaseModel):
    texto: str

# --- ENDPOINTS ---

@app.post("/api/validar-privacidade")
async def validar_texto(request: AnaliseRequest):
    """Analisa o texto em busca de dados pessoais (LGPD)."""
    resultado = protector.analyze_text(request.texto)
    return {"contem_dados": resultado["has_data"], "tipos": resultado["types"]}

@app.get("/api/buscar-endereco")
async def buscar_endereco(q: str):
    """Proxy para Nominatim com restrição de área (DF)."""
    url = "https://nominatim.openstreetmap.org/search"
    params = {
        "q": q,
        "format": "json",
        "limit": 1,
        "viewbox": "-48.28,-16.05,-47.30,-15.50", # BBox do DF
        "bounded": 1
    }
    headers = {"User-Agent": "ParticipaDF-Hackathon/1.0"}
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, params=params, headers=headers)
            return response.json()
        except Exception as e:
            logger.error(f"Erro na busca: {e}")
            return []

@app.post("/api/enviar-manifestacao")
async def enviar_manifestacao(
    descricao: str = Form(...),
    tipo: str = Form(...),
    latitude: str = Form(...),
    longitude: str = Form(...),
    anonimo: bool = Form(False),
    foto: Optional[UploadFile] = File(None)
):
    """Recebe a manifestação, salva arquivos e gera protocolo."""
    protocolo = str(uuid.uuid4())[:8].upper()
    data_hora = datetime.now().strftime("%d/%m/%Y %H:%M")
    
    # 1. Tratamento de Arquivo
    url_arquivo = None
    if foto:
        ext = foto.filename.split('.')[-1]
        nome_arquivo = f"{protocolo}.{ext}"
        caminho_completo = os.path.join(UPLOAD_DIR, nome_arquivo)
        
        with open(caminho_completo, "wb") as buffer:
            shutil.copyfileobj(foto.file, buffer)
        url_arquivo = f"uploads/{nome_arquivo}"

    # 2. Criação do Objeto
    manifestacao = {
        "protocolo": protocolo,
        "data_criacao": data_hora,
        "tipo_ocorrencia": tipo,
        "descricao": descricao,
        "localizacao": {
            "lat": float(latitude),
            "lng": float(longitude)
        },
        "identificacao": "Anônimo" if anonimo else "Identificado",
        "anexo": url_arquivo
    }
    
    # 3. Interoperabilidade: Salva um JSON físico
    caminho_json = os.path.join(UPLOAD_DIR, f"{protocolo}.json")
    with open(caminho_json, "w", encoding='utf-8') as f:
        json.dump(manifestacao, f, ensure_ascii=False, indent=4)

    # 4. Salva na memória e no topo da lista
    db_manifestacoes.insert(0, manifestacao)
    
    logger.info(f"Nova manifestação: {protocolo}")
    return {"status": "sucesso", "protocolo": protocolo}

@app.get("/api/minhas-manifestacoes")
async def listar():
    return db_manifestacoes

if __name__ == "__main__":
    import uvicorn
    # Rodar em 0.0.0.0 para acesso externo (celular)
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)