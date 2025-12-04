import { useState } from 'react';
import { Settings } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { SettingsModal } from '@/components/SettingsModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useStorageStore } from '@/hooks/useStorage';
import { formatDistanceToNow } from 'date-fns';
export default function SettingsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const adapterName = useStorageStore(s => s.adapterName);
  const lastSync = useStorageStore(s => s.lastSync);
  const syncQueue = useStorageStore(s => s.syncQueue);
  return (
    <AppLayout container>
      <div className="space-y-8">
        <header>
          <h1 className="text-4xl font-bold font-display">Settings</h1>
          <p className="text-lg text-muted-foreground mt-2">
            Configure your storage and synchronization preferences.
          </p>
        </header>
        <Card>
          <CardHeader>
            <CardTitle>Storage Configuration</CardTitle>
            <CardDescription>
              Manage how and where your data is stored.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Current Storage Adapter</p>
                <p className="text-sm text-muted-foreground capitalize">{adapterName}</p>
              </div>
              <Button variant="outline" onClick={() => setIsModalOpen(true)}>
                <Settings className="mr-2 h-4 w-4" />
                Change Settings
              </Button>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Last sync: {lastSync ? formatDistanceToNow(new Date(lastSync), { addSuffix: true }) : 'Never'}</p>
              <p>{syncQueue.length} changes pending synchronization.</p>
            </div>
          </CardContent>
        </Card>
        <SettingsModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} />
      </div>
    </AppLayout>
  );
}