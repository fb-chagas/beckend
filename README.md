# Calendário de Obras - Apps Script

Este repositório contém a primeira versão prática do Web App conectado à planilha
"Calendário de tarefas - Escritório 3M Agropecuária".

## Arquivos

- `Code.gs`: regras do Apps Script, cadastro/atualização de tarefas, status,
  painel de controle e preenchimento do calendário.
- `Index.html`: interface web com os quatro botões:
  - `➕ Nova Tarefa`
  - `✏️ Atualizar Tarefa`
  - `📆 Abrir Calendário`
  - `📊 Painel de Controle`
- `appsscript.json`: manifesto básico para o projeto Apps Script.

## Como aplicar

1. Abra a planilha no Google Sheets.
2. Acesse **Extensões > Apps Script**.
3. Substitua o conteúdo do arquivo `.gs` pelo conteúdo de `Code.gs`.
4. Crie/substitua o arquivo HTML `Index.html`.
5. Confirme o manifesto `appsscript.json`.
6. Publique como Web App.

## Regras implementadas

- Nova tarefa gera códigos automáticos no padrão `ATV-01`, `ATV-02`, etc.,
  sempre buscando o maior código existente.
- Cadastro de nova tarefa solicita atividade, responsável, previsão de início e
  previsão de fim.
- Atualização permite editar responsável, data início, data fim e observações.
- Status de prazo:
  - `No prazo` quando a data início for menor ou igual à previsão de início.
  - `Em atraso` quando a data início for maior que a previsão de início.
- Status geral:
  - `Não iniciado` quando não há data início.
  - `Em andamento` quando há data início e não há data fim.
  - `Concluído` quando a data fim for menor ou igual à previsão de fim.
  - `Atrasado` quando a data fim for maior que a previsão de fim.
- O botão de calendário abre diretamente a aba `Calendário` da planilha.
- O calendário usa a previsão de início/fim para exibir tarefas novas e passa a
  usar data início/fim reais quando elas forem preenchidas.
- O painel calcula total de tarefas, quantidades por status e percentual
  concluído.
