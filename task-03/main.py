import sys
from PySide6.QtWidgets import (
    QApplication, QWidget, QVBoxLayout, QLabel, QPushButton, QSpacerItem, QSizePolicy
)
from PySide6.QtGui import QFont, QMovie
from PySide6.QtCore import Qt

from dashboard import Dashboard


class CoverPage(QWidget):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("CineScope – Movie Explorer")
        self.resize(1200, 800)
        self.setMinimumSize(800, 600)

        self.setup_background()
        self.init_ui()

    def setup_background(self):
        self.bg_label = QLabel(self)
        self.bg_label.setScaledContents(True)

        self.movie = QMovie("assets/background.gif")
        self.bg_label.setMovie(self.movie)
        self.movie.start()

    def resizeEvent(self, event):
        self.bg_label.setGeometry(0, 0, self.width(), self.height())
        super().resizeEvent(event)

    def init_ui(self):
        layout = QVBoxLayout(self)

        layout.addSpacerItem(QSpacerItem(20, 60, QSizePolicy.Minimum, QSizePolicy.Expanding))

        title = QLabel("🎬 CineScope")
        title.setFont(QFont("Arial", 48, QFont.Bold))
        title.setAlignment(Qt.AlignCenter)
        layout.addWidget(title)

        subtitle = QLabel("Explore, Analyze & Discover the World of Cinema")
        subtitle.setFont(QFont("Arial", 20))
        subtitle.setAlignment(Qt.AlignCenter)
        layout.addWidget(subtitle)

        layout.addSpacerItem(QSpacerItem(20, 40, QSizePolicy.Minimum, QSizePolicy.Expanding))

        start_btn = QPushButton("Start Exploring")
        start_btn.setFont(QFont("Arial", 12))
        start_btn.setStyleSheet("""
            QPushButton {
                background-color: #e50914;
                color: white;
                padding: 10px 20px;
                border-radius: 8px;
            }
            QPushButton:hover {
                background-color: #f6121d;
            }
        """)
        start_btn.setFixedWidth(200)
        start_btn.setCursor(Qt.PointingHandCursor)
        start_btn.clicked.connect(self.on_start)

        layout.addWidget(start_btn, alignment=Qt.AlignCenter)

        layout.addSpacerItem(QSpacerItem(20, 60, QSizePolicy.Minimum, QSizePolicy.Expanding))

    def on_start(self):
        print("triggered")
        self.dashboard = Dashboard()
        self.close()
        self.dashboard.show()
        


if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = CoverPage()
    window.show()
    sys.exit(app.exec())
