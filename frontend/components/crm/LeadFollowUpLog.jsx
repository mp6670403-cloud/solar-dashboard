import { useState, useEffect } from 'react';
import Button from '../UI/Button';
import { MessageSquare, PhoneCall, FileText, Send, Clock, User } from 'lucide-react';

export default function LeadFollowUpLog({ leadId }) {
  // Mock logs state since we don't have a backend endpoint for this yet
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState('');
  const [chatLog, setChatLog] = useState('');
  const [callLink, setCallLink] = useState('');

  // Load existing mock logs from localStorage or initialize empty
  useEffect(() => {
    const savedLogs = localStorage.getItem(`lead_logs_${leadId}`);
    if (savedLogs) {
      setLogs(JSON.parse(savedLogs));
    } else {
      // Add a dummy initial log just to show how it looks
      setLogs([
        {
          id: Date.now() - 86400000,
          date: new Date(Date.now() - 86400000).toLocaleString('en-IN'),
          summary: 'Initial discovery call. Client is interested in a 5kW system but needs EMI options.',
          chatLog: '',
          callLink: 'https://exotel.com/recording/xyz123',
          author: 'Sales Exec'
        }
      ]);
    }
  }, [leadId]);

  const handleSaveLog = () => {
    if (!summary && !chatLog && !callLink) return;

    const newLog = {
      id: Date.now(),
      date: new Date().toLocaleString('en-IN'),
      summary,
      chatLog,
      callLink,
      author: 'Current User'
    };

    const updatedLogs = [newLog, ...logs];
    setLogs(updatedLogs);
    localStorage.setItem(`lead_logs_${leadId}`, JSON.stringify(updatedLogs));

    // Reset form
    setSummary('');
    setChatLog('');
    setCallLink('');
  };

  return (
    <div className="mt-6 border-t border-slate-800 pt-6">
      <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
        <MessageSquare size={16} className="text-indigo-400" />
        Communication & Follow-up Log
      </h4>

      {/* Manual Log Entry Form */}
      <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 space-y-3 mb-6">
        <div>
          <label className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1.5 mb-1">
            <FileText size={12} /> Conversation Summary
          </label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="What was discussed?"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 h-16 resize-none"
          />
        </div>

        <div>
          <label className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1.5 mb-1">
            <MessageSquare size={12} /> WhatsApp / Chat Transcript
          </label>
          <textarea
            value={chatLog}
            onChange={(e) => setChatLog(e.target.value)}
            placeholder="Paste raw chat messages here if any..."
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 h-16 resize-none"
          />
        </div>

        <div>
          <label className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1.5 mb-1">
            <PhoneCall size={12} /> Call Recording Link
          </label>
          <input
            type="text"
            value={callLink}
            onChange={(e) => setCallLink(e.target.value)}
            placeholder="https://drive.google.com/... or Ozonetel/Exotel ID"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex justify-end pt-1">
          <Button variant="primary" onClick={handleSaveLog} className="!py-1.5 !text-xs">
            <Send size={12} /> Save Log Entry
          </Button>
        </div>
      </div>

      {/* Interaction History Timeline */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h5 className="text-xs font-bold text-slate-300">History ({logs.length})</h5>
          {logs.length > 0 && (
            <button
              onClick={() => {
                const headers = ['Date', 'Author', 'Summary', 'Chat Log', 'Recording Link'];
                const rows = logs.map(l => [
                  l.date,
                  l.author,
                  l.summary || '',
                  l.chatLog || '',
                  l.callLink || ''
                ]);
                const csvContent = "data:text/csv;charset=utf-8," 
                  + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", `Lead_Logs_${leadId}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="text-[9px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-0.5 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded"
            >
              Export Logs (CSV)
            </button>
          )}
        </div>
        {logs.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No previous interactions logged.</p>
        ) : (
          <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-800 before:to-transparent">
            {logs.map((log) => (
              <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-slate-900 bg-slate-800 text-slate-500 group-[.is-active]:bg-indigo-500/20 group-[.is-active]:text-indigo-400 group-[.is-active]:border-indigo-500/30 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow">
                  <Clock size={16} />
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold">
                      <User size={10} /> {log.author}
                    </div>
                    <time className="text-[9px] text-slate-500 font-mono">{log.date}</time>
                  </div>
                  
                  {log.summary && (
                    <div className="mb-2">
                      <p className="text-xs text-slate-300 leading-relaxed">{log.summary}</p>
                    </div>
                  )}
                  
                  {log.chatLog && (
                    <div className="mb-2 bg-slate-950 p-2 rounded border border-slate-800/60">
                      <p className="text-[10px] text-slate-400 font-mono whitespace-pre-wrap">{log.chatLog}</p>
                    </div>
                  )}

                  {log.callLink && (
                    <div className="mt-2 text-[10px]">
                      <a href={log.callLink} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                        <PhoneCall size={10} /> View Recording
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
