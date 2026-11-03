import React from 'react';
import { Award, CheckCircle, AlertTriangle, AlertOctagon } from 'lucide-react';

const CategoryBadge = ({ category, showIcon = true, size = 'md' }) => {
  let badgeClass = 'badge-blue';
  let Icon = CheckCircle;

  switch (category) {
    case 'Excellent':
      badgeClass = 'badge-emerald';
      Icon = Award;
      break;
    case 'Good':
      badgeClass = 'badge-blue';
      Icon = CheckCircle;
      break;
    case 'Average':
      badgeClass = 'badge-amber';
      Icon = AlertTriangle;
      break;
    case 'Needs Improvement':
      badgeClass = 'badge-rose';
      Icon = AlertOctagon;
      break;
    default:
      badgeClass = 'badge-blue';
      Icon = CheckCircle;
  }

  const paddingStyle = size === 'sm' ? { padding: '2px 8px', fontSize: '11px' } : { padding: '4px 10px', fontSize: '12px' };

  return (
    <span className={`badge ${badgeClass}`} style={paddingStyle}>
      {showIcon && <Icon size={size === 'sm' ? 12 : 14} />}
      <span>{category}</span>
    </span>
  );
};

export default CategoryBadge;
