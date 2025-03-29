import mqtt, { MqttClient, IClientOptions } from 'mqtt';
import { create } from 'zustand';

interface MQTTStore {
  client: MqttClient | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  publish: (topic: string, message: string) => void;
  subscribe: (topic: string, callback: (message: string) => void) => void;
}

const MQTT_TOPICS = [
  'waterqualitymonitoring/pHsensor',
  'waterqualitymonitoring/TDSsensor',
  'waterqualitymonitoring/phosphatesensor',
  'waterqualitymonitoring/Levelsensor',
];

const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_INTERVAL = 3000;
const KEEPALIVE_INTERVAL = 30;

export const useMQTTStore = create<MQTTStore>((set, get) => ({
  client: null,
  isConnected: false,

  connect: () => {
    try {
      const options: IClientOptions = {
        host: import.meta.env.VITE_MQTT_HOST,
        port: parseInt(import.meta.env.VITE_MQTT_PORT),
        path: import.meta.env.VITE_MQTT_PATH,
        username: import.meta.env.VITE_MQTT_USERNAME,
        password: import.meta.env.VITE_MQTT_PASSWORD,
        clientId: `${import.meta.env.VITE_MQTT_CLIENT_ID}-${Math.random().toString(16).slice(3)}`,
        protocol: import.meta.env.VITE_MQTT_USE_SSL === 'true' ? 'wss' : 'ws',
        ca: import.meta.env.VITE_MQTT_CA_CERT,
        rejectUnauthorized: false,
        clean: true,
        reconnectPeriod: RECONNECT_INTERVAL,
        connectTimeout: 10000,
        keepalive: KEEPALIVE_INTERVAL,
        resubscribe: true,
        queueQoSZero: false,
      };

      console.log('🔌 Connecting to MQTT broker:', {
        host: options.host,
        port: options.port,
        path: options.path,
        clientId: options.clientId,
        protocol: options.protocol,
      });

      const client = mqtt.connect(options);
      let reconnectAttempts = 0;
      let keepAliveInterval: NodeJS.Timeout;

      const handleConnect = () => {
        console.log('✅ MQTT Connected successfully');
        reconnectAttempts = 0;
        set({ isConnected: true });
        
        // Subscribe to topics with QoS 1 for better reliability
        MQTT_TOPICS.forEach(topic => {
          client.subscribe(topic, { qos: 1 }, (err) => {
            if (err) {
              console.error(`❌ Error subscribing to ${topic}:`, err);
            } else {
              console.log(`✅ Subscribed to ${topic}`);
            }
          });
        });

        // Set up keepalive mechanism by publishing to a keepalive topic
        keepAliveInterval = setInterval(() => {
          if (client.connected) {
            const keepaliveTopic = `${import.meta.env.VITE_MQTT_CLIENT_ID}/keepalive`;
            const timestamp = new Date().toISOString();
            client.publish(keepaliveTopic, JSON.stringify({ timestamp }), { qos: 0 });
            console.log('🔄 Keepalive message sent');
          }
        }, KEEPALIVE_INTERVAL * 1000);
      };

      const handleError = (error: Error) => {
        console.error('❌ MQTT Error:', error);
        set({ isConnected: false });
      };

      const handleClose = () => {
        console.log('⚠️ MQTT Connection closed');
        set({ isConnected: false });
        if (keepAliveInterval) {
          clearInterval(keepAliveInterval);
        }
      };

      const handleReconnect = () => {
        if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
          console.error('❌ Max reconnection attempts reached');
          client.end(true);
          return;
        }

        reconnectAttempts++;
        console.log(`🔄 MQTT Reconnecting... Attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`);
        
        // Resubscribe to topics
        MQTT_TOPICS.forEach(topic => {
          client.subscribe(topic, { qos: 1 }, (err) => {
            if (err) {
              console.error(`❌ Error resubscribing to ${topic}:`, err);
            } else {
              console.log(`✅ Resubscribed to ${topic}`);
            }
          });
        });
      };

      const handleOffline = () => {
        console.log('⚠️ MQTT Client offline');
        set({ isConnected: false });
        if (keepAliveInterval) {
          clearInterval(keepAliveInterval);
        }
        
        // Attempt to reconnect if we haven't exceeded max attempts
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          setTimeout(() => {
            console.log('🔄 Attempting to reconnect...');
            client.reconnect();
          }, RECONNECT_INTERVAL);
        }
      };

      const handleMessage = (topic: string, message: Buffer) => {
        try {
          const messageStr = message.toString();
          console.log(`📥 Received message on ${topic}:`, messageStr);
        } catch (error) {
          console.error('❌ Error processing received message:', error);
        }
      };

      client.on('connect', handleConnect);
      client.on('error', handleError);
      client.on('close', handleClose);
      client.on('reconnect', handleReconnect);
      client.on('offline', handleOffline);
      client.on('message', handleMessage);

      set({ client });
    } catch (error) {
      console.error('❌ MQTT Connection error:', error);
      set({ isConnected: false });
    }
  },

  disconnect: () => {
    const { client } = get();
    if (client) {
      console.log('🔌 Disconnecting MQTT client');
      client.end(true);
      set({ client: null, isConnected: false });
    }
  },

  publish: (topic: string, message: string) => {
    const { client, isConnected } = get();
    if (!client || !isConnected) {
      console.warn('⚠️ MQTT client not connected');
      return;
    }

    try {
      console.log(`📤 Publishing to ${topic}:`, message);
      client.publish(topic, message, { qos: 1 }, (err) => {
        if (err) {
          console.error('❌ MQTT Publish error:', err);
        } else {
          console.log(`✅ Published to ${topic}`);
        }
      });
    } catch (error) {
      console.error('❌ MQTT Publish error:', error);
    }
  },

  subscribe: (topic: string, callback: (message: string) => void) => {
    const { client, isConnected } = get();
    if (!client || !isConnected) {
      console.warn('⚠️ MQTT client not connected');
      return;
    }

    try {
      console.log(`📥 Subscribing to ${topic}`);
      client.subscribe(topic, { qos: 1 }, (err) => {
        if (err) {
          console.error('❌ MQTT Subscribe error:', err);
          return;
        }
        console.log(`✅ Subscribed to ${topic}`);
      });

      client.on('message', (receivedTopic, message) => {
        if (receivedTopic === topic) {
          try {
            const messageStr = message.toString();
            console.log(`📥 Received message on ${topic}:`, messageStr);
            callback(messageStr);
          } catch (error) {
            console.error('❌ Error processing MQTT message:', error);
          }
        }
      });
    } catch (error) {
      console.error('❌ MQTT Subscribe error:', error);
    }
  },
}));
