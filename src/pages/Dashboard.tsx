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
  AlertCircle,
  LucideIcon,
  TrendingDown,
  Minus
} from 'lucide-react';
import { useMQTTStore } from '../lib/mqtt';
import { supabase } from '../lib/supabase';
import { AIAnalyticsWidget } from '../components/AIAnalyticsWidget';
import { generateWaterQualityAnalysis } from '../lib/gemini';

interface SensorData {
  value: number;
  timestamp: Date;
}

interface PHClassification {
  range: [number, number];
  label: string;
  color: string;
}

interface TDSClassification {
  range: [number, number];
  label: string;
  status: string;
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

const tdsClassifications: TDSClassification[] = [
  { 
    range: [0, 50], 
    label: 'Ultra Pure Water', 
    status: 'Nearly distilled water, may lack beneficial minerals',
    color: 'text-blue-600'
  },
  { 
    range: [51, 150], 
    label: 'Excellent Drinking Water', 
    status: 'Very low mineral content, ideal for drinking',
    color: 'text-green-600'
  },
  { 
    range: [151, 250], 
    label: 'Good Drinking Water', 
    status: 'Contains some minerals, generally preferred taste',
    color: 'text-green-500'
  },
  { 
    range: [251, 350], 
    label: 'Fair Drinking Water', 
    status: 'Acceptable for drinking, may notice slight taste difference',
    color: 'text-yellow-500'
  },
  { 
    range: [351, 500], 
    label: 'Poor Drinking Water', 
    status: 'May have noticeable taste, not recommended for long-term consumption',
    color: 'text-orange-500'
  },
  { 
    range: [501, 900], 
    label: 'Marginal (Not Recommended)', 
    status: 'Possible contamination, should be treated before drinking',
    color: 'text-red-500'
  },
  { 
    range: [901, 1200], 
    label: 'Very Poor (Avoid Drinking)', 
    status: 'Likely contains harmful contaminants, unsafe for consumption',
    color: 'text-red-600'
  },
  { 
    range: [1201, Infinity], 
    label: 'Unacceptable', 
    status: 'Potentially hazardous, should not be used for drinking or cooking',
    color: 'text-red-700'
  }
];

const getPHClassification = (value: number): PHClassification | null => {
  return phClassifications.find(
    classification => 
      value >= classification.range[0] && value <= classification.range[1]
  ) || null;
};

const getTDSClassification = (value: number): TDSClassification | null => {
  return tdsClassifications.find(
    classification => 
      value >= classification.range[0] && value <= classification.range[1]
  ) || null;
};

const MQTT_TOPICS = {
  pH: 'waterqualitymonitoring/pHsensor',
  TDS: 'waterqualitymonitoring/TDSsensor',
  phosphate: 'waterqualitymonitoring/phosphatesensor',
  level: 'waterqualitymonitoring/Levelsensor',
};

console.log('MQTT Topics configuration:', MQTT_TOPICS);

export default function Dashboard() {
  const [phData, setPhData] = useState<SensorData | null>(null);
  const [tdsData, setTdsData] = useState<SensorData | null>(null);
  const [phosphateData, setPhosphateData] = useState<SensorData | null>(null);
  const [levelData, setLevelData] = useState<SensorData | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [lastAnalysisUpdate, setLastAnalysisUpdate] = useState<Date | null>(null);
  
  const mqttClient = useMQTTStore(state => state.client);
  const publish = useMQTTStore(state => state.publish);

  const generateSampleData = () => {
    // Generate random values within realistic ranges
    const timestamp = new Date().toISOString();
    
    // Format messages as JSON objects matching the expected format
    const phMessage = JSON.stringify({
      value: parseFloat((Math.random() * (8.5 - 6.5) + 6.5).toFixed(2)),
      timestamp,
      unit: 'pH'
    });

    const tdsMessage = JSON.stringify({
      value: Math.floor(Math.random() * (1000 - 200) + 200),
      timestamp,
      unit: 'ppm'
    });

    const phosphateMessage = JSON.stringify({
      value: parseFloat((Math.random() * (2.0 - 0.5) + 0.5).toFixed(2)),
      timestamp,
      unit: 'mg/L'
    });

    const levelMessage = JSON.stringify({
      value: Math.floor(Math.random() * (100 - 20) + 20),
      timestamp,
      unit: '%'
    });

    // Publish formatted JSON messages
    publish(MQTT_TOPICS.pH, phMessage);
    publish(MQTT_TOPICS.TDS, tdsMessage);
    publish(MQTT_TOPICS.phosphate, phosphateMessage);
    publish(MQTT_TOPICS.level, levelMessage);
  };

  const handleStartReading = () => {
    publish('waterqualitymonitoring/start', 'start');
  };

  const handleResetReading = () => {
    publish('waterqualitymonitoring/reset', 'reset');
  };

  const handleTestData = () => {
    generateSampleData();
  };

  const updateAnalysis = async () => {
    setAnalysisLoading(true);
    try {
      const sensorData = {
        ph: phData?.value ?? null,
        tds: tdsData?.value ?? null,
        phosphate: phosphateData?.value ?? null,
        level: levelData?.value ?? null
      };

      // Only generate analysis if we have at least some data
      if (Object.values(sensorData).some(value => value !== null)) {
        const newAnalysis = await generateWaterQualityAnalysis(sensorData);
        setAnalysis(newAnalysis);
        setLastAnalysisUpdate(new Date());
      }
    } catch (error) {
      console.error('Error updating analysis:', error);
    } finally {
      setAnalysisLoading(false);
    }
  };

  useEffect(() => {
    if (mqttClient) {
      mqttClient.on('message', (topic, message) => {
        try {
          console.log('Raw message received:', message.toString());
          
          // Parse the JSON message
          const messageData = JSON.parse(message.toString());
          const value = Number(messageData.value);
          const timestamp = new Date(messageData.timestamp);
          const data = { value, timestamp };

          console.log(`Processed data for ${topic}:`, data);

          // Only store and update state if value is valid
          if (!isNaN(value)) {
            // Store in Supabase
            const storeData = async () => {
              const { error } = await supabase
                .from('sensor_logs')
                .insert([{
                  sensor_type: topic.split('/')[1],
                  value,
                  timestamp,
                  topic,
                  raw_message: messageData
                }]);

              if (error) console.error('Error storing sensor data:', error);
            };

            storeData();

            // Update state based on topic
            switch (topic) {
              case MQTT_TOPICS.pH:
                console.log('Setting pH data:', data);
                setPhData(data);
                break;
              case MQTT_TOPICS.TDS:
                console.log('Setting TDS data:', data);
                setTdsData(data);
                break;
              case MQTT_TOPICS.phosphate:
                console.log('Setting phosphate data:', data);
                setPhosphateData(data);
                break;
              case MQTT_TOPICS.level:
                console.log('Setting level data:', data);
                setLevelData(data);
                break;
            }
          } else {
            console.error('Invalid numeric value received:', messageData.value);
          }
        } catch (error) {
          console.error('Error processing message:', error);
          console.error('Message that caused error:', message.toString());
        }
      });
    }
  }, [mqttClient]);

  useEffect(() => {
    updateAnalysis();
  }, [phData, tdsData, phosphateData, levelData]);

  const SensorWidget = ({ 
    title, 
    value, 
    icon: Icon, 
    unit, 
    trend,
    type
  }: { 
    title: string;
    value: number | null;
    icon: LucideIcon;
    unit: string;
    trend: 'up' | 'down' | 'stable';
    type: 'ph' | 'tds' | 'phosphate' | 'level';
  }) => {
    console.log(`Rendering ${title} widget with value:`, value);
    
    const getWidgetStyles = (type: string) => {
      switch(type) {
        case 'ph':
          return {
            gradient: 'bg-gradient-to-br from-blue-100 via-blue-50 to-white',
            border: 'border-blue-200',
            iconBg: 'bg-blue-100'
          };
        case 'tds':
          return {
            gradient: 'bg-gradient-to-br from-emerald-100 via-emerald-50 to-white',
            border: 'border-emerald-200',
            iconBg: 'bg-emerald-100'
          };
        case 'phosphate':
          return {
            gradient: 'bg-gradient-to-br from-violet-100 via-violet-50 to-white',
            border: 'border-violet-200',
            iconBg: 'bg-violet-100'
          };
        case 'level':
          return {
            gradient: 'bg-gradient-to-br from-amber-100 via-amber-50 to-white',
            border: 'border-amber-200',
            iconBg: 'bg-amber-100'
          };
        default:
          return {
            gradient: 'bg-white',
            border: 'border-gray-200',
            iconBg: 'bg-gray-100'
          };
      }
    };

    const styles = getWidgetStyles(type);
    const phClassification = value !== null && type === 'ph' 
      ? getPHClassification(value) 
      : null;
    const tdsClassification = value !== null && type === 'tds'
      ? getTDSClassification(value)
      : null;

    const formatValue = (val: number | null): string => {
      if (val === null || isNaN(val)) return 'No data';
      try {
        // Ensure val is a number and handle potential decimal places appropriately
        const numValue = Number(val);
        return `${numValue.toFixed(2)} ${unit}`;
      } catch (error) {
        console.error('Error formatting value:', error);
        return 'Error';
      }
    };

    return (
      <div className={`${styles.gradient} rounded-2xl shadow-md p-6 border ${styles.border}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${styles.iconBg}`}>
              <Icon className="h-5 w-5 text-gray-700" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 ml-2">
              {title}
            </h3>
          </div>
          <div className={`flex items-center px-2 py-1 rounded-full ${
            trend === 'up' ? 'bg-green-50 text-green-700' :
            trend === 'down' ? 'bg-red-50 text-red-700' :
            'bg-gray-50 text-gray-700'
          }`}>
            {trend === 'up' ? <TrendingUp size={16} /> :
             trend === 'down' ? <TrendingDown size={16} /> :
             <Minus size={16} />}
          </div>
        </div>

        <div className="mt-2">
          {type === 'tds' ? (
            <>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-gray-900">
                  {formatValue(value)}
                </div>
              </div>
              {tdsClassification && (
                <div className="flex flex-col gap-1">
                  <div className={`mt-2 flex items-center rounded-lg p-2 ${styles.iconBg}`}>
                    <AlertCircle className={`h-5 w-5 ${tdsClassification.color}`} />
                    <span className={`text-lg ml-2 font-semibold ${tdsClassification.color}`}>
                      {tdsClassification.label}
                    </span>
                  </div>
                  <p className={`text-sm ${tdsClassification.color} ml-2`}>
                    {tdsClassification.status}
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="text-3xl font-bold text-gray-900">
              {formatValue(value)}
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
        <div className="flex flex-wrap gap-2">
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
 
        </div>
      </div>



      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SensorWidget
          title="pH"
          value={phData?.value ?? null}
          icon={Thermometer}
          unit="pH"
          trend={phData?.value ? (phData.value > 7 ? 'up' : 'down') : 'stable'}
          type="ph"
        />
        <SensorWidget
          title="TDS"
          value={tdsData?.value ?? null}
          icon={Droplets}
          unit="ppm"
          trend={tdsData?.value ? (tdsData.value > 500 ? 'up' : 'down') : 'stable'}
          type="tds"
        />
        <SensorWidget
          title="Phosphate"
          value={phosphateData?.value ?? null}
          icon={Waves}
          unit="mg/L"
          trend={phosphateData?.value ? (phosphateData.value > 0.5 ? 'up' : 'down') : 'stable'}
          type="phosphate"
        />
        <SensorWidget
          title="Level"
          value={levelData?.value ?? null}
          icon={Gauge}
          unit="%"
          trend={levelData?.value ? (levelData.value > 50 ? 'up' : 'down') : 'stable'}
          type="level"
        />
      </div>

      <div className="mt-6">
        <AIAnalyticsWidget
          analysis={analysis}
          loading={analysisLoading}
          lastUpdated={lastAnalysisUpdate}
        />
      </div>
    </div>
  );
}