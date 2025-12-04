import React from 'react';
import { toast } from 'sonner';
import { Cloud, Database, HardDrive, RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useStorageStore } from '@/hooks/useStorage';
import type { StorageAdapterName } from '@shared/types';
interface SettingsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}
export function SettingsModal({ isOpen, onOpenChange }: SettingsModalProps) {
  const adapterName = useStorageStore(s => s.adapterName);
  const setAdapterName = useStorageStore(s => s.setAdapterName);
  const syncQueue = useStorageStore(s => s.syncQueue);
  const conflicts = useStorageStore(s => s.conflicts);
  const isSyncing = useStorageStore(s => s.isSyncing);
  const autoSync = useStorageStore(s => s.autoSync);
  const toggleAutoSync = useStorageStore(s => s.toggleAutoSync);
  const processQueue = useStorageStore(s => s.processQueue);
  const handleAdapterChange = (value: string) => {
    setAdapterName(value as StorageAdapterName);
    toast.info(`Storage adapter switched to ${value.toUpperCase()}`);
  };
  const handleSyncNow = async () => {
    toast.promise(processQueue(), {
      loading: 'Syncing changes...',
      success: 'Sync complete!',
      error: 'Sync failed.',
    });
  };
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Manage storage, synchronization, and application preferences.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="storage" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="storage">Storage & Sync</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>
          <TabsContent value="storage">
            <Card>
              <CardHeader>
                <CardTitle>Storage Adapter</CardTitle>
                <CardDescription>Choose where your repository data is stored.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <Button variant={adapterName === 'local' ? 'default' : 'outline'} onClick={() => handleAdapterChange('local')} className="h-20 flex-col gap-1">
                    <HardDrive className="h-6 w-6" /> Local
                  </Button>
                  <Button variant={adapterName === 'do' ? 'default' : 'outline'} onClick={() => handleAdapterChange('do')} className="h-20 flex-col gap-1">
                    <Cloud className="h-6 w-6" /> Cloudflare
                  </Button>
                  <Button variant={adapterName === 'd1' ? 'default' : 'outline'} onClick={() => handleAdapterChange('d1')} className="h-20 flex-col gap-1" disabled>
                    <Database className="h-6 w-6" /> D1 (Soon)
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Local stores data in your browser. Cloudflare syncs to the edge.
                </p>
              </CardContent>
            </Card>
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Synchronization</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-sync">Automatic Sync</Label>
                  <Switch id="auto-sync" checked={autoSync} onCheckedChange={toggleAutoSync} />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <p>{syncQueue.length} item(s) pending sync.</p>
                  <Button size="sm" onClick={handleSyncNow} disabled={isSyncing || syncQueue.length === 0}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} /> Sync Now
                  </Button>
                </div>
                {conflicts.length > 0 && (
                  <div className="p-3 rounded-md bg-destructive/10 text-destructive-foreground">
                    <h4 className="font-semibold flex items-center"><AlertTriangle className="h-4 w-4 mr-2" /> {conflicts.length} Sync Conflicts</h4>
                    <p className="text-xs mt-1">Resolve conflicts before syncing.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="preferences">
            <Card>
              <CardHeader>
                <CardTitle>Preferences</CardTitle>
                <CardDescription>Customize your Arbor experience.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">More preferences coming soon.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}