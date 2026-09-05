import React, { useState } from 'react';
import { Header } from './components/Header';
import { NameGenerator } from './components/NameGenerator';
import { TwoFactorAuth } from './components/TwoFactorAuth';
import { EmailAccess } from './components/EmailAccess';
import { FacebookUidChecker } from './components/FacebookUidChecker';
import { IpTracker } from './components/IpTracker';
import { Toast } from './components/Toast';

export default function App() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-indigo-500 selection:text-white pb-6">
      {/* Premium Header */}
      <Header />

      {/* Main Single-Screen Workspace */}
      <main className="max-w-3xl mx-auto w-full px-3 sm:px-4 pt-3 space-y-3">
        {/* 1. USA Female Name Generator */}
        <NameGenerator onShowToast={showToast} />

        {/* 2. 2FA Authenticator */}
        <TwoFactorAuth onShowToast={showToast} />

        {/* 3. Temp Web Email */}
        <EmailAccess onShowToast={showToast} />

        {/* 4. Facebook UID Checker */}
        <FacebookUidChecker onShowToast={showToast} />

        {/* 5. Live IP & Location Tracker */}
        <IpTracker onShowToast={showToast} />
      </main>

      {/* Toast Feedback */}
      <Toast message={toastMessage} />
    </div>
  );
}
