import sys
import csv
import mysql.connector
from PySide6.QtWidgets import (
    QApplication, QWidget, QVBoxLayout, QHBoxLayout, QLabel,
    QPushButton, QTableWidget, QTableWidgetItem, QGridLayout,
    QTextEdit, QSizePolicy, QLineEdit, QFileDialog
)
from PySide6.QtGui import QFont
from PySide6.QtCore import Qt


class Dashboard(QWidget):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("CineScope – Dashboard")
        self.setMinimumSize(1200, 800)
        self.setStyleSheet("background-color: #121212; color: white; padding: 20px;")

        self.db = mysql.connector.connect(
            host="localhost",
            user="root",
            password="ashish@123",
            database="movies_db"
        )
        self.cursor = self.db.cursor()

        self.search_mode = None
        self.selected_columns = {
            "id": True, "title": True, "Released_Year": True,
            "Genre": True, "IMDB_Rating": True,
            "Director": True, "Stars": True
        }

        self.search_buttons_add = {}
        self.column_buttons_add = {}

        self.init_ui()
        self.load_default_data() 

    def init_ui(self):
        main_layout = QVBoxLayout()
        main_layout.setContentsMargins(20, 20, 20, 20)
        main_layout.setSpacing(10)

        # Header
        header = QLabel("🎬 CineScope Dashboard")
        header.setFont(QFont("Arial", 24, QFont.Bold))
        header.setAlignment(Qt.AlignCenter)
        header.setFixedHeight(80)
        main_layout.addWidget(header)

        split_layout = QHBoxLayout()

        # Left Panel
        left_container = QVBoxLayout()
        left_container.setSpacing(10)
        left_container.setAlignment(Qt.AlignTop)

        # Search buttons
        search_heading = QLabel("Search By")
        search_heading.setFont(QFont("Arial", 18, QFont.Bold))
        left_container.addWidget(search_heading)

        search_buttons = [
            ("Genre", "Genre"),
            ("Year", "Released_Year"),
            ("Rating", "IMDB_Rating"),
            ("Director", "Director"),
            ("Actor", "actor"),
        ]

        search_grid = QGridLayout()
        for index, (label, mode) in enumerate(search_buttons):
            btn = QPushButton(label)
            btn.setStyleSheet(self.get_button_style(False))
            btn.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Fixed)
            btn.clicked.connect(lambda _, m=mode, b=btn: self.set_search_mode(m, b))
            row, col = divmod(index, 2)
            search_grid.addWidget(btn, row, col)
            self.search_buttons_add[mode] = btn
        left_container.addLayout(search_grid)

        # Column selection
        column_heading = QLabel("Select Columns")
        column_heading.setFont(QFont("Arial", 18, QFont.Bold))
        left_container.addWidget(column_heading)

        column_buttons = [
            ("Title", "title"),
            ("Year", "Released_Year"),
            ("Genre", "Genre"),
            ("Rating", "IMDB_Rating"),
            ("Director", "Director"),
            ("Stars", "Stars"),
        ]

        column_grid = QGridLayout()
        for index, (label, col) in enumerate(column_buttons):
            btn = QPushButton(label)
            btn.setStyleSheet(self.get_button_style(self.selected_columns.get(col, True)))
            btn.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Fixed)
            btn.clicked.connect(lambda _, c=col, b=btn: self.toggle_column(c, b))
            row, col_idx = divmod(index, 2)
            column_grid.addWidget(btn, row, col_idx)
            self.column_buttons_add[col] = btn
        left_container.addLayout(column_grid)

        # Search input
        self.query_input = QLineEdit()
        self.query_input.setPlaceholderText("Enter search term")
        self.query_input.setStyleSheet(
            "background-color: #1e1e1e; color: white; padding: 5px; border: 1px solid #444;"
        )
        left_container.addWidget(self.query_input)

        # Action buttons
        action_layout = QHBoxLayout()
        search_btn = QPushButton("Search")
        search_btn.setStyleSheet("background-color: #e50914; color: white; padding: 6px; border-radius: 5px;")
        search_btn.clicked.connect(self.execute_search)
        action_layout.addWidget(search_btn)

        export_btn = QPushButton("Export CSV")
        export_btn.setStyleSheet("background-color: #1f1f1f; color: white; padding: 6px; border-radius: 5px;")
        export_btn.clicked.connect(self.export_csv)
        action_layout.addWidget(export_btn)
        left_container.addLayout(action_layout)

        # Right Panel
        right_side_layout = QVBoxLayout()
        right_side_layout.setSpacing(10)

        # Table
        self.table = QTableWidget()
        self.table.setStyleSheet("""
            QTableWidget {
                color: white;
                font-family: Arial, sans-serif;
                font-size: 14px;
            }
            QHeaderView::section {
                background-color: white;
                color: black;
                padding: 4px;
            }
        """)
        self.table.horizontalHeader().setStretchLastSection(True)
        self.table.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Expanding)

        # Output console
        self.output_console = QTextEdit()
        self.output_console.setPlaceholderText("Results will appear here...")
        self.output_console.setStyleSheet("""
            QTextEdit {
                background-color: #1e1e1e;
                color: white;
                border: 1px solid #444;
                padding: 5px;
            }
        """)
        self.output_console.setFixedHeight(100)

        right_side_layout.addWidget(self.table)
        right_side_layout.addWidget(self.output_console)

        split_layout.addLayout(left_container, 2)
        split_layout.addLayout(right_side_layout, 8)
        main_layout.addLayout(split_layout)
        self.setLayout(main_layout)

    def get_button_style(self, is_selected):
        if is_selected:
            return """
                QPushButton {
                    background-color: #ffcc00;
                    border: 1px solid #ff9900;
                    border-radius: 3px;
                    padding: 6px;
                }
            """
        else:
            return """
                QPushButton {
                    background-color: #1f1f1f;
                    border: 1px solid #333;
                    border-radius: 3px;
                    padding: 6px;
                }
                QPushButton:hover {
                    background-color: #333;
                }
            """

    def set_search_mode(self, mode, button):
        for btn in self.search_buttons_add.values():
            btn.setStyleSheet(self.get_button_style(False))
        button.setStyleSheet(self.get_button_style(True))
        self.search_mode = mode
        self.output_console.append(f"Search mode set to: {mode}")

    def toggle_column(self, column, button):
        self.selected_columns[column] = not self.selected_columns.get(column, True)
        button.setStyleSheet(self.get_button_style(self.selected_columns[column]))
        self.output_console.append(f"Column '{column}' toggled {'ON' if self.selected_columns[column] else 'OFF'}")

    def execute_search(self):
        keyword = self.query_input.text().strip()
        if not keyword:
            self.output_console.append(" Please enter a search term.")
            return

        if not self.search_mode:
            self.output_console.append(" Please select a search mode.")
            return

        try:
            if self.search_mode == "actor":
                query = """
                    SELECT * FROM movies
                    WHERE Star1 LIKE %s OR Star2 LIKE %s OR Star3 LIKE %s
                """
                like_str = f"%{keyword}%"
                self.cursor.execute(query, (like_str, like_str, like_str))
            else:
                query = f"SELECT * FROM movies WHERE {self.search_mode} LIKE %s"
                self.cursor.execute(query, (f"%{keyword}%",))
        except mysql.connector.Error as e:
            self.output_console.append(f" Database error: {e}")
            return

        rows = self.cursor.fetchall()
        self.populate_table(rows)

    def populate_table(self, rows):
        col_map = {
            "id": 0, "title": 1, "Released_Year": 2,
            "Genre": 3, "IMDB_Rating": 4,
            "Director": 5, "Stars": (6, 7, 8)
        }
        visible_cols = [c for c, v in self.selected_columns.items() if v]

        headers = []
        for col in visible_cols:
            headers.append("Stars" if col == "Stars" else col)
        self.table.setColumnCount(len(headers))
        self.table.setHorizontalHeaderLabels(headers)

        self.table.setRowCount(len(rows))
        for row_idx, row in enumerate(rows):
            col_pos = 0
            for col in visible_cols:
                if col == "Stars":
                    value = ", ".join([str(row[6]), str(row[7]), str(row[8])])
                else:
                    value = str(row[col_map[col]])
                self.table.setItem(row_idx, col_pos, QTableWidgetItem(value))
                col_pos += 1

        self.output_console.append(f"Found {len(rows)} results.")

    def export_csv(self):
        path, _ = QFileDialog.getSaveFileName(self, "Save CSV", "", "CSV Files (*.csv)")
        if not path:
            return
        with open(path, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            headers = [self.table.horizontalHeaderItem(i).text() for i in range(self.table.columnCount())]
            writer.writerow(headers)
            for row in range(self.table.rowCount()):
                row_data = []
                for col in range(self.table.columnCount()):
                    item = self.table.item(row, col)
                    row_data.append(item.text() if item else "")
                writer.writerow(row_data)

        self.output_console.append(f" Data exported to {path}")
    def load_default_data(self):
        """Load all movies on dashboard startup."""
        try:
            self.cursor.execute("SELECT * FROM movies")
            rows = self.cursor.fetchall()
            self.populate_table(rows)
        except mysql.connector.Error as e:
            self.output_console.append(f" Database error: {e}")


if __name__ == "__main__":
    app = QApplication(sys.argv)
    dashboard = Dashboard()
    dashboard.show()
    sys.exit(app.exec())
