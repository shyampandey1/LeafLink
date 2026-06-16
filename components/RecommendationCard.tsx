
import React from 'react';
import { AiRecommendation } from '../types.ts';
import { AlertTriangleIcon, CheckCircleIcon, InfoIcon } from '../constants.tsx';

interface RecommendationCardProps {
  recommendation: AiRecommendation;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({ recommendation }) => {
  const urgencyConfig = {
    urgent: {
      bgColor: 'bg-red-100 dark:bg-red-900/50',
      borderColor: 'border-red-500 dark:border-red-400',
      textColor: 'text-red-800 dark:text-red-200',
      icon: <AlertTriangleIcon className="w-6 h-6 text-red-500 dark:text-red-400" />,
      title: 'Urgent Action Needed',
    },
    normal: {
      bgColor: 'bg-amber-100 dark:bg-amber-900/50',
      borderColor: 'border-amber-500 dark:border-amber-400',
      textColor: 'text-amber-800 dark:text-amber-200',
      icon: <InfoIcon className="w-6 h-6 text-amber-500 dark:text-amber-400" />,
      title: 'Care Suggestion',
    },
    optimal: {
      bgColor: 'bg-green-100 dark:bg-green-900/50',
      borderColor: 'border-green-500 dark:border-green-400',
      textColor: 'text-green-800 dark:text-green-200',
      icon: <CheckCircleIcon className="w-6 h-6 text-green-500 dark:text-green-400" />,
      title: 'Optimal Conditions',
    },
  };

  const config = urgencyConfig[recommendation.urgency];

  return (
    <div className={`p-4 rounded-lg border-l-4 ${config.bgColor} ${config.borderColor} ${config.textColor}`}>
      <div className="flex">
        <div className="flex-shrink-0">{config.icon}</div>
        <div className="ml-3">
          <p className="text-sm font-bold">{config.title}</p>
          <p className="mt-1 text-sm">{recommendation.suggestion}</p>
        </div>
      </div>
    </div>
  );
};

export default RecommendationCard;