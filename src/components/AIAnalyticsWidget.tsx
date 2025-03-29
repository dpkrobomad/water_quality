import React, { useState } from 'react';
import { Brain, AlertCircle, Settings, Activity, FileText } from 'lucide-react';

interface AIAnalyticsWidgetProps {
  analysis: string | null;
  loading: boolean;
  lastUpdated: Date | null;
}

interface AnalysisData {
  summary: string;
  parameters: {
    [key: string]: {
      reading: string;
      analysis: {
        [key: string]: string;
      };
    };
  };
  recommendations: {
    priority: string;
    action: string;
    reason: string;
  }[];
  safetyNotes: {
    immediateActions: string[];
    consumptionGuidelines: string;
    // maintenanceSafety: string;
    // systemSafety: string;
  };
}

type TabType = 'summary' | 'analysis' | 'recommendations' | 'safety';

export function AIAnalyticsWidget({ analysis, loading, lastUpdated }: AIAnalyticsWidgetProps) {
  const [activeTab, setActiveTab] = useState<TabType>('summary');

  const formatKey = (key: string) => {
    // Convert to camel case and add spaces before capital letters
    return key
      .split(/(?=[A-Z])/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const renderSummaryTab = (data: AnalysisData) => {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">Overall Water Quality</h4>
          <p className="text-sm text-gray-700 leading-relaxed">
            {data.summary}
          </p>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">Critical Points</h4>
          {data.recommendations
            .filter(rec => rec.priority === 'high')
            .map((rec, index) => (
              <div key={index} className="mb-2 text-sm text-red-600">
                • {rec.action}
              </div>
            ))}
        </div>
      </div>
    );
  };

  const renderAnalysisTab = (data: AnalysisData) => {
    return (
      <div className="space-y-4">
        {Object.entries(data.parameters).map(([param, info]) => (
          <div key={param} className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="bg-blue-50 p-3 flex items-center justify-between rounded-t-lg">
              <h4 className="text-base font-medium text-blue-900">
                {param.charAt(0).toUpperCase() + param.slice(1)}
              </h4>
              <span className="text-sm font-bold text-blue-700">
                {info.reading}
              </span>
            </div>
            <div className="p-4 space-y-2">
              {Object.entries(info.analysis).map(([key, value]) => (
                <div key={key} className="text-sm">
                  <span className="font-bold text-gray-900">
                    {formatKey(key)}:
                  </span>{' '}
                  <span className="text-gray-700">{value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  
  const renderRecommendationsTab = (data: AnalysisData) => {
    return (
      <div className="space-y-4">
        {data.recommendations.map((rec, index) => (
          <div key={index} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center mb-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {rec.priority.toUpperCase()}
              </span>
            </div>
            <h4 className="font-medium text-gray-900 mb-1">{rec.action}</h4>
            <p className="text-sm text-gray-600">{rec.reason}</p>
          </div>
        ))}
      </div>
    );
  };

  const renderSafetyTab = (data: AnalysisData) => {
    return (
      <div className="space-y-4">
        {data.safetyNotes.immediateActions.map((action, index) => (
          <div key={index} className="bg-red-50 rounded-lg p-4 border border-red-200">
            <p className="text-sm text-red-700">{action}</p>
          </div>
        ))}
        
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <h4 className="font-medium text-gray-900 mb-2">
            {formatKey('consumptionGuidelines')}
          </h4>
          <p className="text-sm text-gray-700">{data.safetyNotes.consumptionGuidelines}</p>
        </div>

    
      </div>
    );
  };

  const formatAnalysis = (text: string) => {
    try {
      const cleanedText = text
        .replace(/```json\s*/, '')
        .replace(/```\s*$/, '')
        .trim();

      const data: AnalysisData = JSON.parse(cleanedText);
      
      switch (activeTab) {
        case 'summary':
          return renderSummaryTab(data);
        case 'analysis':
          return renderAnalysisTab(data);
        case 'recommendations':
          return renderRecommendationsTab(data);
        case 'safety':
          return renderSafetyTab(data);
        default:
          return null;
      }
    } catch (error) {
      console.error('Error parsing analysis:', error);
      // Add more detailed error information for debugging
      if (error instanceof Error) {
        return (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 font-medium">Error formatting analysis data:</p>
            <p className="text-red-600 mt-1">{error.message}</p>
            <p className="text-red-500 text-sm mt-2">Raw response:</p>
            <pre className="mt-1 p-2 bg-red-100 rounded text-sm overflow-auto">
              {text}
            </pre>
          </div>
        );
      }
      return <div className="text-red-500">Error formatting analysis data</div>;
    }
  };

  return (
    <div className="bg-white md:rounded-xl shadow-lg border border-gray-200 max-w-full overflow-hidden">
      {/* Mobile-optimized Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="p-4 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center">
            <Brain className="h-6 w-6 text-blue-600 mr-2 md:h-7 md:w-7" />
            <h2 className="text-lg md:text-2xl font-bold text-gray-900">
              Water Quality
            </h2>
          </div>
          {lastUpdated && (
            <span className="text-xs md:text-sm text-gray-500">
              {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>

        {/* Mobile Tab Navigation */}
        <div className="flex border-b border-gray-200 bg-white overflow-x-auto">
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex-1 min-w-[100px] py-3 px-4 text-sm font-medium flex items-center justify-center ${
              activeTab === 'summary' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
            }`}
          >
            <FileText className="h-4 w-4 mr-1" />
            Summary
          </button>
          <button
            onClick={() => setActiveTab('analysis')}
            className={`flex-1 min-w-[100px] py-3 px-4 text-sm font-medium flex items-center justify-center ${
              activeTab === 'analysis' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
            }`}
          >
            <Activity className="h-4 w-4 mr-1" />
            Analysis
          </button>
          <button
            onClick={() => setActiveTab('recommendations')}
            className={`flex-1 min-w-[100px] py-3 px-4 text-sm font-medium flex items-center justify-center ${
              activeTab === 'recommendations' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
            }`}
          >
            <Settings className="h-4 w-4 mr-1" />
            Recommendations
          </button>
          <button
            onClick={() => setActiveTab('safety')}
            className={`flex-1 min-w-[100px] py-3 px-4 text-sm font-medium flex items-center justify-center ${
              activeTab === 'safety' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
            }`}
          >
            <AlertCircle className="h-4 w-4 mr-1" />
            Safety
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 md:p-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-3 border-blue-600 border-t-transparent"></div>
          </div>
        ) : analysis ? (
          <div className="space-y-4">
            {formatAnalysis(analysis)}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 text-base">
              No analysis available
            </p>
          </div>
        )}
      </div>

      {/* Mobile Action Button */}
      <div className="fixed bottom-4 right-4 md:hidden">
        <button className="h-12 w-12 bg-blue-600 rounded-full shadow-lg flex items-center justify-center text-white">
          <Brain className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
} 