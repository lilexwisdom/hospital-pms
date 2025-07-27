'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

declare global {
  interface Window {
    daum: any;
  }
}

export default function TestDaumPostcodePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toISOString()}] ${message}`]);
    console.log(message);
  };

  useEffect(() => {
    addLog('Component mounted');
    
    // Check if script is already loaded
    if (window.daum && window.daum.Postcode) {
      addLog('Daum Postcode already loaded');
      setIsScriptLoaded(true);
      return;
    }

    // Load Daum Postcode script
    const script = document.createElement('script');
    script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
    script.async = true;
    script.onload = () => {
      addLog('Daum Postcode script loaded successfully');
      setIsScriptLoaded(true);
    };
    script.onerror = () => {
      const errorMsg = 'Failed to load Daum Postcode script';
      addLog(errorMsg);
      setError(errorMsg);
    };
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  const showPostcode = () => {
    if (!isScriptLoaded) {
      addLog('Script not loaded yet');
      return;
    }

    if (!containerRef.current) {
      addLog('Container ref is null');
      return;
    }

    // Clear container
    containerRef.current.innerHTML = '';
    addLog('Container cleared');

    try {
      const postcodeInstance = new window.daum.Postcode({
        oncomplete: function(data: any) {
          addLog(`Address selected: ${data.address}`);
          setSelectedAddress(data);
        },
        width: '100%',
        height: '100%',
        maxSuggestItems: 5
      });

      postcodeInstance.embed(containerRef.current);
      addLog('Postcode instance embedded');

      // Check if iframe was created
      setTimeout(() => {
        const iframe = containerRef.current?.querySelector('iframe');
        if (iframe) {
          addLog(`Iframe found - dimensions: ${iframe.offsetWidth}x${iframe.offsetHeight}`);
          
          // Log iframe styles
          const computedStyle = window.getComputedStyle(iframe);
          addLog(`Iframe display: ${computedStyle.display}`);
          addLog(`Iframe visibility: ${computedStyle.visibility}`);
          addLog(`Iframe opacity: ${computedStyle.opacity}`);
          addLog(`Iframe position: ${computedStyle.position}`);
          
          // Check parent styles
          const parentStyle = window.getComputedStyle(containerRef.current!);
          addLog(`Container display: ${parentStyle.display}`);
          addLog(`Container dimensions: ${containerRef.current!.offsetWidth}x${containerRef.current!.offsetHeight}`);
        } else {
          addLog('No iframe found in container');
        }
      }, 100);
    } catch (err) {
      const errorMsg = `Error creating postcode instance: ${err}`;
      addLog(errorMsg);
      setError(errorMsg);
    }
  };

  const showPostcodePopup = () => {
    if (!isScriptLoaded) {
      addLog('Script not loaded yet');
      return;
    }

    try {
      new window.daum.Postcode({
        oncomplete: function(data: any) {
          addLog(`Popup - Address selected: ${data.address}`);
          setSelectedAddress(data);
        }
      }).open();
      addLog('Postcode popup opened');
    } catch (err) {
      const errorMsg = `Error opening popup: ${err}`;
      addLog(errorMsg);
      setError(errorMsg);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Daum Postcode Test Page</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Test Controls</h2>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Script Status: {isScriptLoaded ? 'Loaded ✓' : 'Loading...'}
              </p>
              {error && (
                <p className="text-sm text-destructive">Error: {error}</p>
              )}
            </div>

            <div className="space-y-2">
              <Button 
                onClick={showPostcode} 
                disabled={!isScriptLoaded}
                className="w-full"
              >
                Show Embedded Postcode
              </Button>
              
              <Button 
                onClick={showPostcodePopup} 
                disabled={!isScriptLoaded}
                variant="outline"
                className="w-full"
              >
                Show Popup Postcode
              </Button>
            </div>

            {selectedAddress && (
              <div className="mt-4 p-4 bg-muted rounded-md">
                <h3 className="font-semibold mb-2">Selected Address:</h3>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(selectedAddress, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Debug Logs</h2>
          <div className="h-96 overflow-auto bg-muted rounded-md p-4">
            <pre className="text-xs font-mono">
              {logs.join('\n') || 'No logs yet...'}
            </pre>
          </div>
        </Card>
      </div>

      <Card className="mt-6 p-6">
        <h2 className="text-lg font-semibold mb-4">Embedded Container</h2>
        <div 
          ref={containerRef}
          className="w-full h-[500px] border-2 border-dashed border-muted-foreground rounded-md"
          style={{
            minHeight: '500px',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Click "Show Embedded Postcode" to load here
          </div>
        </div>
      </Card>
    </div>
  );
}