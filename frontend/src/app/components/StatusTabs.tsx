"use client";

interface StatusTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  pendingCount: number;
  resolvedCount: number;
  unresolvedCount: number;
}

export default function StatusTabs({ 
  activeTab, 
  setActiveTab, 
  pendingCount, 
  resolvedCount, 
  unresolvedCount 
}: StatusTabsProps) {
  const tabs = [
    { key: 'PENDING', label: 'Pending', count: pendingCount },
    { key: 'RESOLVED', label: 'Resolved', count: resolvedCount },
    { key: 'UNRESOLVED', label: 'Unresolved', count: unresolvedCount },
  ];

  return (
    <div className="flex border-b border-gray-200 mb-6">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => setActiveTab(tab.key)}
          className={`py-3 cursor-pointer px-4 font-medium text-sm relative ${
            activeTab === tab.key
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {tab.label}
          {tab.count > 0 && (
            <span className={`ml-2 rounded-full text-xs px-2 py-1 ${
              activeTab === tab.key 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
