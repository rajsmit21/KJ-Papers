/**
 * BAMS Paper Bank — Google Apps Script backend
 *
 * IMPORTANT:
 * 1. Set ROOT_FOLDER_ID to the ID of your main "BAMS PAPER BANK" Drive folder.
 * 2. Deploy as a web app that executes as you.
 * 3. The JSONP endpoint exposes paper metadata publicly. Only use it for papers
 *    you are permitted to share. Do not put private student data in this folder.
 */

const ROOT_FOLDER_ID = "https://drive.google.com/drive/folders/1o9e7I4TVV-ujPMwZtwNosOfP8Oma2LS6";
const CACHE_SECONDS = 120;
const MAX_PAPERS = 1500;

function doGet(e) {
  const callback = e && e.parameter ? String(e.parameter.callback || "") : "";
  let payload;
  try {
    payload = { ok: true, papers: getPapers_(), generatedAt: new Date().toISOString() };
  } catch (err) {
    payload = { ok: false, error: String(err && err.message ? err.message : err), papers: [] };
  }

  const json = JSON.stringify(payload);
  // JSONP is used so a static GitHub Pages site can read the response without
  // relying on cross-origin fetch support.
  if (callback && /^[A-Za-z_$][0-9A-Za-z_$]*$/.test(callback)) {
    return ContentService.createTextOutput(callback + "(" + json + ");")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

function getPapers_() {
  if (!ROOT_FOLDER_ID || ROOT_FOLDER_ID.indexOf("PASTE_YOUR") === 0) {
    throw new Error("Set ROOT_FOLDER_ID in Code.gs before deploying.");
  }
  const cache = CacheService.getScriptCache();
  const cached = cache.get("paper_list_v1");
  if (cached) return JSON.parse(cached);

  const root = DriveApp.getFolderById(ROOT_FOLDER_ID);
  const papers = [];
  walkFolder_(root, [], papers);

  papers.sort((a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime());
  const limited = papers.slice(0, MAX_PAPERS);
  // Cache service has per-entry size limits; skip caching if the response is too large.
  const serialized = JSON.stringify(limited);
  if (serialized.length < 90000) cache.put("paper_list_v1", serialized, CACHE_SECONDS);
  return limited;
}

function walkFolder_(folder, parentSegments, output) {
  const segments = parentSegments.concat([folder.getName()]);
  const files = folder.getFiles();

  while (files.hasNext() && output.length < MAX_PAPERS) {
    const file = files.next();
    const mime = file.getMimeType();
    // Only list PDFs. Add other formats here if you want them in the library.
    if (mime !== MimeType.PDF && !/\.pdf$/i.test(file.getName())) continue;

    const meta = classifyPath_(segments, file.getName());
    const id = file.getId();
    output.push({
      id: id,
      title: file.getName().replace(/\.pdf$/i, "").replace(/[_-]+/g, " "),
      batch: meta.batch,
      exam: meta.exam,
      subject: meta.subject,
      professional: meta.professional,
      path: segments.join(" / "),
      updated: file.getLastUpdated().toISOString(),
      // These URLs do not override Drive permissions. The file must be accessible
      // to the viewer, e.g. "Anyone with the link — Viewer" for a public library.
      viewUrl: "https://drive.google.com/file/d/" + encodeURIComponent(id) + "/view",
      downloadUrl: "https://drive.google.com/uc?export=download&id=" + encodeURIComponent(id)
    });
  }

  const folders = folder.getFolders();
  while (folders.hasNext() && output.length < MAX_PAPERS) {
    walkFolder_(folders.next(), segments, output);
  }
}

function classifyPath_(segments, fileName) {
  const parts = segments.slice(1); // Exclude root folder name.
  const normalized = parts.map(s => s.trim());
  const lower = normalized.map(s => s.toLowerCase());

  let batch = "";
  let exam = "";
  let subject = "";
  let professional = "";

  const batchIndex = lower.findIndex(s => /^batch\s*\d{4}\s*[-–]\s*\d{2,4}$/.test(s));
  const termIndex = lower.findIndex(s => /^term\s*[123]$/i.test(s));
  const universityIndex = lower.findIndex(s => /^(university papers?|university)$/i.test(s));
  const profIndex = lower.findIndex(s => /^(first|1st|second|2nd|third|3rd|final|fourth|4th)\s+professional$/i.test(s));

  if (batchIndex >= 0) batch = normalized[batchIndex].replace(/^batch\s*/i, "Batch ");
  if (termIndex >= 0) exam = normalized[termIndex].replace(/\s+/g, " ");
  if (universityIndex >= 0) exam = "University";
  if (profIndex >= 0) professional = normalized[profIndex];

  // Folder patterns supported:
  // Batch 2025-26 / Term 2 / Rachana Sharira / file.pdf
  // University Papers / First Professional / Rachana Sharira / file.pdf
  if (batchIndex >= 0) {
    if (termIndex >= 0 && normalized[termIndex + 1]) subject = normalized[termIndex + 1];
    else if (normalized[batchIndex + 1]) subject = normalized[batchIndex + 1];
  } else if (universityIndex >= 0) {
    if (profIndex >= 0 && normalized[profIndex + 1]) subject = normalized[profIndex + 1];
    else if (normalized[universityIndex + 1]) subject = normalized[universityIndex + 1];
  }

  // If no subject folder is present, use the filename as a fallback label.
  if (!subject) {
    subject = fileName.replace(/\.pdf$/i, "").replace(/[_-]+/g, " ");
  }
  return { batch: batch, exam: exam, subject: subject, professional: professional };
}

/** Optional helper: run manually after uploading if you want to clear cached data. */
function clearPaperCache() {
  CacheService.getScriptCache().remove("paper_list_v1");
}

/** Optional helper: run once from the Apps Script editor to check Drive access. */
function testDriveConnection() {
  const root = DriveApp.getFolderById(ROOT_FOLDER_ID);
  Logger.log("Connected to folder: " + root.getName());
  Logger.log("Papers found: " + getPapers_().length);
}
