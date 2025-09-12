import pandas as pd
import mysql.connector

conn = mysql.connector.connect(
    host="localhost",
    user="root",          
    password="ashish@123",  
    database="movies_db"
)
cursor = conn.cursor()

df = pd.read_csv("movies.csv")

for _, row in df.iterrows():
    cursor.execute("""
        INSERT INTO movies (Series_Title, Released_Year, Genre, IMDB_Rating, Director, Star1, Star2, Star3)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        row['Series_Title'],
        int(row['Released_Year']) if pd.notnull(row['Released_Year']) else None,
        row['Genre'],
        float(row['IMDB_Rating']) if pd.notnull(row['IMDB_Rating']) else None,
        row['Director'],
        row['Star1'],
        row['Star2'],
        row['Star3']
    ))

conn.commit()
print("Data imported")

cursor.close()
conn.close()
