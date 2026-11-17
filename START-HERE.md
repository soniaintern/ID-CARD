# START HERE - What to do

After reading this file you should not need to ask anything. There are 4 parts:

1. [Running the tool](#1-running-the-tool) - one-time setup
2. [Uploading the Excel file](#2-uploading-the-excel-file)
3. [Preparing and uploading photos](#3-preparing-and-uploading-photos)
4. [Downloading the ID cards](#4-downloading-the-id-cards)

---

## 1. Running the tool

### First time (only once)

1. **Install Node.js** - open https://nodejs.org, download the green **"LTS"** button version and install it (Next-Next-Finish).
2. Extract the ZIP file, for example to `D:\ID-Card-Bulk-Tool`.
3. Open the folder and **double-click `START.bat`**.

That's all. The first run does a 1-2 minute setup, then the browser opens by itself at `http://localhost:5173`.

### Every day

Double-click `START.bat` -> the browser opens -> do your work.
When finished, press **Ctrl + C** in the black window (or just close the window).

### If START.bat does not work (manual way)

Type `cmd` in the folder's address bar and press Enter, then run:

```bash
npm install
npm run dev
```

Open the link shown in the terminal (`http://localhost:5173`) in your browser.

---

## 2. Uploading the Excel file

### First create your Excel file

1. Click the **"Sample Excel template download"** button inside the tool - you get a ready-made file.
2. Open that file and fill in your data. **Keep the column names in the first row as they are.**

Columns (anything you leave empty falls back to the default):

| Emp Code | Employee Name | Gender | Blood Group | Designation | Department | Location | Address | Emergency Number | Company Name | Photo File Name |
|---|---|---|---|---|---|---|---|---|---|---|
| EMP001 | Rahul Sharma | Male | B+ | Software Engineer | IT | Mohali | B-103, Bestech Business Tower, Mohali 160062 | +91 8872791500 | Genius Consultants | EMP001.jpg |
| EMP002 | Priya Verma | Female | O+ | HR Executive | HR | Chandigarh | 7A, Madhya Marg, Chandigarh 160019 | +91 8872791501 | Genius Consultants | EMP002.jpg |

Only **Emp Code** and **Employee Name** are required. Everything else is optional.

### Uploading it in the tool

1. Open the tool (`http://localhost:5173`).
2. The **"Bulk Mode (Excel + Photos)"** tab is open by default.
3. **Step 1** - enter the Company Name, logo, footer address and emergency number. (You enter them once and they stay saved.)
4. **Step 2** - click **"Choose Excel / CSV"** and select your Excel file.
5. **"Column mapping"** appears below. The tool picks the right columns itself. If anything looks wrong, change it from the dropdowns.
6. In the **"Data preview"** table you see all your data at once. Untick the checkbox of any employee whose card you do not want.

Column names can differ - "Employee Code", "Emp Code", "emp_code", "Name of the Employee" are all recognised by the tool.

---

## 3. Preparing and uploading photos

### Most important: the photo file name

Name each photo after the employee's **Emp Code** or **full name**:

| Photo file name | Will it match? |
|---|---|
| `EMP001.jpg` | Yes - by Emp Code |
| `Rahul Sharma.jpg` | Yes - by Employee Name |
| `EMP001-Rahul.jpg` | Yes |
| `rahul.sharma.jpg` | Yes |
| `IMG_2831.jpg` | **No** - the tool cannot recognise it |

Formats: JPG / JPEG / PNG / WEBP. The tool shrinks the photo size by itself later - you do not need to do anything.

**Easiest way:** create a folder `Employees Photos` and keep all photos in it named `EMP001.jpg`, `EMP002.jpg` ...

### Uploading in the tool (3 ways - any one)

1. **"Choose photos (multiple)"** - press `Ctrl + A` or hold `Ctrl`/`Shift` to select 60 photos at once.
2. **"Choose folder"** - select the whole folder and all photos are loaded automatically.
3. **"ZIP file"** - put all photos in a ZIP and upload that same ZIP with `Choose photos (multiple)` (fastest).

After uploading you will see a line like:

```
Photo matched: 55 / 60   - 5 row(s) without a photo
```

- `55 / 60` = photos of 55 employees were matched.
- Hover over "unmatched photos" to see the names of photos that did not match.
- A card whose photo was not found shows the name's initials - the card is still created.

> Note: **uploading the Excel file in Step 2 is required** - designation, phone number and so on come from the Excel file.
> Uploading only photos will not create cards.

---

## 4. Downloading the ID cards

1. In **Step 4** keep **Image quality** = **High (recommended)**.
2. Click the green **"Download ZIP (X cards)"** button.
3. A progress bar runs: `Creating card: EMP023 Priya Verma (23/60)`.
4. When it finishes, the ZIP is downloaded. Inside it every card is a separate image:
   `EMP001-Rahul Sharma.jpg`, `EMP002-Priya Verma.jpg` ...

- **50-60 cards take 1-3 minutes.** Do not close the page until it finishes.
- ZIP is better. **"Download separate JPEGs"** also exists, but the browser may block 50 files at once.
- Only need a few cards? Untick the other rows in the Step 2 table, then download - this is also how you handle a batch of 50-60 comfortably.

---

## 5. Full example (folder structure)

```
D:\ID-Card-Bulk-Tool\           <- the tool's folder (START.bat is here)
D:\Employees\
     Employee_Data.xlsx          <- your Excel file
     Photos\
        EMP001.jpg
        EMP002.jpg
        EMP003.jpg
        ...
```

Order of work: `START.bat` -> upload Excel -> upload photos -> Download ZIP.

---

## 6. If something goes wrong

| Problem | Solution |
|---|---|
| `START.bat` closes immediately / "Node.js is not installed" | Install the LTS version from https://nodejs.org, then run `START.bat` again. |
| Browser says "site can't be reached" | Wait 8-10 seconds in the black window and refresh the page. Or copy the link shown in the window into the browser. |
| Page still does not open | Open `cmd` in the folder and run `npm run dev -- --host` (click "Allow" in Windows Firewall), then open `http://localhost:5173`. |
| Port 5173 already in use | Close the old black window, then run `START.bat` again. |
| Data looks wrong | Check the "Column mapping" dropdowns in Step 2. The **first row of the Excel file must contain the column names**. |
| Some cards have no photo | Name the photo after the Emp Code (`EMP001.jpg`). |
| Download did not start | Check the browser's download permission. Use the ZIP option. |
| Card is empty/blank | Refresh the page and try again, keep quality "High". |
| Want to change the download folder | Chrome: Settings -> Downloads -> Location. |

---

## 7. To test without a file

Click **"Load demo data (5 test cards)"** in Step 2 - 5 fake employees and their photos are loaded.
This lets you try the whole download process without creating anything.

---

## 8. Next (optional)

To run the tool for other computers on your network:

```bash
npm run build
npx serve dist
```

You can copy the `dist` folder to any computer/server and open `index.html` - everything works offline,
no data is uploaded anywhere.
