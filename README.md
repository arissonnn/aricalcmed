# Drogas UTI/PS — Calculadora

Calculadora automática de ~26 fármacos de CTI/PS/Anestesia. Peso entra, lista sai.
Sem login, sem banco de dados, sem build. HTML + CSS + JS puro.

## Como rodar localmente

Só abrir o `index.html` no navegador (duplo clique). Não precisa de servidor,
não precisa de `npm install`, não precisa de nada — os scripts usam `<script>`
comuns (não `type="module"`) exatamente para funcionar direto do `file://`,
sem os problemas de CORS que módulos ES dão quando abertos localmente.

## Estrutura

```
drogas-uti/
├── index.html          ← estrutura da página
├── css/style.css        ← tema escuro + layout + estilos de impressão
└── js/
    ├── database.js       ← dados clínicos (doses, diluições, observações)
    ├── calculations.js   ← motor de cálculo (funções puras, testadas)
    ├── storage.js         ← localStorage (persistência offline)
    ├── render.js          ← desenha a tela
    ├── print.js           ← monta e imprime a folha A4
    └── app.js             ← liga tudo (estado + eventos)
```

Cada arquivo faz uma coisa só. Pra adicionar um fármaco novo, só mexe em
`database.js`. Pra mudar uma fórmula, só mexe em `calculations.js`. Nada
depende de bundler.

## Deploy no GitHub Pages (grátis, sem CI, sem timeout de build)

```bash
# 1. Criar o repositório no GitHub (via site ou gh CLI)
gh repo create drogas-uti --public --source=. --remote=origin

# 2. Commit e push
git init
git add .
git commit -m "Primeira versão da calculadora"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/drogas-uti.git
git push -u origin main

# 3. Ativar GitHub Pages
# No GitHub: Settings → Pages → Source: "Deploy from a branch" → Branch: main / (root)
```

A partir daí, todo `git push` atualiza o site sozinho em alguns segundos —
sem Vercel, sem build minutes, sem `vercel.json`.

## ⚠️ Sobre os dados clínicos

Os valores foram transcritos da sua spec original. Um ponto específico foi
sinalizado no próprio app: a diluição da **Noradrenalina** tem uma
inconsistência entre a seção 3.2 (250mL) e o exemplo da seção 8.5 da sua
spec (que parecia assumir 500mL). Segui a tabela principal (3.2), mas
**confira essa e as demais diluições contra o protocolo da sua instituição**
antes de usar com paciente real — isso vale pra qualquer conteúdo aqui.

Nomes comerciais estão marcados como "(genérico)" onde não tenho certeza
do nome de fantasia mais usado hoje — edite livremente em `database.js`.

## O que NÃO tem nesta v1 (de propósito)

- Login / conta de usuário / Supabase
- Modo pediátrico (idade é só informativa por enquanto)
- Fármacos customizados pelo usuário
- Modo de titulação fina (dose específica → mL/h específico)
- Tema claro

Todos esses são fáceis de adicionar depois, um de cada vez, exatamente
porque a arquitetura é modular — mas não entram agora pra manter o escopo
enxuto, como você pediu.

## Próximos passos sugeridos (nenhum obrigatório)

1. Testar em uso real por alguns plantões, ver o que incomoda
2. Adicionar campo de busca/filtro na lista de fármacos
3. Tema claro (toggle simples, variáveis CSS já preparadas)
4. Fármacos customizados (salvos no localStorage)
