import mqtt from 'mqtt';
import { create } from 'zustand';

interface MQTTState {
  client: mqtt.MqttClient | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  publish: (topic: string, message: string) => void;
  subscribe: (topic: string) => void;
}

const MQTT_TOPICS = [
  'waterqualitymonitoring/pHsensor',
  'waterqualitymonitoring/TDSsensor',
  'waterqualitymonitoring/phosphatesensor',
  'waterqualitymonitoring/Levelsensor',
];

export const useMQTTStore = create<MQTTState>((set, get) => ({
  client: null,
  isConnected: false,
  connect: () => {
    const options = {
      host: import.meta.env.VITE_MQTT_HOST,
      port: parseInt(import.meta.env.VITE_MQTT_PORT),
      path: import.meta.env.VITE_MQTT_PATH,
      username: import.meta.env.VITE_MQTT_USERNAME,
      password: import.meta.env.VITE_MQTT_PASSWORD,
      clientId: import.meta.env.VITE_MQTT_CLIENT_ID,
      protocol: import.meta.env.VITE_MQTT_USE_SSL === 'true' ? 'wss' : 'ws',
      ca: import.meta.env.VITE_MQTT_CA_CERT,
    };

    const client = mqtt.connect(options);

    client.on('connect', () => {
      set({ isConnected: true });
      MQTT_TOPICS.forEach(topic => client.subscribe(topic));
    });

    client.on('message', (topic, message) => {
      // Handle incoming messages and store in Supabase
      // Implementation will be added in the next step
    });

    client.on('error', (err) => {
      console.error('MQTT Error:', err);
      set({ isConnected: false });
    });

    set({ client });
  },
  disconnect: () => {
    const { client } = get();
    if (client) {
      client.end();
      set({ client: null, isConnected: false });
    }
  },
  publish: (topic: string, message: string) => {
    const { client } = get();
    if (client) {
      client.publish(topic, message);
    }
  },
  subscribe: (topic: string) => {
    const { client } = get();
    if (client) {
      client.subscribe(topic);
    }
  },
}));