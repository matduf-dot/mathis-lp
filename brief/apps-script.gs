/**
 * Réception du questionnaire de projet (mathisdufour.com/brief/)
 * À coller dans un projet Google Apps Script relié à une Google Sheet.
 *
 * À chaque envoi :
 *  1. une ligne est ajoutée dans l'onglet « Réponses » de la feuille (les colonnes se créent toutes seules) ;
 *  2. un e-mail récapitulatif arrive dans ta boîte Gmail, avec le CSV de la réponse en pièce jointe.
 */

const DESTINATAIRE = Session.getEffectiveUser().getEmail(); // ta propre adresse Gmail
const ONGLET = 'Réponses';

function doPost(e) {
  const corps = JSON.parse(e.postData.contents);
  const lib = corps.libelles || {};
  const r = corps.reponses || {};
  const cles = ['date', 'client'].concat(Object.keys(lib));
  const titres = ['Date', 'Client'].concat(Object.keys(lib).map(function (k) { return lib[k]; }));

  // 1. Feuille
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(ONGLET) || ss.insertSheet(ONGLET);
  if (sh.getLastRow() === 0) sh.appendRow(titres);
  let entetes = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  titres.forEach(function (t) {
    if (entetes.indexOf(t) === -1) { sh.getRange(1, entetes.length + 1).setValue(t); entetes.push(t); }
  });
  const ligne = entetes.map(function (t) {
    const i = titres.indexOf(t);
    return i === -1 ? '' : (r[cles[i]] || '');
  });
  sh.appendRow(ligne);

  // 2. E-mail avec le CSV de la réponse
  const q = function (v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; };
  const csv = '﻿' + titres.map(q).join(';') + '\r\n' + cles.map(function (k) { return q(r[k]); }).join(';');
  const nom = r.entreprise || r.client || 'Nouveau client';
  let html = '<h2 style="font-family:Georgia,serif">Questionnaire : ' + echapper(nom) + '</h2><table cellpadding="8" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">';
  cles.forEach(function (k, i) {
    if (!r[k]) return;
    html += '<tr><td style="border-bottom:1px solid #eee;vertical-align:top;color:#666;width:220px">' + echapper(titres[i]) + '</td><td style="border-bottom:1px solid #eee;white-space:pre-wrap">' + echapper(r[k]) + '</td></tr>';
  });
  html += '</table><p style="font-family:Arial;font-size:13px;color:#666">Toutes les réponses : <a href="' + ss.getUrl() + '">ouvrir la feuille</a></p>';
  MailApp.sendEmail({
    to: DESTINATAIRE,
    subject: 'Questionnaire site : ' + nom,
    htmlBody: html,
    replyTo: r.email || DESTINATAIRE,
    attachments: [Utilities.newBlob(csv, 'text/csv', 'questionnaire-' + nom.replace(/[^\w-]+/g, '-') + '.csv')]
  });

  return ContentService.createTextOutput('ok');
}

function echapper(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
