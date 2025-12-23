import React from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { AuditLogViewer } from '@/components/security/AuditLogViewer';
import { useEmergency } from '@/contexts/EmergencyContext';
import { useSecurity } from '@/contexts/SecurityContext';
import { useAuth } from '@/contexts/AuthContext';

export default function SecurityControlsTest() {
    const { isEmergencyActive, activateEmergency, deactivateEmergency } = useEmergency();
    const { trustScore } = useSecurity();
    const { user, profile } = useAuth();

    return (
        <PageLayout title="Security Controls Verification" subtitle="RBAC & Emergency Systems Testbed">
            <div className="space-y-8 p-6">

                {/* Status Panel */}
                <section className="bg-slate-900 p-6 rounded-xl border border-slate-800">
                    <h2 className="text-xl font-bold text-white mb-4">Current Context</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-slate-800 p-3 rounded">
                            <div className="text-xs text-slate-400">User Role</div>
                            <div className="font-mono text-cyan-400">{profile?.role || 'Guest'}</div>
                        </div>
                        <div className="bg-slate-800 p-3 rounded">
                            <div className="text-xs text-slate-400">Trust Score</div>
                            <div className={`font-mono ${trustScore < 80 ? 'text-red-500' : 'text-emerald-500'}`}>{trustScore}%</div>
                        </div>
                        <div className="bg-slate-800 p-3 rounded">
                            <div className="text-xs text-slate-400">Emergency State</div>
                            <div className={`font-mono ${isEmergencyActive ? 'text-red-500 animate-pulse' : 'text-slate-300'}`}>
                                {isEmergencyActive ? 'ACTIVE' : 'NORMAL'}
                            </div>
                        </div>
                        <div className="bg-slate-800 p-3 rounded">
                            <div className="text-xs text-slate-400">System Time</div>
                            <div className="font-mono text-slate-300">{new Date().toLocaleTimeString()}</div>
                        </div>
                    </div>

                    <div className="mt-4 flex gap-4">
                        {isEmergencyActive && (
                            <Button onClick={deactivateEmergency} variant="outline" className="border-emerald-500 text-emerald-500 hover:bg-emerald-950">
                                Deactivate Emergency (Simulated Admin)
                            </Button>
                        )}
                    </div>
                </section>

                {/* Audit Logs */}
                <section className="mt-8">
                    <AuditLogViewer />
                </section>

                {/* Permission Gates */}
                <div className="grid md:grid-cols-2 gap-6 mt-8">

                    {/* Standard Gate */}
                    <section className="bg-slate-900 p-6 rounded-xl border border-slate-800">
                        <h3 className="text-lg font-semibold text-white mb-4">Standard Permission Gate</h3>
                        <p className="text-sm text-slate-400 mb-4">Requires <code>broadcast_message</code> permission.</p>

                        <PermissionGate
                            action="broadcast_message"
                            fallback={<div className="p-4 bg-slate-800 text-slate-500 rounded border border-slate-700">Fallback: Access Denied</div>}
                        >
                            <div className="p-4 bg-emerald-900/20 text-emerald-400 border border-emerald-500/50 rounded">
                                ✅ Success: You can see this content.
                            </div>
                        </PermissionGate>
                    </section>

                    {/* Break Glass Gate */}
                    <section className="bg-slate-900 p-6 rounded-xl border border-slate-800">
                        <h3 className="text-lg font-semibold text-white mb-4">Critical Action Gate (Break Glass)</h3>
                        <p className="text-sm text-slate-400 mb-4">Requires <code>remote_wipe</code> permission (High Risk).</p>

                        <PermissionGate
                            action="remote_wipe"
                            requireBreakGlass={true}
                            fallback={<div className="p-4 bg-slate-800 text-slate-500 rounded border border-slate-700">Fallback: Access Denied completely</div>}
                        >
                            <div className="p-4 bg-red-900/20 text-red-400 border border-red-500/50 rounded animate-pulse">
                                ⚠️ DANGER: Remote Wipe Controls Exposed
                            </div>
                        </PermissionGate>
                    </section>

                </div>

            </div>
        </PageLayout>
    );
}
