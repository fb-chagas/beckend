# Fluxograma de Investimentos — 3M AGROPECUÁRIA

Arquivos editáveis do fluxograma de investimentos.

## Arquivos

| Arquivo | Uso |
|---|---|
| `fluxograma-investimentos.html` | Abra no navegador, clique nos campos e preencha. Pode imprimir ou salvar em PDF. |
| `fluxograma-investimentos.xlsx` | Abra no Excel, LibreOffice ou Google Sheets e edite as células. |
| `fluxograma-investimentos.png` | Imagem de referência/visualização. |
| `logo-3m-agropecuaria.svg` | Logo em vetor (substitua pelo arquivo oficial, se preferir). |
| `logo-3m-agropecuaria.png` | Logo rasterizada usada na planilha e na imagem. |

## Substituir pela logo oficial

1. Salve a logo enviada como `logo-3m-agropecuaria.png` nesta pasta (substituindo o arquivo atual).
2. Execute:
   ```bash
   python3 gerar_planilha.py
   python3 gerar_imagem.py
   ```
3. No HTML, a logo é carregada de `logo-3m-agropecuaria.svg`. Para usar só o PNG, troque a tag `<img>` em `fluxograma-investimentos.html` para apontar para o `.png`.

## Estrutura

Três divisões, cada uma com linhas de investimento e colunas **Valor**, **Status** e **Prioridade**:

1. Investimentos em Andamento
2. Investimentos Previstos com Orçamento
3. Investimentos Previstos sem Orçamento
