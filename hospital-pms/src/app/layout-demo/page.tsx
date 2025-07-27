'use client';

import { useState } from 'react';
import { Container, PageContainer, Grid, StatsGrid, CardGrid, Stack, VStack, HStack } from '@/components/layout';
import { MobileCard, MobileList, MobileListItem } from '@/components/layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Tablet, Monitor } from 'lucide-react';

export default function LayoutDemoPage() {
  const [viewport, setViewport] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  return (
    <div className="min-h-screen bg-background p-4">
      {/* Viewport Selector */}
      <div className="flex justify-center gap-2 mb-8">
        <Button
          variant={viewport === 'mobile' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewport('mobile')}
        >
          <Smartphone className="h-4 w-4 mr-2" />
          Mobile
        </Button>
        <Button
          variant={viewport === 'tablet' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewport('tablet')}
        >
          <Tablet className="h-4 w-4 mr-2" />
          Tablet
        </Button>
        <Button
          variant={viewport === 'desktop' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewport('desktop')}
        >
          <Monitor className="h-4 w-4 mr-2" />
          Desktop
        </Button>
      </div>

      {/* Demo Container */}
      <div className={`mx-auto transition-all duration-300 ${
        viewport === 'mobile' ? 'max-w-sm' : 
        viewport === 'tablet' ? 'max-w-2xl' : 
        'max-w-7xl'
      }`}>
        <PageContainer
          title="레이아웃 시스템 데모"
          description="반응형 레이아웃 컴포넌트를 테스트해보세요"
          actions={
            <>
              <Button variant="outline" size="sm">액션 1</Button>
              <Button size="sm">액션 2</Button>
            </>
          }
        >
          {/* Container Demo */}
          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-4">Container 컴포넌트</h2>
            <div className="space-y-4">
              <Container size="sm" className="bg-muted p-4 rounded">
                <p>Small Container (max-w-3xl)</p>
              </Container>
              <Container size="md" className="bg-muted p-4 rounded">
                <p>Medium Container (max-w-5xl)</p>
              </Container>
              <Container size="lg" className="bg-muted p-4 rounded">
                <p>Large Container (max-w-7xl)</p>
              </Container>
            </div>
          </section>

          {/* Grid Demo */}
          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-4">Grid 시스템</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-2">Stats Grid</h3>
                <StatsGrid>
                  <Card className="p-4 text-center">
                    <div className="text-2xl font-bold">120</div>
                    <div className="text-sm text-muted-foreground">환자</div>
                  </Card>
                  <Card className="p-4 text-center">
                    <div className="text-2xl font-bold">45</div>
                    <div className="text-sm text-muted-foreground">예약</div>
                  </Card>
                  <Card className="p-4 text-center">
                    <div className="text-2xl font-bold">8</div>
                    <div className="text-sm text-muted-foreground">대기</div>
                  </Card>
                  <Card className="p-4 text-center">
                    <div className="text-2xl font-bold">98%</div>
                    <div className="text-sm text-muted-foreground">만족도</div>
                  </Card>
                </StatsGrid>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Card Grid</h3>
                <CardGrid>
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Card key={i} className="p-4">
                      <h4 className="font-medium mb-2">카드 {i}</h4>
                      <p className="text-sm text-muted-foreground">
                        반응형 그리드 시스템으로 자동 정렬됩니다.
                      </p>
                    </Card>
                  ))}
                </CardGrid>
              </div>
            </div>
          </section>

          {/* Stack Demo */}
          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-4">Stack 레이아웃</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-2">Vertical Stack</h3>
                <VStack className="bg-muted p-4 rounded">
                  <Badge>Item 1</Badge>
                  <Badge>Item 2</Badge>
                  <Badge>Item 3</Badge>
                </VStack>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Horizontal Stack</h3>
                <HStack className="bg-muted p-4 rounded">
                  <Badge>Item 1</Badge>
                  <Badge>Item 2</Badge>
                  <Badge>Item 3</Badge>
                </HStack>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Stack with Different Spacing</h3>
                <div className="space-y-2">
                  <HStack spacing="xs" className="bg-muted p-4 rounded">
                    <Badge>XS</Badge>
                    <Badge>Spacing</Badge>
                  </HStack>
                  <HStack spacing="md" className="bg-muted p-4 rounded">
                    <Badge>MD</Badge>
                    <Badge>Spacing</Badge>
                  </HStack>
                  <HStack spacing="xl" className="bg-muted p-4 rounded">
                    <Badge>XL</Badge>
                    <Badge>Spacing</Badge>
                  </HStack>
                </div>
              </div>
            </div>
          </section>

          {/* Mobile Components Demo */}
          {viewport === 'mobile' && (
            <section className="mb-12">
              <h2 className="text-xl font-semibold mb-4">모바일 컴포넌트</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium mb-2">Mobile Cards</h3>
                  <div className="space-y-3">
                    <MobileCard>
                      <h4 className="font-medium">환자 정보</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        홍길동 (남, 45세)
                      </p>
                    </MobileCard>
                    <MobileCard onClick={() => alert('클릭!')}>
                      <h4 className="font-medium">예약 정보</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        2024-01-20 14:00
                      </p>
                      <Badge className="mt-2">클릭 가능</Badge>
                    </MobileCard>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">Mobile List</h3>
                  <MobileList>
                    <MobileListItem>
                      <div>
                        <div className="font-medium">항목 1</div>
                        <div className="text-sm text-muted-foreground">설명 텍스트</div>
                      </div>
                      <Badge>상태</Badge>
                    </MobileListItem>
                    <MobileListItem onClick={() => alert('리스트 아이템 클릭!')}>
                      <div>
                        <div className="font-medium">항목 2</div>
                        <div className="text-sm text-muted-foreground">클릭 가능한 아이템</div>
                      </div>
                      <Badge variant="secondary">클릭</Badge>
                    </MobileListItem>
                    <MobileListItem>
                      <div>
                        <div className="font-medium">항목 3</div>
                        <div className="text-sm text-muted-foreground">또 다른 아이템</div>
                      </div>
                      <Badge variant="outline">태그</Badge>
                    </MobileListItem>
                  </MobileList>
                </div>
              </div>
            </section>
          )}
        </PageContainer>
      </div>
    </div>
  );
}