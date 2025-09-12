# CineScope Dashboard – SQL Integration Task

 **You’ve just joined CineScope Studios as a data intern.**  
 Your mission? Help the team build an interactive movie database visualizer. The frontend is ready — now it’s your job to bring it to life with real data. You’ll import movie records, connect a MySQL database, and make sure everything works smoothly inside the CineScope desktop app.

---

## 🎯 Objective

- Learn and apply basic **SQL (MySQL)** skills  
- Import data from a **CSV file** into a MySQL database using Python  
- Integrate a **PySide6** UI with the database  
- Enable exporting of the displayed data to a CSV file

---

## Steps to Run the Project
1. Set up the virtual environment
2. Activate the virtual environment
3. Install dependencies `requirements.txt`
4. Run the application `python main.py`




## 🗂 What You’re Given

- A `movies.csv` file with movie data  
- A ready-to-use **PySide6 UI** (`dashboard.py`)  
- A [demo video](https://github.com/AadarshM07/CineScope-S3/blob/main/demo.mp4) showing the expected functionality

---

## 🛠 What You Have to Do

1. **Import Data into MySQL**  
   Write a Python script (`import_csv.py`) to:  
   - Create a MySQL table for storing movie data  
   - Read the contents of `movies.csv`  
   - Insert the records into the database

2. **Connect the UI to MySQL and Implement Functionalities**  
   The provided UI (`dashboard.py`) is built using PySide6. Your job is to:  
   - Connect it to your MySQL database using Python (e.g., `PyMySQL` or `mysql-connector-python`)  
   - Make the **Search** and **Column Selection** buttons functional — they should generate custom queries based on the user's input and selected filters  
   - Display the resulting data dynamically in the visualizer table

3. **Export to CSV**  
   Implement the **Export CSV** button so that:  
   - It exports the **currently displayed data** from the visualizer table to a new `.csv` file  
   - The exported file should reflect any applied filters or selections made in the UI

4. **Improve the UI**
   
   Tinker with the existing PySide6 interface to enhance the layout, responsiveness, and overall user experience.
   - Bring your creativity out — feel free to redesign or rearrange components for a cleaner and more intuitive interface.


---

## 🧠 Prerequisites

Make sure you’re familiar with:

| Topic | Resource |
|-------|----------|
| SQL (MySQL) | [W3Schools SQL Tutorial](https://www.w3schools.com/sql/) |
| Python + MySQL | [Real Python: MySQL with Python](https://realpython.com/python-mysql/) |
| PySide6 (Qt for Python) | [Official Docs](https://doc.qt.io/qtforpython/) |

---
## ✅Submission Guidelines
- Include your `import_csv.py` script
- Modify `dashboard.py` with proper integration
- Make sure the Export CSV button works
- Submit your updated GitHub repo link


