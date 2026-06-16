
import React from 'react';
import { Activity, ActivityType, Plant } from '../types.ts';
import { WaterDropIcon, SunIcon, SnowflakeIcon, BotIcon, ActivityIcon } from '../constants.tsx';

interface ActivityFeedProps {
  activities: Activity[];
  plants: Plant[];
}

const ActivityItem: React.FC<{ activity: Activity; plantName: string }> = ({ activity, plantName }) => {
  const getIcon = (type: ActivityType) => {
    switch (type) {
      case ActivityType.Water: return <WaterDropIcon className="w-5 h-5 text-blue-500" />;
      case ActivityType.Light: return <SunIcon className="w-5 h-5 text-amber-500" />;
      case ActivityType.Cooling: return <SnowflakeIcon className="w-5 h-5 text-sky-500" />;
      case ActivityType.AiRecommendation: return <BotIcon className="w-5 h-5 text-purple-500" />;
      default: return <ActivityIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    });
  };

  return (
    <div className="flex items-start space-x-3">
      <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-2">{getIcon(activity.type)}</div>
      <div className="flex-1">
        <p className="text-sm text-gray-800 dark:text-gray-200">
          <span className="font-bold">{plantName}:</span> {activity.description}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {formatTimestamp(activity.timestamp)}
        </p>
      </div>
    </div>
  );
};

const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities, plants }) => {
  const getPlantName = (plantId: number) => {
    return plants.find(p => p.id === plantId)?.name || 'Unknown Plant';
  };

  const sortedActivities = [...activities].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Recent Activity</h3>
        {sortedActivities.length > 0 ? (
            <div className="space-y-4 max-h-[380px] overflow-y-auto pr-2 recent-activity-scroll">
                {sortedActivities.map(activity => (
                    <ActivityItem key={activity.id} activity={activity} plantName={getPlantName(activity.plantId)} />
                ))}
            </div>
        ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">No recent activity.</p>
        )}
    </div>
  );
};

export default ActivityFeed;