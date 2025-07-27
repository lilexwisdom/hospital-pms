'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function TestPage() {
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[${timestamp}] ${message}`);
  };

  const testSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addLog('Form submitted!');
  };

  const testClick = () => {
    addLog('Button clicked!');
  };

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Survey Submit Test Page</h1>
      
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Test 1: Basic Form Submit</h2>
        <form onSubmit={testSubmit} className="space-y-2">
          <input 
            type="text" 
            placeholder="Test input" 
            className="border p-2 rounded"
          />
          <Button type="submit">Submit Form</Button>
        </form>
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Test 2: Click Handler</h2>
        <Button onClick={testClick}>Click Me</Button>
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Console Logs:</h2>
        <div className="bg-gray-100 p-4 rounded-lg h-64 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-gray-500">No logs yet...</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="font-mono text-sm">{log}</div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}