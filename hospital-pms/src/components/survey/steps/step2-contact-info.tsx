'use client';

import { UseFormReturn } from 'react-hook-form';
import { useState } from 'react';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { AddressSearchModal } from '@/components/survey/address-search-modal';
import { AddressSearchModalSimple } from '@/components/survey/address-search-modal-simple';

interface Step2ContactInfoProps {
  form: UseFormReturn<any>;
}

export function Step2ContactInfo({ form }: Step2ContactInfoProps) {
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  const handleAddressSelect = (data: {
    postalCode: string;
    address: string;
    addressType: string;
    bname: string;
    buildingName: string;
  }) => {
    form.setValue('postalCode', data.postalCode);
    form.setValue('address', data.address);
    // Clear detail address when new address is selected
    form.setValue('addressDetail', '');
    
    // Trigger validation for these fields
    form.trigger(['postalCode', 'address']);
  };

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    if (numbers.length <= 10) return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="phone"
        render={({ field }) => (
          <FormItem>
            <FormLabel>휴대폰 번호 *</FormLabel>
            <FormControl>
              <Input
                placeholder="010-1234-5678"
                {...field}
                onChange={(e) => {
                  const formatted = formatPhoneNumber(e.target.value);
                  field.onChange(formatted);
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>이메일</FormLabel>
            <FormControl>
              <Input
                type="email"
                placeholder="example@email.com"
                {...field}
              />
            </FormControl>
            <FormDescription>
              진료 예약 확인 및 안내 메일을 받으실 수 있습니다
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="space-y-4">
        <div className="flex items-end space-x-2">
          <FormField
            control={form.control}
            name="postalCode"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>우편번호 *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="12345"
                    readOnly
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsAddressModalOpen(true)}
          >
            <Search className="mr-2 h-4 w-4" />
            주소 검색
          </Button>
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>주소 *</FormLabel>
              <FormControl>
                <Input
                  placeholder="주소를 검색해주세요"
                  readOnly
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="addressDetail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>상세주소</FormLabel>
              <FormControl>
                <Input
                  placeholder="아파트 동/호수 등"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                정확한 주소 입력은 응급상황 시 도움이 됩니다
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      {/* Temporarily using simple modal for debugging */}
      <AddressSearchModalSimple
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onSelectAddress={handleAddressSelect}
      />
    </div>
  );
}