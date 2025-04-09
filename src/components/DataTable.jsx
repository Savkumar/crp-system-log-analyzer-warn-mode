import React from 'react';

const DataTable = ({ 
  data, 
  columns, 
  limit = 10, 
  totalCount = null 
}) => {
  if (!data || !data.length) return <div>No data available</div>;
  
  const displayData = data.slice(0, limit);
  const total = totalCount || data.length;
  
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 border">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column, idx) => (
                <th 
                  key={idx}
                  className={`px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b ${idx > 0 ? 'border-l' : ''}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayData.map((row, rowIdx) => (
              <tr key={rowIdx}>
                {columns.map((column, colIdx) => (
                  <td 
                    key={`${rowIdx}-${colIdx}`} 
                    className={`px-3 py-2 whitespace-nowrap text-xs ${colIdx > 0 ? 'border-l' : ''}`}
                  >
                    {column.render ? column.render(row) : row[column.accessor]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-2 text-sm text-gray-500">
        Showing {Math.min(limit, total)} of {total} entries
      </div>
    </div>
  );
};

export default DataTable;
