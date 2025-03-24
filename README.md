# Water Quality Monitoring System

A real-time water quality monitoring system that uses MQTT for sensor data communication and React for the frontend interface.

## MQTT Topics

The system uses the following MQTT topics for communication:

### Sensor Topics

- `waterqualitymonitoring/pHsensor` - pH level measurements
- `waterqualitymonitoring/TDSsensor` - Total Dissolved Solids measurements
- `waterqualitymonitoring/phosphatesensor` - Phosphate level measurements
- `waterqualitymonitoring/Levelsensor` - Water level measurements

### Control Topics

- `waterqualitymonitoring/start` - Start sensor readings
- `waterqualitymonitoring/reset` - Reset sensor readings

## Sample Payloads

### pH Sensor

```json
{
  "value": 7.25,
  "timestamp": "2024-03-24T10:30:00Z",
  "unit": "pH"
}
```

- Range: 6.5 - 8.5 pH
- Typical value: 7.0 pH

### TDS Sensor

```json
{
  "value": 450,
  "timestamp": "2024-03-24T10:30:00Z",
  "unit": "ppm"
}
```

- Range: 200 - 1000 ppm
- Typical value: 500 ppm

### Phosphate Sensor

```json
{
  "value": 1.25,
  "timestamp": "2024-03-24T10:30:00Z",
  "unit": "mg/L"
}
```

- Range: 0.5 - 2.0 mg/L
- Typical value: 1.0 mg/L

### Water Level Sensor

```json
{
  "value": 75,
  "timestamp": "2024-03-24T10:30:00Z",
  "unit": "%"
}
```

- Range: 20% - 100%
- Typical value: 80%

### Control Commands

```json
// Start command
{
  "command": "start",
  "timestamp": "2024-03-24T10:30:00Z"
}

// Reset command
{
  "command": "reset",
  "timestamp": "2024-03-24T10:30:00Z"
}
```

## MQTT Configuration

The system uses the following MQTT configuration:

```env
VITE_MQTT_HOST=mqtt.deepakradhakrishnan.in
VITE_MQTT_PORT=443
VITE_MQTT_PATH=/mqtt
VITE_MQTT_USERNAME=beardobot
VITE_MQTT_PASSWORD=Vibo@123
VITE_MQTT_CLIENT_ID=watermonitor_client
VITE_MQTT_USE_SSL=true
```

## Data Storage

All sensor data is stored in Supabase with the following structure:

```sql
CREATE TABLE sensor_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sensor_type text NOT NULL,
  value float NOT NULL,
  timestamp timestamptz DEFAULT now(),
  topic text NOT NULL,
  raw_message jsonb NOT NULL
);
```

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with the required environment variables
4. Start the development server:
   ```bash
   npm run dev
   ```

## Features

- Real-time sensor data visualization
- Historical data viewing
- User authentication
- Role-based access control
- MQTT-based sensor communication
- Supabase data storage
