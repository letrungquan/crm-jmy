
import React from 'react';
import { Lead, Sale } from '../types';
import LeadCard from './LeadCard';

interface LeadListProps {
  leads: Lead[];
  sales: Sale[];
  onSelectLead: (lead: Lead) => void;
  sources?: string[];
  selectedSource?: string;
  onSourceChange?: (source: string) => void;
  onDeleteLead?: (leadId: string) => void;
}

const LeadList: React.FC<LeadListProps> = ({ 
  leads, 
  sales, 
  onSelectLead,
  sources,
  selectedSource,
  onSourceChange,
  onDeleteLead
}) => {
  const showFilter = sources && typeof selectedSource !== 'undefined' && onSourceChange;

  if (leads.length === 0 && (!selectedSource || selectedSource === 'all')) {
    return (
      <div className="text-center py-10">
        <p className="text-slate-500">Không có khách hàng nào.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {showFilter && (
        <div className="p-4 mb-4 bg-white rounded-lg shadow">
          <div className="flex items-center">
            <label htmlFor="source-filter-list" className="text-sm font-medium text-slate-600 mr-2">Nguồn:</label>
            <select
              id="source-filter-list"
              value={selectedSource}
              onChange={(e) => onSourceChange(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              {sources.map(source => (
                <option key={source} value={source}>
                  {source === 'all' ? 'Tất cả nguồn' : source}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {leads.length === 0 && selectedSource && selectedSource !== 'all' && (
         <div className="text-center py-10">
          <p className="text-slate-500">Không có khách hàng nào phù hợp với bộ lọc.</p>
        </div>
      )}
      
      <div className="space-y-4">
        {leads.map(lead => (
          <LeadCard
            key={lead.id}
            lead={lead}
            salesperson={sales.find(s => s.id === lead.assignedTo)}
            onClick={() => onSelectLead(lead)}
            onDelete={onDeleteLead ? () => onDeleteLead(lead.id) : undefined}
          />
        ))}
      </div>
    </div>
  );
};

export default LeadList;
