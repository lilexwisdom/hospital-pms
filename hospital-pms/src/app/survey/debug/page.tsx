'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';

const testSchema = z.object({
  agree: z.boolean().refine(val => val === true, 'You must agree'),
});

export default function DebugPage() {
  const [submitCount, setSubmitCount] = useState(0);
  const [clickCount, setClickCount] = useState(0);
  
  const form = useForm({
    resolver: zodResolver(testSchema),
    defaultValues: {
      agree: false,
    },
  });

  const onSubmit = (data: any) => {
    console.log('Form submitted with data:', data);
    setSubmitCount(prev => prev + 1);
  };

  const onError = (errors: any) => {
    console.error('Form validation failed:', errors);
  };

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Survey Submit Debug Page</h1>
      
      <div className="space-y-4 p-4 border rounded">
        <h2 className="text-lg font-semibold">Test 1: Basic Form</h2>
        <form onSubmit={(e) => {
          e.preventDefault();
          console.log('Form submit event fired');
          setSubmitCount(prev => prev + 1);
        }}>
          <Button type="submit">Basic Submit</Button>
        </form>
        <p>Submit count: {submitCount}</p>
      </div>

      <div className="space-y-4 p-4 border rounded">
        <h2 className="text-lg font-semibold">Test 2: React Hook Form</h2>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-4">
            <FormField
              control={form.control}
              name="agree"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel>I agree to the terms</FormLabel>
                </FormItem>
              )}
            />
            <div className="space-x-2">
              <Button 
                type="submit"
                onClick={() => {
                  console.log('Submit button clicked');
                  setClickCount(prev => prev + 1);
                }}
              >
                Submit with Validation
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  console.log('Manual submit');
                  form.handleSubmit(onSubmit, onError)();
                }}
              >
                Manual Submit
              </Button>
            </div>
          </form>
        </Form>
        <p>Click count: {clickCount}</p>
        <p>Form values: {JSON.stringify(form.watch())}</p>
        <p>Form errors: {JSON.stringify(form.formState.errors)}</p>
      </div>

      <div className="space-y-4 p-4 border rounded bg-gray-50">
        <h2 className="text-lg font-semibold">Console Output Guide</h2>
        <ul className="list-disc list-inside text-sm space-y-1">
          <li>Open browser console (F12)</li>
          <li>Click buttons and check console logs</li>
          <li>Try with checkbox checked and unchecked</li>
          <li>Compare behavior between basic and hook form</li>
        </ul>
      </div>
    </div>
  );
}