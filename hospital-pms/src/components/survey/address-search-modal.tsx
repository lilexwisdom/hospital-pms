'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

declare global {
  interface Window {
    daum: any;
  }
}

interface AddressSearchModalProps {
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

export function AddressSearchModal({
  isOpen,
  onClose,
  onSelectAddress,
}: AddressSearchModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const postcodeRef = useRef<any>(null);

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
      setLoadError('주소 검색 서비스를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.');
    };
    document.head.appendChild(script);

    return () => {
      // Don't remove the script as it might be used by other components
    };
  }, []);

  useEffect(() => {
    if (isOpen && isScriptLoaded && modalRef.current) {
      // Small delay to ensure the modal is fully rendered
      const initTimeout = setTimeout(() => {
        if (!modalRef.current) return;
        
        console.log('Initializing Daum Postcode modal', {
          isOpen,
          isScriptLoaded,
          modalRef: modalRef.current,
          containerSize: {
            width: modalRef.current.offsetWidth,
            height: modalRef.current.offsetHeight
          }
        });

        // Clear previous content
        modalRef.current.innerHTML = '';

        try {
          // Create Daum Postcode instance
          const postcodeInstance = new window.daum.Postcode({
            oncomplete: function (data: any) {
              // 팝업에서 검색결과 항목을 클릭했을때 실행할 코드를 작성하는 부분.

              // 도로명 주소의 노출 규칙에 따라 주소를 표시한다.
              // 내려오는 변수가 값이 없는 경우엔 공백('')값을 가지므로, 이를 참고하여 분기 한다.
              let fullAddress = data.address; // 기본 주소
              let extraAddress = ''; // 참고항목

              // 사용자가 선택한 주소 타입에 따라 해당 주소 값을 가져온다.
              if (data.userSelectedType === 'R') {
                // 사용자가 도로명 주소를 선택했을 경우
                fullAddress = data.roadAddress;
              } else {
                // 사용자가 지번 주소를 선택했을 경우(J)
                fullAddress = data.jibunAddress;
              }

              // 사용자가 선택한 주소가 도로명 타입일때 참고항목을 조합한다.
              if (data.userSelectedType === 'R') {
                // 법정동명이 있을 경우 추가한다. (법정리는 제외)
                // 법정동의 경우 마지막 문자가 "동/로/가"로 끝난다.
                if (data.bname !== '' && /[동|로|가]$/g.test(data.bname)) {
                  extraAddress += data.bname;
                }
                // 건물명이 있고, 공동주택일 경우 추가한다.
                if (data.buildingName !== '' && data.apartment === 'Y') {
                  extraAddress += extraAddress !== '' ? ', ' + data.buildingName : data.buildingName;
                }
                // 표시할 참고항목이 있을 경우, 괄호까지 추가한 최종 문자열을 만든다.
                if (extraAddress !== '') {
                  extraAddress = ' (' + extraAddress + ')';
                }
                // 조합된 참고항목을 해당 필드에 넣는다.
                fullAddress += extraAddress;
              }

              // 우편번호와 주소 정보를 해당 필드에 넣는다.
              onSelectAddress({
                postalCode: data.zonecode,
                address: fullAddress,
                addressType: data.userSelectedType,
                bname: data.bname,
                buildingName: data.buildingName,
              });

              // 모달 닫기
              onClose();
            },
            width: '100%',
            height: '100%',
            autoClose: false,
            maxSuggestItems: 5
          });
          
          postcodeRef.current = postcodeInstance;
          postcodeInstance.embed(modalRef.current);
          console.log('Daum Postcode embedded successfully');

          // Force iframe styling
          setTimeout(() => {
            const iframe = modalRef.current?.querySelector('iframe');
            if (iframe) {
              console.log('Found iframe, forcing styles');
              iframe.style.width = '100% !important';
              iframe.style.height = '100% !important';
              iframe.style.border = 'none !important';
              iframe.style.display = 'block !important';
              iframe.style.visibility = 'visible !important';
              iframe.style.opacity = '1 !important';
              
              // Also check the iframe src
              console.log('Iframe src:', iframe.src);
            } else {
              console.error('No iframe found in modal container');
              
              // Log all child elements
              console.log('Modal container children:', modalRef.current?.children);
            }
          }, 200);
        } catch (error) {
          console.error('Error initializing Daum Postcode:', error);
          setLoadError('주소 검색 서비스 초기화 중 오류가 발생했습니다.');
        }
      }, 100); // Increased delay to ensure modal is rendered

      return () => {
        clearTimeout(initTimeout);
        // Clean up postcode instance
        if (postcodeRef.current) {
          postcodeRef.current = null;
        }
      };
    }
  }, [isOpen, isScriptLoaded, onSelectAddress, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[500px] h-[600px] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>주소 검색</DialogTitle>
          <DialogDescription>
            도로명, 지번, 건물명으로 검색할 수 있습니다
          </DialogDescription>
        </DialogHeader>
        <div className="relative px-4 pb-4" style={{ height: 'calc(100% - 88px)' }}>
          <div 
            ref={modalRef} 
            className="w-full h-full relative"
            data-daum-postcode-container
            style={{ 
              minHeight: '400px',
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '4px',
              overflow: 'hidden'
            }}
          />
          {!isScriptLoaded && !loadError && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-sm text-muted-foreground">주소 검색 서비스를 불러오는 중...</p>
              </div>
            </div>
          )}
          {loadError && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <div className="text-center space-y-4">
                <div className="text-destructive">
                  <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm text-muted-foreground">{loadError}</p>
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
      </DialogContent>
    </Dialog>
  );
}