import React from 'react';
import { departmentData } from './data';

const DashboardPage = () => {
  return (
    <div>
      {departmentData.map((department) => (
        <div key={department.id} className={`${department.headerColor}`}>
          <h2>{department.name}</h2>
          <div className={`${department.contentBgColor}`}>
            {department.members.map((member) => (
              <div key={member.id}>{member.name}</div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardPage;

const departmentData = [
  {
    id: "finance",
    name: "Finance",
    headerColor: "bg-department-finance-green",
    contentBgColor: "bg-card-content-finance",
    members: [],
    isAvailable: true,
    href: "/finance/dashboard"
  },
  // Other department objects here
];
