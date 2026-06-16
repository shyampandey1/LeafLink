
import React from 'react';
import { BotIcon, CheckCircleIcon, ActivityIcon, SunIcon, WaterDropIcon, AlertTriangleIcon, InfoIcon } from '../constants.tsx';

const GuideSection: React.FC<{ title: string, icon: React.ReactNode, children: React.ReactNode }> = ({ title, icon, children }) => (
    <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-brand-green/10 text-brand-green rounded-lg">
                {icon}
            </div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white">{title}</h4>
        </div>
        <div className="pl-11 text-sm text-gray-600 dark:text-gray-400 space-y-2">
            {children}
        </div>
    </div>
);

const AppGuide: React.FC = () => {
    return (
        <div className="text-left">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Welcome to Your Smart Garden!</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                This guide helps you understand the key features of your dashboard.
            </p>

            <GuideSection title="Plant Cards" icon={<SunIcon className="w-5 h-5"/>}>
                <p>Each card gives you a real-time snapshot of your plant's health and environment. Check metrics like temperature, soil moisture, and light levels at a glance.</p>
                <p>The health indicator (😊, 😐, ☹️) tells you if your plant needs attention.</p>
            </GuideSection>
            
            <GuideSection title="AI Optimization" icon={<BotIcon className="w-5 h-5"/>}>
                <p>Toggle the "AI Optimized" switch to let our smart system take over. It will automatically manage watering and lighting based on your plant's specific needs.</p>
                <p>When enabled, manual controls like <WaterDropIcon className="inline w-4 h-4 text-blue-500"/> Water and <SunIcon className="inline w-4 h-4 text-amber-500"/> Light are disabled.</p>
            </GuideSection>

            <GuideSection title="View Analytics" icon={<ActivityIcon className="w-5 h-5"/>}>
                <p>Click "View Analytics" to open a detailed view with historical data charts. Track your plant's progress over time.</p>
                <p>Here you can also get a personalized care tip from our gardener AI by clicking "Get Care Recommendation".</p>
            </GuideSection>
            
            <GuideSection title="AI Recommendations" icon={<AlertTriangleIcon className="w-5 h-5"/>}>
                <p>Our AI analyzes your plant's data to give you smart suggestions. Recommendations are color-coded by urgency:</p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                    <li className="flex items-center gap-2"><AlertTriangleIcon className="w-4 h-4 text-red-500"/> <span className="font-semibold">Urgent:</span> Immediate action required.</li>
                    <li className="flex items-center gap-2"><InfoIcon className="w-4 h-4 text-amber-500"/> <span className="font-semibold">Normal:</span> A helpful suggestion.</li>
                    <li className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-green-500"/> <span className="font-semibold">Optimal:</span> Everything looks great!</li>
                </ul>
            </GuideSection>
        </div>
    );
};

export default AppGuide;
