# MicroClima 360° 🌿

**Álgebra Linear aplicada à Internet das Coisas (IoT) e a redes de sensores ambientais.**

O **MicroClima 360°** é uma aplicação web interativa que permite explorar medições históricas de **temperatura** e **umidade relativa do ar** em três ambientes — **pasto, floresta secundária e floresta primária** — e compreender como operações com vetores e matrizes ajudam a comparar condições microclimáticas.

O projeto foi desenvolvido como demonstração acadêmica no contexto da **Universidade Federal Rural da Amazônia (UFRA)**. Sua proposta é aproximar conceitos de Álgebra Linear de dados obtidos por sensores ambientais, combinando análise exploratória, visualização e interação com o público.

> **Nota:** os dados incluídos são **históricos**, não leituras de sensores em tempo real. O aplicativo é um protótipo educacional, não uma plataforma de monitoramento operacional.

## Funcionalidades

- **Monitoramento interativo:** gráficos de temperatura e umidade relativa nos três ambientes.
- **Explorador microclimático:** seleção de dias, reprodução temporal das medições e navegação entre horários.
- **Comparações térmicas:** visualização das diferenças de temperatura e dos horários de maior e menor contraste entre pasto e floresta primária.
- **Laboratório matricial:** ajuste manual de temperaturas e demonstração passo a passo de uma transformação linear.
- **Desafio da feira:** três questões interativas com pontuação e explicações sobre os dados e a matemática.
- **Importação de CSV:** leitura de registros sincronizados no formato aceito pela API.
- **Modo feira:** interface ampliada, apropriada para demonstração em tela grande.

## Álgebra Linear na prática

Para cada instante com medições simultâneas, representamos as temperaturas por um vetor linha:

```text
T = [T_pasto, T_secundária, T_primária]
```

A transformação matricial é:

```text
                [ 1   1 ]
T × M,    M =   [-1   0 ]
                [ 0  -1 ]
```

O resultado é:

```text
[T_pasto − T_secundária,  T_pasto − T_primária]
```

**Exemplo ilustrativo:** para temperaturas de 34 °C no pasto, 30 °C na floresta secundária e 27 °C na floresta primária, a transformação retorna **[4, 7] °C**.

Assim, uma mesma operação matricial produz duas comparações ambientais de maneira organizada e reproduzível.

## Dados utilizados

Os dados históricos disponibilizados com o projeto foram obtidos de planilhas dos sensores **HOBO** nos três ambientes. O arquivo consolidado contém **8.340 registros simultâneos**, em intervalos de **5 minutos**, no período de **12/08/2026 às 08:25** a **10/09/2026 às 07:20**, conforme os horários registrados nas planilhas de origem.

A sincronização foi feita por correspondência exata dos horários, **sem interpolação**. As variáveis utilizadas são temperatura do ar (°C) e umidade relativa (%).

Arquivo: [`microclima-360/dados-reais/microclima_360_dados_reais_alinhados.csv`](microclima-360/dados-reais/microclima_360_dados_reais_alinhados.csv).

O aplicativo também possui um conjunto de dados simulados de demonstração, utilizado como alternativa caso o arquivo histórico não esteja disponível. A interface e a API identificam a origem dos dados.

## Tecnologias

| Camada | Tecnologias |
| --- | --- |
| Frontend | React, TypeScript, Vite |
| Interface e gráficos | CSS, Recharts, Lucide React |
| Backend | Python, FastAPI |
| Operações matemáticas | NumPy |
| Implantação | Vercel (serviços frontend e backend) |
| Versionamento | Git e GitHub |

## Estrutura do repositório

```text
MicroClima360/
├── README.md
├── vercel.json                  # Configuração multisserviços do Vercel
└── microclima-360/
    ├── frontend/
    │   ├── src/
    │   ├── public/
    │   ├── package.json
    │   └── vite.config.ts
    ├── backend/
    │   ├── app/
    │   │   └── main.py
    │   └── requirements.txt
    ├── api/
    │   └── index.py
    ├── dados-reais/
    │   └── microclima_360_dados_reais_alinhados.csv
    ├── package.json
    └── requirements.txt
```

## Executar localmente

**Pré-requisitos:** Python 3, Node.js e npm instalados.

Clone o repositório:

```bash
git clone https://github.com/jhoann7/MicroClima360.git
cd MicroClima360
```

### 1. Backend

Abra um terminal na pasta do repositório:

```bash
cd microclima-360/backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

A API estará disponível em **http://127.0.0.1:8000**; o endpoint de verificação é **http://127.0.0.1:8000/api/health**.

### 2. Frontend

Abra **outro terminal**, também a partir da raiz do repositório:

```bash
cd microclima-360/frontend
npm install
npm run dev
```

Acesse **http://127.0.0.1:5173**.

O servidor de desenvolvimento do Vite encaminha chamadas a `/api` para o FastAPI em `http://127.0.0.1:8000`.

Para verificar a compilação do frontend:

```bash
npm run build
```

## API

| Método | Rota | Finalidade |
| --- | --- | --- |
| `GET` | `/api/health` | Verificar o status da API e a origem dos dados |
| `GET` | `/api/measurements` | Retornar as séries temporais e a matriz de transformação |
| `POST` | `/api/lab/calculate` | Calcular as diferenças térmicas a partir de três temperaturas |
| `POST` | `/api/data/import` | Importar registros sincronizados via CSV |
| `DELETE` | `/api/data/import` | Restaurar o conjunto de dados padrão |

A API aceita importação de CSV com as colunas:

```csv
timestamp,temp_pasto,temp_secundaria,temp_primaria,rh_pasto,rh_secundaria,rh_primaria
```

As datas devem estar em formato ISO, por exemplo `2026-08-20T12:00:00`. Um arquivo-modelo está disponível em `microclima-360/frontend/public/modelo_microclima.csv`.

> **Limitação da importação online:** os registros enviados via API são mantidos somente em memória no processo Python. Em execução serverless, como no Vercel, esse estado pode ser perdido ou variar entre instâncias; portanto, **a importação não é persistente nem isolada por usuário**. Para uma demonstração pública confiável, utilize os dados históricos já incluídos no projeto.

## Implantação no Vercel

O repositório utiliza a configuração **multisserviços** em [`vercel.json`](vercel.json), na **raiz do GitHub**:

- **`frontend`**: serviço Vite em `microclima-360/frontend`, acessível pela rota pública `/`.
- **`backend`**: serviço FastAPI em `microclima-360`, com entrada `backend.app.main:app`, acessível pelas rotas `/api/*`.

Para implantar, importe este repositório no [Vercel](https://vercel.com/new), mantenha o diretório raiz do projeto em `./` e utilize a configuração de serviços definida no `vercel.json`. Após a implantação, verifique a página inicial e `/api/health`.

## Limitações e próximos passos

- Os registros são **históricos**, mesmo quando reproduzidos em sequência no explorador.
- A importação de CSV ainda não possui armazenamento persistente.
- O aplicativo é destinado principalmente a fins **didáticos e demonstrativos**.
- Evoluções possíveis incluem persistência de dados, testes automatizados, melhorias de acessibilidade e suporte a novos tipos de sensores.

## Contexto acadêmico

Projeto acadêmico associado à **UFRA**, voltado à demonstração de aplicações de **Álgebra Linear, IoT e redes de sensores** na análise de condições ambientais.

---

Desenvolvido para tornar a matemática mais acessível por meio de dados ambientais e interação visual.
