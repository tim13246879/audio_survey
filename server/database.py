import mysql.connector
from mysql.connector import pooling
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get environment
ENVIRONMENT = os.getenv('FLASK_ENV', 'development')

# Database configuration
db_config = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD'),
    'database': os.getenv('DB_NAME', 'audio_survey'),
    'pool_name': 'mypool',
    'pool_size': 5
}

# Add SSL configuration for production
if ENVIRONMENT == 'production':
    db_config.update({
        'ssl_ca': os.getenv('DB_SSL_CA'),  # SSL certificate authority
        'ssl_verify_cert': True,
        'pool_size': 10  # Increased pool size for production
    })

# Create connection pool
connection_pool = None

def init_db():
    global connection_pool
    try:
        connection_pool = mysql.connector.pooling.MySQLConnectionPool(**db_config)
        print(f"Database connection pool created successfully in {ENVIRONMENT} environment")
        
        # Test the connection
        conn = get_db_connection()
        if conn:
            print(f"Successfully connected to the database at {db_config['host']}")
            # Execute the init.sql file
            with open('sql/init.sql', 'r') as file:
                sql_script = file.read()
            cursor = conn.cursor()
            # Split and execute multiple statements if present
            for statement in sql_script.split(';'):
                if statement.strip():
                    cursor.execute(statement)
            conn.commit()
            cursor.close()
            print("Database initialized successfully")
    except mysql.connector.Error as err:
        print(f"Error creating connection pool: {err}")
        raise

def get_db_connection():
    try:
        connection = connection_pool.get_connection()
        return connection
    except mysql.connector.Error as err:
        print(f"Error getting connection from pool: {err}")
        raise

def close_db_connection(connection):
    if connection:
        connection.close() 