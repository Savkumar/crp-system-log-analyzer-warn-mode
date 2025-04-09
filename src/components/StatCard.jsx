import React from 'react';

const StatCard = ({ 
  title, 
  value, 
  color = 'blue', 
  details,
  // Additional stats props
  min,
  max,
  avg,
  median,
  className
}) => {
  const colorMap = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600',
    red: 'text-red-600'
  };
  
  const textColorClass = className || (colorMap[color] || 'text-blue-600');
  
  // If min/max/avg/median are provided, render a stats card
  if (min !== undefined || max !== undefined || avg !== undefined || median !== undefined) {
    return (
      <div className="bg-white p-4 rounded-lg shadow flex-1 mb-2">
        <h3 className="text-lg font-medium mb-2 text-center">{title}</h3>
        <div className="grid grid-cols-4 gap-2">
          {min !== undefined && (
            <div>
              <div className="text-xs text-gray-500">Min</div>
              <div className="text-sm font-medium">{min}</div>
            </div>
          )}
          {max !== undefined && (
            <div>
              <div className="text-xs text-gray-500">Max</div>
              <div className="text-sm font-medium">{max}</div>
            </div>
          )}
          {avg !== undefined && (
            <div>
              <div className="text-xs text-gray-500">Avg</div>
              <div className="text-sm font-medium">{avg}</div>
            </div>
          )}
          {median !== undefined && (
            <div>
              <div className="text-xs text-gray-500">Median</div>
              <div className="text-sm font-medium">{median}</div>
            </div>
          )}
        </div>
        {details && <div className="text-sm text-gray-500 mt-2">{details}</div>}
      </div>
    );
  }
  
  // Otherwise, render a simple value card
  return (
    <div className="bg-white p-4 rounded-lg shadow flex-1 mb-2">
      <h3 className="text-lg font-medium mb-2 text-center">{title}</h3>
      <div className={`text-xl font-bold ${textColorClass} text-center`}>{value}</div>
      {details && <div className="text-sm text-gray-500 text-center">{details}</div>}
    </div>
  );
};

export default StatCard;
