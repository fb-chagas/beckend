// ============================================================
// CALENDARIO DE OBRA - Apps Script
// ============================================================

var CALENDARIO_URL = "https://docs.google.com/spreadsheets/d/1hmlCTFOWXL3kTunJ1284mLC7dBIyhmZfjD7nP4o8kdU/edit?gid=1692204366#gid=1692204366";
var LISTA_SHEET_NAME = "Lista de Tarefas";
var CALENDARIO_SHEET_NAME = "Calendário";
var FIRST_TASK_ROW = 3;
var LAST_TASK_ROW = 102;

var RESPONSAVEIS = [
  {nome: "Ana Carolina Ferreira", fundo: "#D6F0FB", texto: "#0C5E7A"},
  {nome: "Breno Caçula",          fundo: "#FFF2CC", texto: "#7F6000"},
  {nome: "Danilo Henrique",       fundo: "#D6E4F7", texto: "#1A56A0"},
  {nome: "Heitor Salmazi",        fundo: "#E2D6F0", texto: "#4C1481"},
  {nome: "Isabela Muniz",         fundo: "#FDE8F0", texto: "#9C2762"},
  {nome: "José Aurélio",          fundo: "#D6EDD6", texto: "#1E5C1E"},
  {nome: "Maria Beatriz",         fundo: "#FFD7D7", texto: "#C00000"},
  {nome: "Natália Fonseca",       fundo: "#FCE4D6", texto: "#833C00"},
  {nome: "Rosielli Montanha",     fundo: "#E2EFD9", texto: "#375623"},
  {nome: "Talita Santos",         fundo: "#F0E6DA", texto: "#6B3A1F"}
];

var MESES_CAL = [
  {ano: 2026, mes: 6},
  {ano: 2026, mes: 7},
  {ano: 2026, mes: 8},
  {ano: 2026, mes: 9},
  {ano: 2026, mes: 10},
  {ano: 2026, mes: 11},
  {ano: 2026, mes: 12}
];

// ─────────────────────────────────────────────

function acionadorEdicao(e) {
  try {
    var sheetName = e.range.getSheet().getName();

    if (sheetName === LISTA_SHEET_NAME) {
      atualizarStatusDaLista();
      colorirLista();
      preencherCalendario();
    }
  } catch (err) {
    Logger.log("Erro acionador: " + err.message);
  }
}

function executarTudo() {
  atualizarStatusDaLista();
  colorirLista();
  preencherCalendario();
}

// ─────────────────────────────────────────────
// WEB APP
// ─────────────────────────────────────────────

function doGet() {
  return HtmlService
    .createHtmlOutputFromFile("Index")
    .setTitle("Calendário de Obras")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function listarResponsaveis() {
  return RESPONSAVEIS.map(function(r) {
    return r.nome;
  });
}

function obterConfiguracaoApp() {
  return {
    responsaveis: listarResponsaveis(),
    calendarioUrl: CALENDARIO_URL
  };
}

function listarTarefas() {
  var sheet = getListaSheet_();
  var values = sheet
    .getRange(FIRST_TASK_ROW, 1, LAST_TASK_ROW - FIRST_TASK_ROW + 1, 10)
    .getValues();
  var displayValues = sheet
    .getRange(FIRST_TASK_ROW, 1, LAST_TASK_ROW - FIRST_TASK_ROW + 1, 10)
    .getDisplayValues();

  var tarefas = [];

  values.forEach(function(row, i) {
    var display = displayValues[i];

    if (!normalizar(row[0]) && !normalizar(row[1])) return;

    tarefas.push({
      linha: FIRST_TASK_ROW + i,
      codigo: normalizar(display[0]),
      atividade: normalizar(display[1]),
      responsavel: normalizar(display[2]),
      previsaoInicio: display[3],
      dataInicio: display[4],
      statusPrazo: display[5],
      previsaoFim: display[6],
      dataFim: display[7],
      status: display[8],
      observacoes: display[9],
      previsaoInicioInput: formatDateForInput_(row[3]),
      dataInicioInput: formatDateForInput_(row[4]),
      previsaoFimInput: formatDateForInput_(row[6]),
      dataFimInput: formatDateForInput_(row[7])
    });
  });

  return tarefas;
}

function criarTarefa(payload) {
  var lock = LockService.getDocumentLock();
  lock.waitLock(30000);

  try {
    payload = payload || {};

    var atividade = normalizar(payload.atividade);
    var responsavel = normalizar(payload.responsavel);
    var previsaoInicio = parseDate(payload.previsaoInicio);
    var previsaoFim = parseDate(payload.previsaoFim);

    if (!atividade) throw new Error("Informe a atividade.");
    validarResponsavel_(responsavel);
    if (!previsaoInicio) throw new Error("Informe a previsão de data de início.");
    if (!previsaoFim) throw new Error("Informe a previsão de data de fim.");
    if (previsaoFim < previsaoInicio) {
      throw new Error("A previsão de data de fim não pode ser anterior à previsão de início.");
    }

    var sheet = getListaSheet_();
    var row = encontrarProximaLinhaVazia_(sheet);
    var codigo = gerarProximoCodigo_(sheet);

    sheet.getRange(row, 1, 1, 10).setValues([[
      codigo,
      atividade,
      responsavel,
      previsaoInicio,
      "",
      "",
      previsaoFim,
      "",
      "Não iniciado",
      ""
    ]]);

    formatarLinhaTarefa_(sheet, row);
    executarTudo();

    return {
      ok: true,
      mensagem: "Tarefa " + codigo + " criada com sucesso.",
      codigo: codigo,
      tarefas: listarTarefas(),
      painel: obterPainelControle()
    };
  } finally {
    lock.releaseLock();
  }
}

function atualizarTarefa(payload) {
  payload = payload || {};

  var codigo = normalizar(payload.codigo);
  var responsavel = normalizar(payload.responsavel);
  var dataInicio = parseDate(payload.dataInicio);
  var dataFim = parseDate(payload.dataFim);
  var observacoes = payload.observacoes === null || payload.observacoes === undefined
    ? ""
    : payload.observacoes.toString().trim();

  if (!codigo) throw new Error("Selecione uma tarefa para atualizar.");
  validarResponsavel_(responsavel);

  var sheet = getListaSheet_();
  var row = encontrarLinhaPorCodigo_(sheet, codigo);

  if (!row) throw new Error("Tarefa " + codigo + " não encontrada.");

  var previsaoInicio = parseDate(sheet.getRange(row, 4).getValue());
  var previsaoFim = parseDate(sheet.getRange(row, 7).getValue());

  if (dataInicio && dataFim && dataFim < dataInicio) {
    throw new Error("A data fim não pode ser anterior à data início.");
  }

  var status = calcularStatus_(previsaoInicio, dataInicio, previsaoFim, dataFim);

  sheet.getRange(row, 3).setValue(responsavel);
  sheet.getRange(row, 5).setValue(dataInicio || "");
  sheet.getRange(row, 6).setValue(status.statusPrazo);
  sheet.getRange(row, 8).setValue(dataFim || "");
  sheet.getRange(row, 9).setValue(status.statusGeral);
  sheet.getRange(row, 10).setValue(observacoes);

  formatarLinhaTarefa_(sheet, row);
  executarTudo();

  return {
    ok: true,
    mensagem: "Tarefa " + codigo + " atualizada com sucesso.",
    tarefas: listarTarefas(),
    painel: obterPainelControle()
  };
}

function obterPainelControle() {
  var tarefas = listarTarefas();
  var painel = {
    total: tarefas.length,
    naoIniciado: 0,
    emAndamento: 0,
    atrasado: 0,
    concluido: 0,
    percentualConcluido: 0
  };

  tarefas.forEach(function(tarefa) {
    var status = normalizar(tarefa.status);

    if (status === "Não iniciado") painel.naoIniciado++;
    if (status === "Em andamento") painel.emAndamento++;
    if (status === "Atrasado") painel.atrasado++;
    if (status === "Concluído") painel.concluido++;
  });

  if (painel.total > 0) {
    painel.percentualConcluido = Math.round((painel.concluido / painel.total) * 100);
  }

  return painel;
}

// ─────────────────────────────────────────────
// REGRAS DE STATUS E CODIGO
// ─────────────────────────────────────────────

function gerarProximoCodigo_(sheet) {
  var codigos = sheet
    .getRange(FIRST_TASK_ROW, 1, LAST_TASK_ROW - FIRST_TASK_ROW + 1, 1)
    .getDisplayValues();
  var maior = 0;

  codigos.forEach(function(row) {
    var match = normalizar(row[0]).match(/^ATV-(\d+)$/i);
    if (!match) return;
    maior = Math.max(maior, parseInt(match[1], 10));
  });

  return "ATV-" + padNumber_(maior + 1, 2);
}

function atualizarStatusDaLista() {
  var sheet = getListaSheet_();
  var values = sheet
    .getRange(FIRST_TASK_ROW, 1, LAST_TASK_ROW - FIRST_TASK_ROW + 1, 10)
    .getValues();

  values.forEach(function(row, i) {
    if (!normalizar(row[0]) && !normalizar(row[1])) return;

    var status = calcularStatus_(
      parseDate(row[3]),
      parseDate(row[4]),
      parseDate(row[6]),
      parseDate(row[7])
    );

    sheet.getRange(FIRST_TASK_ROW + i, 6).setValue(status.statusPrazo);
    sheet.getRange(FIRST_TASK_ROW + i, 9).setValue(status.statusGeral);
  });
}

function calcularStatus_(previsaoInicio, dataInicio, previsaoFim, dataFim) {
  var statusPrazo = "";
  var statusGeral = "Não iniciado";

  if (dataInicio && previsaoInicio) {
    statusPrazo = dataInicio <= previsaoInicio ? "No prazo" : "Em atraso";
    statusGeral = "Em andamento";
  }

  if (dataFim && previsaoFim) {
    statusGeral = dataFim <= previsaoFim ? "Concluído" : "Atrasado";
  }

  return {
    statusPrazo: statusPrazo,
    statusGeral: statusGeral
  };
}

// ─────────────────────────────────────────────
// COLORIR LISTA
// ─────────────────────────────────────────────

function colorirLista() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var listSheet = ss.getSheetByName(LISTA_SHEET_NAME);

  if (!listSheet) return;

  var coresMap = criarMapaCores_();
  var dados = listSheet.getRange("B3:J102").getValues();

  for (var i = 0; i < dados.length; i++) {
    var resp = normalizar(dados[i][1]);
    var row = i + 3;
    var range = listSheet.getRange(row, 2, 1, 9);

    if (resp && coresMap[resp]) {
      var cor = coresMap[resp];

      range.setBackground(cor.fundo);
      range.setFontColor(cor.texto);
    } else {
      var bg = (row % 2 === 0) ? "#F7F9FB" : "#FFFFFF";

      range.setBackground(bg);
      range.setFontColor("#000000");
    }
  }
}

// ─────────────────────────────────────────────
// PREENCHER CALENDARIO
// ─────────────────────────────────────────────

function preencherCalendario() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var listSheet = ss.getSheetByName(LISTA_SHEET_NAME);
  var calSheet = ss.getSheetByName(CALENDARIO_SHEET_NAME);

  if (!listSheet || !calSheet) return;

  var coresMap = criarMapaCores_();
  var dados = listSheet.getRange("B3:J102").getValues();
  var mapa = {};

  dados.forEach(function(row) {
    var ativ = normalizar(row[0]); // B = Atividade
    var resp = normalizar(row[1]); // C = Responsavel
    var ini = row[3];              // E = Data Inicio
    var prev = row[5];             // G = Previsao Data Fim
    var fim = row[6];              // H = Data Fim

    if (!ativ || !resp || !ini) return;

    var dIni = parseDate(ini);

    if (!dIni) return;

    var dFimParsed = parseDate(fim);
    var dPrevParsed = parseDate(prev);
    var dFim = (dFimParsed && dFimParsed >= dIni) ? dFimParsed : dPrevParsed;

    if (!dFim) return;

    dIni.setHours(0, 0, 0, 0);
    dFim.setHours(0, 0, 0, 0);

    for (var d = new Date(dIni); d <= dFim; d.setDate(d.getDate() + 1)) {
      var key = d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();

      if (!mapa[key]) {
        mapa[key] = [];
      }

      mapa[key].push({
        ativ: ativ,
        resp: resp
      });
    }
  });

  var lastRow = calSheet.getLastRow();
  var allVals = calSheet.getRange(1, 1, lastRow, 7).getValues();
  var anoAtual = null;
  var mesAtual = null;

  for (var r = 0; r < lastRow; r++) {
    var v0 = allVals[r][0];

    if (typeof v0 === "string" && v0.indexOf("2026") !== -1) {
      MESES_CAL.forEach(function(m) {
        var dt = new Date(m.ano, m.mes - 1, 1);
        var nm = dt
          .toLocaleString("pt-BR", {month: "long"})
          .toUpperCase();

        if (v0.indexOf(nm) !== -1) {
          anoAtual = m.ano;
          mesAtual = m.mes;
        }
      });

      continue;
    }

    if (!anoAtual) continue;

    for (var c = 0; c < 7; c++) {
      var val = allVals[r][c];

      if (typeof val !== "number" || val < 1 || val > 31) continue;

      var key = anoAtual + "-" + mesAtual + "-" + val;
      var tarefas = mapa[key] || [];

      for (var tr = 1; tr <= 5; tr++) {
        var cell = calSheet.getRange(r + 1 + tr, c + 1);

        cell.setValue("");
        cell.setBackground("#FFFFFF");
        cell.setFontColor("#333333");
        cell.setFontWeight("normal");
        cell.setFontSize(8);
      }

      for (var idx = 0; idx < Math.min(tarefas.length, 5); idx++) {
        var t = tarefas[idx];
        var taskCell = calSheet.getRange(r + 2 + idx, c + 1);
        var cor = coresMap[t.resp] || {
          fundo: "#F2F2F2",
          texto: "#333333"
        };

        taskCell.setValue(t.ativ);
        taskCell.setBackground(cor.fundo);
        taskCell.setFontColor(cor.texto);
        taskCell.setFontWeight("bold");
        taskCell.setFontSize(8);
        taskCell.setWrap(false);
      }
    }
  }

  Logger.log("Calendário concluído.");
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function getListaSheet_() {
  var sheet = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName(LISTA_SHEET_NAME);

  if (!sheet) throw new Error("A aba '" + LISTA_SHEET_NAME + "' não foi encontrada.");

  return sheet;
}

function encontrarProximaLinhaVazia_(sheet) {
  var values = sheet
    .getRange(FIRST_TASK_ROW, 1, LAST_TASK_ROW - FIRST_TASK_ROW + 1, 2)
    .getValues();

  for (var i = 0; i < values.length; i++) {
    if (!normalizar(values[i][0]) && !normalizar(values[i][1])) {
      return FIRST_TASK_ROW + i;
    }
  }

  throw new Error("Não há linhas disponíveis para novas tarefas entre as linhas 3 e 102.");
}

function encontrarLinhaPorCodigo_(sheet, codigo) {
  var values = sheet
    .getRange(FIRST_TASK_ROW, 1, LAST_TASK_ROW - FIRST_TASK_ROW + 1, 1)
    .getDisplayValues();

  for (var i = 0; i < values.length; i++) {
    if (normalizar(values[i][0]) === codigo) {
      return FIRST_TASK_ROW + i;
    }
  }

  return null;
}

function validarResponsavel_(responsavel) {
  if (!responsavel) throw new Error("Informe o responsável.");

  var valido = RESPONSAVEIS.some(function(r) {
    return normalizar(r.nome) === responsavel;
  });

  if (!valido) {
    throw new Error("Responsável inválido. Escolha um dos responsáveis cadastrados.");
  }
}

function criarMapaCores_() {
  var coresMap = {};

  RESPONSAVEIS.forEach(function(r) {
    coresMap[normalizar(r.nome)] = {
      fundo: r.fundo,
      texto: r.texto
    };
  });

  return coresMap;
}

function formatarLinhaTarefa_(sheet, row) {
  sheet.getRange(row, 4, 1, 2).setNumberFormat("dd/MM/yyyy");
  sheet.getRange(row, 7, 1, 2).setNumberFormat("dd/MM/yyyy");
}

function normalizar(str) {
  if (str === null || str === undefined) return "";

  return str
    .toString()
    .trim()
    .replace(/\s+/g, " ");
}

function parseDate(d) {
  if (d instanceof Date && !isNaN(d.getTime())) {
    var fromDate = new Date(d);
    fromDate.setHours(0, 0, 0, 0);
    return fromDate;
  }

  if (typeof d === "string" && d.trim() !== "") {
    var value = d.trim();
    var iso = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    var br = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    var parsed;

    if (iso) {
      parsed = new Date(
        parseInt(iso[1], 10),
        parseInt(iso[2], 10) - 1,
        parseInt(iso[3], 10)
      );
    } else if (br) {
      parsed = new Date(
        parseInt(br[3], 10),
        parseInt(br[2], 10) - 1,
        parseInt(br[1], 10)
      );
    } else {
      parsed = new Date(value);
    }

    if (!isNaN(parsed.getTime())) {
      parsed.setHours(0, 0, 0, 0);
      return parsed;
    }
  }

  return null;
}

function formatDateForInput_(date) {
  var parsed = parseDate(date);

  if (!parsed) return "";

  return [
    parsed.getFullYear(),
    padNumber_(parsed.getMonth() + 1, 2),
    padNumber_(parsed.getDate(), 2)
  ].join("-");
}

function padNumber_(num, size) {
  var str = String(num);

  while (str.length < size) {
    str = "0" + str;
  }

  return str;
}
