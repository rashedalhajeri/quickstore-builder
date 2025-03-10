
import React from 'react';
import { SignUpForm } from '@/components/SignUpForm';

const Register = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center mb-6">إنشاء حساب جديد</h2>
        <SignUpForm />
      </div>
    </div>
  );
};

export default Register;
