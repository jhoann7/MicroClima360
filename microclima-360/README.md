# MicroClima 360°

Dashboard interativo com dados históricos sincronizados de sensores HOBO em três ambientes (pasto, floresta secundária e floresta primária), laboratório de Álgebra Linear e desafio para visitantes.

## O que mudou

- Removida a apresentação guiada, o roteiro e os atalhos correspondentes.
- Preservado o **Modo feira** (amplia o painel).
- Configurado o deploy no **Vercel**: frontend React/Vite e API Python/FastAPI no mesmo domínio.
- Dados históricos em `dados-reais/` incluídos no deploy da função Python.

## Executar localmente

**Terminal 1:**

```powershell
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

**Terminal 2 (na raiz do projeto):**

```powershell
npm install --prefix frontend
npm run dev
```

Abra http://127.0.0.1:5173. O Vite encaminha `/api` para http://127.0.0.1:8000.

## Publicar no GitHub

1. Crie um repositório vazio no GitHub, por exemplo `microclima-360`.
2. No terminal **na raiz** deste projeto:

```powershell
git init
git add .
git commit -m "Preparar MicroClima 360 para GitHub e Vercel"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/microclima-360.git
git push -u origin main
```

Se `git remote add origin` informar que já existe, use `git remote set-url origin URL`. Não publique arquivos `.env`, credenciais ou dados sensíveis.

## Publicar no Vercel

1. Entre no Vercel, escolha **Add New → Project**, importe o repositório GitHub.
2. Mantenha **Root Directory** na raiz do repositório (não selecione `frontend`).
3. O arquivo `vercel.json` define o comando de instalação, build, pasta `frontend/dist` e roteamento da API Python.
4. Clique em **Deploy**.
5. Após o deploy, confira `https://SEU_PROJETO.vercel.app/api/health` e a página inicial.

**Importante sobre a importação CSV online:** o endpoint atual armazena arquivos importados apenas em memória Python. Em ambiente serverless (Vercel), instâncias diferentes não compartilham memória e podem ser reiniciadas a qualquer momento. Portanto, a importação online **não é persistente nem confiável entre requisições**; use o conjunto histórico incluído no projeto para demonstrações públicas. Para importação persistente, será necessário armazenamento externo e isolamento por usuário.

**Observação:** os dados históricos vêm das planilhas originais e não são telemetria em tempo real. Os horários correspondem aos valores registrados nos arquivos, sem inferência de fuso horário.

## Estrutura

- `frontend/`: React, Vite, dashboard, laboratório e desafio.
- `backend/`: FastAPI e operações NumPy.
- `api/index.py`: entrada da função Python no Vercel.
- `dados-reais/`: CSV histórico alinhado.
- `vercel.json`: configuração do deploy.
