import React from 'react';
import { Terminal, CheckCircle2, AlertCircle, X, ExternalLink, Table } from 'lucide-react';
import { LogEntry } from '../types';

interface ScrapeProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: LogEntry[];
  isScraping: boolean;
  error: string | null;
  totalAdsFetched: number;
  onViewSheet: () => void;
  sheetTarget: string;
}

export const ScrapeProgressModal: React.FC<ScrapeProgressModalProps> = ({
  isOpen,
  onClose,
  logs,
  isScraping,
  error,
  totalAdsFetched,
  onViewSheet,
  sheetTarget
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-700 max-w-2xl w-full overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="bg-slate-950 px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className={`w-3 h-3 rounded-full ${isScraping ? 'bg-amber-400 animate-ping' : error ? 'bg-rose-500' : 'bg-emerald-400'}`} />
            <div className="flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-slate-400" />
              <h3 className="font-bold text-sm text-slate-200 font-mono">
                {isScraping ? `Scraping Meta Ads Archive (${sheetTarget})...` : 'Execution Logger Output'}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Notification Banner */}
        {error ? (
          <div className="bg-rose-950/90 border-b border-rose-900/80 px-5 py-3.5 space-y-2 text-xs text-rose-200">
            <div className="flex items-start space-x-2.5">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-rose-100">{error}</p>
                {error.includes('190') || error.toLowerCase().includes('token') ? (
                  <p className="text-[11px] text-rose-300">
                    Meta Graph API short-lived tokens expire automatically (usually after 1-2 hours). You can generate a new token in the{' '}
                    <a
                      href="https://developers.facebook.com/tools/explorer/"
                      target="_blank"
                      rel="noreferrer"
                      className="underline font-semibold text-white hover:text-blue-200"
                    >
                      Meta Graph API Explorer ↗
                    </a>{' '}
                    or clear the token to use simulated demo mode.
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        ) : !isScraping && totalAdsFetched > 0 ? (
          <div className="bg-emerald-950/80 border-b border-emerald-900/60 px-5 py-3 flex items-center justify-between text-xs text-emerald-200">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold">Successfully processed {totalAdsFetched} ads into "{sheetTarget}"</span>
            </div>
            <button
              onClick={onViewSheet}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold flex items-center space-x-1"
            >
              <span>View Sheet</span>
              <Table className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : null}

        {/* Terminal Log Stream */}
        <div className="p-4 overflow-y-auto font-mono text-[11px] space-y-1.5 flex-1 bg-slate-900/90 leading-relaxed select-text">
          {logs.map((log) => (
            <div key={log.id} className="flex items-start space-x-2">
              <span className="text-slate-500 select-none">[{log.timestamp}]</span>
              <span
                className={
                  log.level === 'error'
                    ? 'text-rose-400 font-bold'
                    : log.level === 'warn'
                    ? 'text-amber-300'
                    : log.level === 'success'
                    ? 'text-emerald-300 font-bold'
                    : 'text-slate-300'
                }
              >
                {log.message}
              </span>
            </div>
          ))}

          {isScraping && (
            <div className="flex items-center space-x-2 text-blue-400 py-1">
              <span className="inline-block w-2 h-4 bg-blue-400 animate-pulse" />
              <span>Fetching from Meta Graph API archive...</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950 px-5 py-3 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-mono">
            {logs.length} events logged
          </span>
          <div className="flex items-center space-x-2">
            {!isScraping && (
              <button
                onClick={onClose}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-medium"
              >
                Close
              </button>
            )}
            {!isScraping && totalAdsFetched > 0 && (
              <button
                onClick={onViewSheet}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold"
              >
                Open {sheetTarget}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
