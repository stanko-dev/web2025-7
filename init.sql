-- Initialize database schema
CREATE TABLE IF NOT EXISTS devices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_name VARCHAR(255) NOT NULL,
    serial_number VARCHAR(255) UNIQUE NOT NULL,
    user_name VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert sample data for testing
INSERT IGNORE INTO devices (device_name, serial_number) VALUES
('Laptop Dell XPS 13', 'DL001'),
('iPhone 14', 'IP002'),
('iPad Pro', 'IP003');

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_serial_number ON devices(serial_number);
CREATE INDEX IF NOT EXISTS idx_user_name ON devices(user_name);