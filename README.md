# ID Card Generator - Bulk + Single

Upload **one Excel/CSV file + all the photos** at once and download **50-60 ID cards in one go**.
No need to enter data one card at a time. The old single-card mode is still available.

---

## 1. Features

| Feature | Detail |
|---|---|
| Bulk Excel / CSV upload | `.xlsx`, `.xls`, `.csv` supported |
| Auto column mapping | "Emp Code", "Employee Code", "emp_code" are all detected automatically, and you can change any mapping from the dropdowns |
| Bulk photo upload | Select multiple photos, a whole folder, or one ZIP file |
| Smart photo matching | A photo named `EMP001.jpg` or `Rahul Sharma.jpg` is matched automatically |
| Bulk download | All cards in one ZIP (recommended) or as separate JPEG files |
| Live preview | See a card before you download |
| Clean data | Gender `M`/`Male` and blood group `b positive`/`B+` are normalised |
| Logo + footer + emergency number | Set once at company level (saved in the browser) and applied to every card |
| Single card mode | The old one-card-at-a-time mode works as before |

Everything runs **in your browser**. No data is uploaded to any server.

---

## 2. How to run (step by step)

### Requirements
- **Node.js 18 or newer** - download the "LTS" version from https://nodejs.org and install it.
- After installing, close and reopen Command Prompt / PowerShell.

To check:

```bash
node --version
npm --version
```

### Steps

1. Extract the ZIP file (for example to `D:\id-card-bulk-tool`).
2. Open a terminal in that folder (or type `cmd` in the folder's address bar and press Enter).
3. Install dependencies (first time only, 1-2 minutes):

```bash
npm install
```

4. Start the tool:

```bash
npm run dev
```

5. Open the link shown in the terminal (usually):

```
http://localhost:5173
```

6. The tool opens in your browser. To stop it, press `Ctrl + C` in the terminal.

### One-click start (optional)
Double-click `START.bat` in the folder. It installs everything on the first run, opens the browser and starts the tool.

---

## 3. Excel file format

The easiest way: click **"Sample Excel template download"** inside the tool to get a ready-made file.
Or create your own - column names in the first row, data below:

| Emp Code | Employee Name | Gender | Blood Group | Designation | Department | Location | Address | Emergency Number | Company Name | Photo File Name |
|---|---|---|---|---|---|---|---|---|---|---|
| EMP001 | Rahul Sharma | Male | B+ | Software Engineer | IT | Mohali | B-103, Bestech Business Tower, Sector 66, Mohali 160062 | +91 8872791500 | Genius Consultants | EMP001.jpg |
| EMP002 | Priya Verma | Female | O+ | HR Executive | HR | Chandigarh | 7A, Madhya Marg, Sector 7C, Chandigarh 160019 | +91 8872791501 | Genius Consultants | EMP002.jpg |

What is required:

| Column | Required? | Notes |
|---|---|---|
| Emp Code | Yes | Printed on the card and used in the file name |
| Employee Name | Yes | Printed on the card |
| Gender | Optional | `Male` / `Female` / `M` / `F` |
| Blood Group | Optional | `B+`, `O-`, `AB+` ... or `b positive` also works |
| Designation | Optional | |
| Department | Optional | |
| Location | Optional | |
| Address | Optional | The "Address" shown in the middle of the card |
| Emergency Number | Optional | If empty, the default number from Step 1 is used |
| Company Name | Optional | If empty, the company name from Step 1 is used |
| Photo File Name | Optional | Name of the photo file - used for matching |

Column names do not have to match exactly - the tool recognises them. If it picks the wrong column, choose the right one from the
"Column mapping" dropdowns in Step 2.

---

## 4. How to upload photos

Three ways - all work:

1. **Choose photos (multiple)** - hold `Ctrl`/`Shift` and select 60 photos at once.
2. **Choose folder** - select a whole folder and every photo in it is loaded.
3. **ZIP file** - put all photos in one ZIP and upload it (fastest).

How to name the photos (for matching):

| Photo file name | Will it match? |
|---|---|
| `EMP001.jpg` | Yes - matched by Emp Code |
| `Rahul Sharma.jpg` | Yes - matched by Employee Name |
| `EMP001-Rahul.jpg` | Yes - matched by code/name |
| `IMG_2831.jpg` | No - cannot be recognised |

JPG / JPEG / PNG / WEBP all work. Photos are resized automatically, so 60-70 photos are no problem.

---

## 5. How to download in bulk

1. **Step 1** - Enter the company name, logo, footer address and emergency number (once - they are saved in your browser).
2. **Step 2** - Upload the Excel / CSV file. Check the column mapping and the data table. Untick the checkbox of any row you do not want.
3. **Step 3** - Upload the photos. A status such as "Photo matched: 55 / 60" is shown.
4. **Step 4** - Choose the quality (High recommended) and click **Download ZIP**.

That's it. Every card in the ZIP is named like `EMP001-Rahul Sharma.jpg`.

- **Download ZIP** - even 50-60 cards in a single file (recommended).
- **Download separate JPEGs** - each card as its own file, but the browser may block many downloads at once.

Time: creating 50-60 cards takes roughly 1-3 minutes. Do not close the tab until it finishes.

To test without any file, click **"Load demo data (5 test cards)"** in Step 2.

---

## 6. Production build (for sharing)

```bash
npm run build
```

This creates a `dist` folder. Put it on any static hosting (IIS, nginx, Netlify, or simply `npx serve dist`).
To test locally:

```bash
npm run preview
```

---

## 7. Common problems

| Problem | Solution |
|---|---|
| `npm` not recognized | Node.js is not installed, or the terminal was opened before installing. Install Node.js and reopen the terminal. |
| Port 5173 already in use | Run `npm run dev -- --port 5174`. |
| Data did not load / looks wrong | Check the column mapping dropdowns in Step 2. Column names must be in the first row. |
| Some cards have no photo | Name the photo after the Emp Code or Employee Name. In Step 3, hover over "unmatched photos" to see them. |
| Download did not start | Check the browser's popup/download permission. Use the ZIP option. |
| Card comes out blank | Refresh the page and try again. "Ultra" quality is very slow - keep "High". |
| Hindi / special characters in Excel | Use `.xlsx`. A `.csv` file must be UTF-8. |

---

## 8. Project structure

```
src/
  App.tsx                    -> Tabs (Bulk / Single)
  BulkGenerator.tsx          -> The complete bulk-mode flow
  IdCardGenerator.tsx        -> Single card mode
  components/IdCardTemplate.tsx -> Card design (used for both preview and export)
  lib/
    columns.ts               -> Column auto-detection
    parse.ts                 -> Excel / CSV reading
    match.ts                 -> Photo matching
    image.ts                 -> Resize / download helpers
    useCardExporter.tsx      -> High-resolution JPEG export engine
    settings.ts              -> Company settings (localStorage)
    sample.ts, demo.ts       -> Sample template + demo data
```

Card size: **10.8 cm x 17.2 cm** (same as the old design).
