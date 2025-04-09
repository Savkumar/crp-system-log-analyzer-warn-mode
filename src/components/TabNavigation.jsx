import React from 'react';

const TabNavigation = ({ activeTab, onTabChange, tabs }) => {
  return (
    <div className="mb-4 border-b border-gray-200">
      <div className="flex">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`py-2 px-4 ${
              activeTab === tab.id
                ? 'border-b-2 border-blue-500 font-medium text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TabNavigation;
