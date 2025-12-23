import React from 'react';
import { useEmergency } from '@/contexts/EmergencyContext';
import { Button } from '@/components/ui/button';
import { Siren, AlertOctagon } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from '@/components/ui/textarea';

export function EmergencyButton() {
    const { isEmergencyActive, activateEmergency } = useEmergency();
    const [reason, setReason] = React.useState('');
    const [open, setOpen] = React.useState(false);

    const handleActivate = async () => {
        if (reason.length < 5) return;
        const success = await activateEmergency(reason);
        if (success) setOpen(false);
    };

    if (isEmergencyActive) {
        return (
            <div className="flex items-center gap-2 animate-pulse px-4 py-2 bg-red-600 text-white font-bold rounded-lg border-2 border-red-400 shadow-[0_0_15px_rgba(220,38,38,0.7)]">
                <Siren className="w-5 h-5 animate-spin" />
                <span>EMERGENCY ACTIVE</span>
            </div>
        );
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="destructive" className="bg-red-900/80 hover:bg-red-800 border border-red-500/50 text-red-100 font-bold tracking-wider">
                    <AlertOctagon className="w-4 h-4 mr-2" />
                    DECLARE EMERGENCY
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-950 border-red-500/50 text-white">
                <DialogHeader>
                    <DialogTitle className="text-red-500 flex items-center gap-2">
                        <Siren className="w-6 h-6" />
                        DECLARE STATE OF EMERGENCY
                    </DialogTitle>
                    <DialogDescription className="text-slate-300">
                        This action will override standard protocols and enable priority routing.
                        All actions will be hash-chained and sent to the Superintendent immediately.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <label className="text-xs font-semibold text-red-400 uppercase mb-2 block">Justification Required</label>
                    <Textarea
                        placeholder="Describe the incident (e.g. riots in Sector 4)..."
                        className="bg-slate-900 border-red-900/50 text-white min-h-[100px]"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                    />
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setOpen(false)} className="text-slate-400 hover:text-white">Cancel</Button>
                    <Button
                        variant="destructive"
                        onClick={handleActivate}
                        className="bg-red-600 hover:bg-red-500 w-full md:w-auto"
                        disabled={reason.length < 5}
                    >
                        CONFIRM ACTIVATION
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
