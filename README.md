# BAMS Paper Bank — Setup Guide

This project uses a static website hosted on GitHub Pages and a Google Apps Script web app that reads PDF metadata from a Google Drive folder.

## Files
- `index.html` — website frontend
- `Code.gs` — Google Apps Script backend

## 1. Create the Google Drive folder tree

Create a main folder called `BAMS PAPER BANK`. Copy its folder ID from the URL:
`https://drive.google.com/drive/folders/FOLDER_ID_HERE`

Recommended structure:

```text
BAMS PAPER BANK/
├── Batch 2024-25/
│   ├── Term 1/
│   │   ├── Rachana Sharira/
│   │   ├── Kriya Sharira/
│   │   ├── Padartha Vigyan/
│   │   ├── Samhita Adhyayan/
│   │   └── Sanskrit/
│   ├── Term 2/
│   └── Term 3/
├── Batch 2025-26/
│   ├── Term 1/
│   ├── Term 2/
│   └── Term 3/
├── Batch 2026-27/
│   ├── Term 1/
│   ├── Term 2/
│   └── Term 3/
├── Batch 2027-28/
│   ├── Term 1/
│   ├── Term 2/
│   └── Term 3/
└── University Papers/
    ├── First Professional/
    │   ├── Rachana Sharira/
    │   └── Kriya Sharira/
    ├── Second Professional/
    ├── Third Professional/
    └── Final Professional/
```

Only PDFs are listed by the starter backend. Use clear folder names. For a batch term, place the subject folder directly inside the term folder. For university papers, place the subject folder directly inside the professional-year folder.

## 2. Configure Google Apps Script

1. Open `https://script.google.com/` while signed in to the Google account that owns the Drive folder.
2. Create a new project and name it `BAMS Paper Bank API`.
3. Replace the contents of `Code.gs` with the provided `Code.gs` file.
4. Replace `PASTE_YOUR_GOOGLE_DRIVE_ROOT_FOLDER_ID_HERE` with the ID of your main Drive folder.
5. Save.
6. In the function dropdown, select `testDriveConnection` and press Run.
7. Review the requested permissions and authorize the script. Confirm that the log shows the correct folder name.
8. Select **Deploy → New deployment**.
9. Choose **Web app** as the deployment type.
10. Set **Execute as** to **Me** (the account that owns the folder).
11. Set access to the least-permissive option that works for your audience. A public library that must load without sign-in generally needs anonymous access if the account allows it. If anonymous access is unavailable, use a sign-in-based architecture instead.
12. Deploy and copy the web app URL ending in `/exec`.

Official deployment guide: https://developers.google.com/apps-script/guides/web

## 3. Connect the website to Apps Script

1. Open `index.html` in a text editor.
2. Find this line:
   `const API_URL = "PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE";`
3. Replace the placeholder with the deployed `/exec` URL, for example:
   `const API_URL = "https://script.google.com/macros/s/DEPLOYMENT_ID/exec";`
4. Save the file.

Do not paste your Google password, OAuth token, or other private credentials into `index.html`.

## 4. Publish on GitHub Pages

1. Sign in to GitHub and create a new repository, for example `bams-paper-bank`.
2. Upload `index.html` to the repository's root directory.
3. Open the repository's **Settings → Pages**.
4. Under the build and deployment section, select **Deploy from a branch**.
5. Choose branch `main` and folder `/(root)`, then save.
6. Wait for GitHub Pages to publish the site. Open the Pages URL shown in settings.

Official guide: https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site

## 5. Permissions for PDF viewing

The script only returns links; it does not bypass Drive permissions.

For a public paper library, each PDF must be viewable by the intended audience. You can either:
- Set the PDFs (or their containing folder, if inheritance applies) to **Anyone with the link — Viewer**, or
- Build a private sign-in-based version that checks student authorization.

Do not put confidential, personal, or unreleased exam material in a public folder. Only publish papers you are authorized to distribute.

## 6. Test

1. Upload a test PDF into `Batch 2025-26/Term 1/Rachana Sharira/`.
2. Open the Apps Script `/exec` URL directly in a browser. It should return a JSON response containing the PDF metadata. If you add `?callback=test`, it should return a JavaScript callback response.
3. Open the GitHub Pages website.
4. Tap **Refresh**. The paper should appear.
5. Test the View and Download buttons. If the paper opens an access request page, correct the Drive permissions.

The frontend refreshes the paper list every five minutes while open. The Apps Script response is cached for up to two minutes.

## Notes and troubleshooting

- **No papers shown:** Check the root folder ID and that the PDF is inside the expected nested folders.
- **Authorization error:** Run `testDriveConnection` in Apps Script and grant the requested Drive access.
- **Script not updated:** After editing the Apps Script, use **Deploy → Manage deployments → Edit**, choose a new version, and deploy it.
- **Apps Script URL error:** Use the `/exec` deployment URL, not a temporary `/dev` test URL.
- **PDF access denied:** The file's Drive permissions must allow the student to view it.
- **Wrong subject shown:** Put each paper in a subject subfolder as shown in the folder tree.
- **Need more formats:** The starter backend lists PDFs only. DOCX files and images can be added by modifying the MIME-type filter.
- **Privacy:** An anonymous endpoint reveals the names, folder paths, dates and IDs of listed PDFs. Keep private documents in a separate Drive folder and never point the public API at that folder.
