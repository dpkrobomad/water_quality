import React, { useState, useEffect } from 'react';
import { 
  Droplets, 
  Thermometer, 
  Waves, 
  Gauge,
  Play,
  RotateCcw,
  Zap,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { useMQTTStore } from '../lib/mqtt';
import { supabase } from '../lib/supabase';

interface SensorData {
  value: number;
  timestamp: Date;
}

interface PHClassification {
  range: [number, number];
  label: string;
  color: string;
}

const phClassifications: PHClassification[] = [
  { range: [0.00, 1.99], label: 'Extremely Acidic', color: 'text-red-600' },
  { range: [2.00, 2.99], label: 'Highly Acidic', color: 'text-red-500' },
  { range: [3.00, 3.99], label: 'Strongly Acidic', color: 'text-red-400' },
  { range: [4.00, 4.99], label: 'Moderately Acidic', color: 'text-orange-500' },
  { range: [5.00, 5.99], label: 'Weakly Acidic', color: 'text-orange-400' },
  { range: [6.00, 6.99], label: 'Slightly Acidic', color: 'text-yellow-500' },
  { range: [7.00, 7.00], label: 'Neutral', color: 'text-green-500' },
  { range: [7.01, 7.99], label: 'Slightly Alkaline', color: 'text-blue-400' },
  { range: [8.00, 8.99], label: 'Weakly Alkaline', color: 'text-blue-500' },
  { range: [9.00, 9.99], label: 'Moderately Alkaline', color: 'text-blue-600' },
  { range: [10.00, 10.99], label: 'Strongly Alkaline', color: 'text-purple-400' },
  { range: [11.00, 11.99], label: 'Highly Alkaline', color: 'text-purple-500' },
  { range: [12.00, 14.00], label: 'Extremely Alkaline', color: 'text-purple-600' }
];

const getPHClassification = (value: number): PHClassification | null => {
  return phClassifications.find(
    classification => 
      value >= classification.range[0] && value <= classification.range[1]
  ) || null;
};

export default function Dashboard() {
  const [phData, setPhData] = useState<SensorData | null>(null);
  const [tdsData, setTdsData] = useState<SensorData | null>(null);
  const [phosphateData, setPhosphateData] = useState<SensorData | null>(null);
  const [levelData, setLevelData] = useState<SensorData | null>(null);
  
  const mqttClient = useMQTTStore(state => state.client);
  const publish = useMQTTStore(state => state.publish);

  const generateSampleData = () => {
    // Generate random values within realistic ranges
    const phValue = (Math.random() * (8.5 - 6.5) + 6.5).toFixed(2);
    const tdsValue = Math.floor(Math.random() * (1000 - 200) + 200);
    const phosphateValue = (Math.random() * (2.0 - 0.5) + 0.5).toFixed(2);
    const levelValue = Math.floor(Math.random() * (100 - 20) + 20);

    // Publish to respective topics
    publish('waterqualitymonitoring/pHsensor', phValue);
    publish('waterqualitymonitoring/TDSsensor', tdsValue.toString());
    publish('waterqualitymonitoring/phosphatesensor', phosphateValue);
    publish('waterqualitymonitoring/Levelsensor', levelValue.toString());
  };

  const handleStartReading = () => {
    if (mqttClient) {
      mqttClient.publish('waterqualitymonitoring/start', 'start');
    }
  };

  const handleResetReading = () => {
    if (mqttClient) {
      mqttClient.publish('waterqualitymonitoring/reset', 'reset');
    }
  };

  const handleTestData = () => {
    generateSampleData();
  };

  useEffect(() => {
    if (mqttClient) {
      mqttClient.on('message', (topic, message) => {
        try {
          const payload = JSON.parse(message.toString());
          const value = payload.value;
          const timestamp = new Date(payload.timestamp);
          const data = { value, timestamp };

          // Store in Supabase
          const storeData = async () => {
            const { error } = await supabase
              .from('sensor_logs')
              .insert([{
                sensor_type: topic.split('/')[1],
                value,
                timestamp,
                topic,
                raw_message: payload
              }]);

            if (error) console.error('Error storing sensor data:', error);
          };

          storeData();

          // Update state based on topic
          switch (topic) {
            case 'waterqualitymonitoring/pHsensor':
              setPhData(data);
              break;
            case 'waterqualitymonitoring/TDSsensor':
              setTdsData(data);
              break;
            case 'waterqualitymonitoring/phosphatesensor':
              setPhosphateData(data);
              break;
            case 'waterqualitymonitoring/Levelsensor':
              setLevelData(data);
              break;
          }
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      });
    }
  }, [mqttClient]);

  const SensorWidget = ({ 
    title, 
    value, 
    icon: Icon, 
    unit, 
    trend,
    iconColor,
    type
  }: { 
    title: string;
    value: number | null;
    icon: React.ElementType;
    unit: string;
    trend?: 'up' | 'down' | 'stable';
    iconColor: string;
    type: 'ph' | 'tds' | 'phosphate' | 'level';
  }) => {
    const phClassification = value !== null && type === 'ph' 
      ? getPHClassification(value) 
      : null;

    const getWidgetStyles = (type: string) => {
      switch(type) {
        case 'ph':
          return {
            gradient: 'bg-gradient-to-br from-blue-100 via-blue-50 to-white',
            border: 'border-blue-200',
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-700'
          };
        case 'tds':
          return {
            gradient: 'bg-gradient-to-br from-emerald-100 via-emerald-50 to-white',
            border: 'border-emerald-200',
            iconBg: 'bg-emerald-100',
            iconColor: 'text-emerald-700'
          };
        case 'phosphate':
          return {
            gradient: 'bg-gradient-to-br from-violet-100 via-violet-50 to-white',
            border: 'border-violet-200',
            iconBg: 'bg-violet-100',
            iconColor: 'text-violet-700'
          };
        case 'level':
          return {
            gradient: 'bg-gradient-to-br from-amber-100 via-amber-50 to-white',
            border: 'border-amber-200',
            iconBg: 'bg-amber-100',
            iconColor: 'text-amber-700'
          };
        default:
          return {
            gradient: 'bg-white',
            border: 'border-gray-200',
            iconBg: 'bg-gray-100',
            iconColor: 'text-gray-700'
          };
      }
    };

    const styles = getWidgetStyles(type);

    return (
      <div className={`${styles.gradient} rounded-2xl shadow-md p-6 hover:shadow-lg transition-all duration-300 border ${styles.border}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${styles.iconBg}`}>
              <Icon className={`h-5 w-5 ${styles.iconColor}`} />
            </div>
            <h3 className="text-sm font-medium text-gray-900 ml-2">{title}</h3>
          </div>
          {trend && (
            <div className={`flex items-center px-2 py-1 rounded-full ${
              trend === 'up' ? 'bg-green-100 text-green-700' : 
              trend === 'down' ? 'bg-red-100 text-red-700' : 
              'bg-gray-100 text-gray-700'
            }`}>
              <TrendingUp className={`h-4 w-4 ${trend === 'down' ? 'transform rotate-180' : ''}`} />
              <span className="text-xs ml-1 font-medium">2.5%</span>
            </div>
          )}
        </div>
        <div className="mt-4">
          {type === 'ph' ? (
            <>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-gray-900">
                  {value !== null ? `${value.toFixed(2)} ${unit}` : 'No data'}
                </div>
              </div>
              {phClassification && (
                <div className={`mt-2 flex items-center rounded-lg p-2 ${styles.iconBg}`}>
                  <AlertCircle className={`h-5 w-5 ${phClassification.color}`} />
                  <span className={`text-lg ml-2 font-semibold ${phClassification.color}`}>
                    {phClassification.label}
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="text-3xl font-bold text-gray-900">
              {value !== null ? `${value.toFixed(2)} ${unit}` : 'No data'}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Water Quality Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time monitoring of water quality parameters</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleStartReading}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors duration-200"
          >
            <Play className="h-4 w-4 mr-2" />
            Start Reading
          </button>
          <button
            onClick={handleResetReading}
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors duration-200"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset Reading
          </button>
          <button
            onClick={handleTestData}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            <Zap className="h-4 w-4 mr-2" />
            Generate Test Data
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SensorWidget
          title="pH Level"
          value={phData?.value ?? null}
          icon={Droplets}
          unit="pH"
          trend="up"
          iconColor="text-blue-700"
          type="ph"
        />
        <SensorWidget
          title="TDS Level"
          value={tdsData?.value ?? null}
          icon={Thermometer}
          unit="ppm"
          trend="stable"
          iconColor="text-emerald-700"
          type="tds"
        />
        <SensorWidget
          title="Phosphate Level"
          value={phosphateData?.value ?? null}
          icon={Waves}
          unit="mg/L"
          trend="down"
          iconColor="text-violet-700"
          type="phosphate"
        />
        <SensorWidget
          title="Water Level"
          value={levelData?.value ?? null}
          icon={Gauge}
          unit="%"
          trend="up"
          iconColor="text-amber-700"
          type="level"
        />
      </div>
    </div>
  );
}