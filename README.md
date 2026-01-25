# 📣 Participa DF Lite

> **Versão Ouro (Release Candidate 1.0.0)**
> Uma solução de Ouvidoria Cidadã Offline-First, Acessível e Integrada.

![Status](https://img.shields.io/badge/Status-Conclu%C3%ADdo-success)
![Python](https://img.shields.io/badge/Backend-FastAPI-blue)
![Frontend](https://img.shields.io/badge/Frontend-Vanilla%20JS-yellow)
![PWA](https://img.shields.io/badge/Plataforma-PWA-purple)

---

## 🎯 Visão Geral

O **Participa DF Lite** é uma aplicação web progressiva (PWA) desenvolvida para modernizar o acesso à Ouvidoria do Governo do Distrito Federal (162). 

Focada na experiência do cidadão, a solução elimina barreiras de conectividade e complexidade, permitindo o registro de manifestações em **3 cliques**, com suporte total a funcionamento **Offline**, acessibilidade nativa e proteção de dados (LGPD).

### 🚀 Diferenciais Competitivos
1.  **Zero Barreiras:** Não exige download na loja de apps (PWA) e roda em qualquer celular.
2.  **Offline-First:** Funciona em zonas de sombra (sem 4G). Sincroniza automaticamente quando a rede volta.
3.  **Inclusão Real:** Painel de acessibilidade nativo (Dislexia, Contraste, Régua de Leitura) sem plugins pesados.
4.  **Inteligência de Negócio:** Suporta tanto Zeladoria Urbana (com GPS) quanto Ouvidoria Geral (sem GPS).

---

## 🛠️ Stack Tecnológico

Escolhemos uma arquitetura **"Low-Overhead"** para garantir desempenho máximo e facilidade de manutenção pelo GDF.

| Camada | Tecnologia | Justificativa |
| :--- | :--- | :--- |
| **Backend** | **Python + FastAPI** | Alta performance (ASGI), tipagem forte e documentação automática. |
| **Frontend** | **HTML5 + CSS3 + JS (Vanilla)** | Carregamento instantâneo, sem "builds" complexos, fácil manutenção. |
| **Mapas** | **Leaflet + OpenStreetMap** | Solução leve, gratuita e com suporte a cache offline. |
| **Dados** | **JSON + Memória** | Interoperabilidade total com sistemas legados (importação via JSON). |
| **Offline** | **Service Workers + IndexedDB** | Persistência local robusta e sincronização em background. |

---

## 📂 Estrutura do Projeto

```text
/participa-df-lite
│── main.py              # API Server (FastAPI)
│── index.html           # Interface do Usuário (SPA)
│── style.css            # Estilos (Responsivo + Acessibilidade)
│── app.js               # Lógica (Mapa, Offline, Sync)
│── sw.js                # Service Worker (Motor Offline)
│── manifest.json        # Configuração PWA
│── requirements.txt     # Dependências Python
│
├── /libs                # Dependências Locais (Leaflet)
└── /uploads             # Armazenamento de Arquivos e JSONs

```

---

## ⚡ Guia de Instalação e Execução

Siga os passos abaixo para rodar o projeto em ambiente local.

### Pré-requisitos

* Python 3.8 ou superior.
* Git (opcional).

### 1. Clonar e Preparar

```bash
# Clone o repositório (ou extraia o zip)
git clone [https://github.com/seu-usuario/participa-df-lite.git](https://github.com/seu-usuario/participa-df-lite.git)
cd participa-df-lite

# Crie um ambiente virtual (Recomendado)
python -m venv venv

# Ative o ambiente
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

```

### 2. Instalar Dependências

```bash
pip install -r requirements.txt

```

*(Certifique-se de que o arquivo `requirements.txt` contém: `fastapi`, `uvicorn`, `python-multipart`, `httpx`, `pydantic`)*

### 3. Rodar a Aplicação

```bash
python main.py

```

O servidor iniciará em: `http://0.0.0.0:8000`

---

## 📱 Como Testar

### No Computador

Acesse **`http://localhost:8000`** no seu navegador (Chrome/Edge recomendados).

### No Celular (Rede Local)

Para testar a câmera e o GPS real:

1. Descubra o IP do seu computador (ex: `192.168.1.15`).
2. Conecte o celular na mesma rede Wi-Fi.
3. Acesse `http://SEU_IP:8000`.

> **Nota:** Para testar a funcionalidade de instalação (PWA) e GPS preciso no celular via IP local, pode ser necessário configurar flags de segurança no navegador ou usar `https` (tunneling como ngrok), pois navegadores modernos restringem APIs poderosas em HTTP (exceto localhost).

---

## ✅ Matriz de Conformidade (Edital)

| Critério | Solução Entregue |
| --- | --- |
| **Inovação** | Arquitetura PWA moderna; IA de privacidade no Front (Edge Computing). |
| **Usabilidade** | Interface limpa; Botões na "Thumb Zone"; Fluxo de 3 passos. |
| **Acessibilidade** | Menu WCAG completo (Dislexia, Contraste, Fontes); Navegação por teclado. |
| **Viabilidade** | Tecnologias Open Source (Custo Zero de licença); Código limpo e documentado. |
| **Interoperabilidade** | Exportação de dados em padrão aberto (`.json`) para integração com OUV-DF. |

---

## 🔮 Próximos Passos (Roadmap)

1. **Integração OUV-DF:** Conectar a saída JSON ao endpoint SOAP/REST do sistema oficial.
2. **IA de Triagem:** Implementar classificação automática de imagens no Backend.
3. **Login Gov.br:** Adicionar autenticação opcional para acompanhamento via e-mail.

---

<div align="center">
<sub>Desenvolvido com 💙 para o Hackathon GDF.</sub>
</div>

