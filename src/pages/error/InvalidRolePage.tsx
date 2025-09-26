import React from 'react';

const InvalidRolePage: React.FC = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-red-50">
    <div className="bg-white p-8 rounded shadow text-center">
      <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
      <p className="text-lg text-gray-700 mb-2">
        Your account does not have a valid role assigned.<br />
        Please contact support or try logging in again.
      </p>
      <a href="/" className="text-blue-600 underline">Return to Homepage</a>
    </div>
  </div>
);

export default InvalidRolePage;
