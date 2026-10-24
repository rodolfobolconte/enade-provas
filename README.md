# Sistema ENADE de Questões

Aplicação web para simular provas objetivas do ENADE, permitindo que o usuário escolha uma prova, responda as questões, valide as respostas e veja o resultado com acertos, erros e gabarito.

## Funcionalidades

- Seleção de prova disponível
- Respostas de múltipla escolha (A a E)
- Validação automática de respostas
- Cálculo de acertos, erros e questões sem resposta
- Visualização do gabarito das questões objetivas
- Suporte para provas do ENADE disponíveis na pasta `Provas`
- Ignora questões discursivas

## Estrutura do projeto

```text
Sistema ENADE de Questões/
├── Provas/                       # PDFs das provas e gabaritos
├── app/                         # Aplicação Next.js
│   ├── app/
│   ├── data/
│   └── package.json
├── scripts/
│   └── generate_enade_data.py   # Script para gerar dados dos gabaritos
├── README.md
└── package-lock.json
```

## Requisitos

- Node.js 18+
- npm
- Python 3.10+

## Instalação

1. Acesse a pasta do projeto:

```bash
cd "c:/Users/rodolfo/Downloads/Sistema ENADE de Questões"
```

2. Entre na pasta da aplicação:

```bash
cd app
```

3. Instale as dependências do projeto:

```bash
npm install
```

4. Instale a biblioteca Python necessária para leitura dos PDFs:

```bash
python -m pip install pypdf
```

## Geração dos dados do ENADE

O projeto já inclui um dataset com provas e gabaritos pré-gerados em `app/data/enade-data.json`.

Se você quiser regenerar esse arquivo a partir dos PDFs da pasta `Provas`, execute:

```bash
cd "c:/Users/rodolfo/Downloads/Sistema ENADE de Questões"
python scripts/generate_enade_data.py
```

Esse script:

- busca os arquivos com `_PV_` e `_GB_`
- emparelha cada prova ao respectivo gabarito
- extrai as respostas objetivas
- salva os dados em `app/data/enade-data.json`

## Execução da aplicação

Dentro da pasta `app`:

```bash
npm run dev -- --hostname 0.0.0.0
```

Depois abra no navegador:

```text
http://localhost:3000
```

## Build de produção

Para gerar a versão pronta para produção:

```bash
cd "c:/Users/rodolfo/Downloads/Sistema ENADE de Questões/app"
npm run build
```

Para iniciar a versão compilada:

```bash
npm run start -- --hostname 0.0.0.0
```

## Como usar a plataforma

1. Abra a aplicação no navegador.
2. Escolha a prova desejada na lista suspensa.
3. Marque as respostas das questões objetivas.
4. Clique em "Validar respostas".
5. Veja:
   - quantidade de acertos
   - quantidade de erros
   - quantidade de questões sem resposta
   - desempenho em percentual
   - gabarito das questões

## Observações importantes

- Apenas questões objetivas são consideradas na avaliação.
- Questões discursivas são ignoradas intencionalmente.
- O sistema depende dos PDFs presentes na pasta `Provas` para gerar e validar os resultados.

## Troubleshooting

### Erro ao instalar dependências
Certifique-se de ter o Node.js e npm instalados corretamente:

```bash
node -v
npm -v
```

### Erro ao executar o script Python
Verifique se o `pypdf` foi instalado:

```bash
python -m pip show pypdf
```

### Aplicação não abre no navegador
Confirme se o servidor está em execução e se a porta `3000` está livre:

```bash
npm run dev -- --hostname 0.0.0.0
```

## Licença

Projeto desenvolvido para uso educacional e simulado de questões do ENADE.
