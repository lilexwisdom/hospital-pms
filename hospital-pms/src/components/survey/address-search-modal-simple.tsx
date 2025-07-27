'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

declare global {
  interface Window {
    daum: any;
  }
}

interface AddressSearchModalSimpleProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAddress: (data: {
    postalCode: string;
    address: string;
    addressType: string;
    bname: string;
    buildingName: string;
  }) => void;
}

export function AddressSearchModalSimple({
  isOpen,
  onClose,
  onSelectAddress,
}: AddressSearchModalSimpleProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    // Check if script is already loaded
    if (window.daum && window.daum.Postcode) {
      console.log('Daum Postcode already loaded');
      setIsScriptLoaded(true);
      return;
    }

    // Load Daum Postcode script
    const script = document.createElement('script');
    script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
    script.async = true;
    script.onload = () => {
      console.log('Daum Postcode script loaded successfully');
      setIsScriptLoaded(true);
    };
    script.onerror = () => {
      console.error('Failed to load Daum Postcode script');
      setLoadError('주소 검색 서비스를 불러올 수 없습니다.');
    };
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (isOpen && isScriptLoaded && modalRef.current) {
      // Clear and initialize
      modalRef.current.innerHTML = '';
      
      try {
        const postcodeInstance = new window.daum.Postcode({
          oncomplete: function (data: any) {
            let fullAddress = data.address;
            let extraAddress = '';

            if (data.userSelectedType === 'R') {
              fullAddress = data.roadAddress;
              
              if (data.bname !== '' && /[동|로|가]$/g.test(data.bname)) {
                extraAddress += data.bname;
              }
              if (data.buildingName !== '' && data.apartment === 'Y') {
                extraAddress += extraAddress !== '' ? ', ' + data.buildingName : data.buildingName;
              }
              if (extraAddress !== '') {
                extraAddress = ' (' + extraAddress + ')';
              }
              fullAddress += extraAddress;
            } else {
              fullAddress = data.jibunAddress;
            }

            onSelectAddress({
              postalCode: data.zonecode,
              address: fullAddress,
              addressType: data.userSelectedType,
              bname: data.bname,
              buildingName: data.buildingName,
            });

            onClose();
          },
          width: '100%',
          height: '100%'
        });
        
        postcodeInstance.embed(modalRef.current);
        console.log('Postcode embedded in simple modal');
      } catch (error) {
        console.error('Error initializing Daum Postcode:', error);
        setLoadError('주소 검색 서비스 초기화 중 오류가 발생했습니다.');
      }
    }
  }, [isOpen, isScriptLoaded, onSelectAddress, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-[500px] h-[600px] mx-4">
        {/* Header */}
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">주소 검색</h2>
            <p className="text-sm text-muted-foreground">
              도로명, 지번, 건물명으로 검색할 수 있습니다
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Content */}
        <div className="p-4 h-[calc(100%-80px)]">
          <div 
            ref={modalRef}
            className="w-full h-full bg-white border rounded"
            style={{ minHeight: '400px' }}
          />
          
          {!isScriptLoaded && !loadError && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-sm text-muted-foreground">주소 검색 서비스를 불러오는 중...</p>
              </div>
            </div>
          )}
          
          {loadError && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80">
              <div className="text-center space-y-4">
                <p className="text-sm text-destructive">{loadError}</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.location.reload()}
                >
                  다시 시도
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}