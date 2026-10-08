"use client";

import { useState, useRef, useEffect } from "react";
import { 
  Bot, 
  Send, 
  Calendar, 
  Sparkles, 
  Check, 
  Clock, 
  Coffee, 
  Dumbbell, 
  Utensils, 
  Briefcase, 
  RotateCcw,
  Loader2,
  CheckCircle2,
  CalendarCheck,
  Wallet,
  ArrowDownRight,
  ArrowUpRight
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { IrisLogo } from "@/components/brand/IrisLogo";
import { DOMAIN_BADGE_STYLES, Domain } from "@/types/ui";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export interface TimeBlockPlanItem {
  startTime: string;
  endTime: string;
  label: string;
  type?: 'task' | 'break' | 'meal' | 'exercise' | 'routine';
  domain?: Domain;
  isFixed?: boolean;
  notes?: string;
}

export interface ProposedPlan {
  planReady: boolean;
  summary: string;
  timeBlocks: TimeBlockPlanItem[];
}

export interface ProposedFinanceAction {
  action: string;
  type?: 'income' | 'expense';
  amount?: number;
  category?: string;
  description?: string;
  paymentMethod?: string;
  transaction?: {
    type?: 'income' | 'expense';
    amount?: number;
    category?: string;
    description?: string;
    paymentMethod?: string;
  };
  note?: string;
}

export interface ChatMessageItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  plan?: ProposedPlan | null;
  financeAction?: ProposedFinanceAction | null;
  timestamp: Date;
}

interface PlannerChatProps {
  onPlanApplied?: () => void;
  onTransactionRecorded?: () => void;
  className?: string;
  compact?: boolean;
}

const STARTER_PROMPTS = [
  "Plan my day: 90m deep work, gym, and clear backlog.",
  "Spent ₹650 on team lunch — log this expense.",
  "How is my monthly budget and burn rate looking?",
  "What does my schedule and calendar look like today?",
];

export function PlannerChat({ onPlanApplied, onTransactionRecorded, className = "", compact = false }: PlannerChatProps) {
  const [messages, setMessages] = useState<ChatMessageItem[]>([
    {
      id: "welcome-1",
      role: "assistant",
      content: "Good day. I am IRIS, your personal assistant, routine planner, and finance manager. Tell me what you need to achieve today, or log expenses and check your budgets conversationally.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [applyingPlanId, setApplyingPlanId] = useState<string | null>(null);
  const [appliedPlans, setAppliedPlans] = useState<Record<string, boolean>>({});
  const [recordingTxId, setRecordingTxId] = useState<string | null>(null);
  const [recordedTxs, setRecordedTxs] = useState<Record<string, boolean>>({});
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const prompt = (textToSend || input).trim();
    if (!prompt || loading) return;

    const userMsg: ChatMessageItem = {
      id: `user-${Date.now()}`,
      role: "user",
      content: prompt,
      timestamp: new Date(),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newHistory.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reach assistant");
      }

      const assistantMsg: ChatMessageItem = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.content,
        plan: data.plan,
        financeAction: data.financeAction,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: `I ran into an issue connecting: ${err.message || "Please try again."}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };


  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleApplyPlan = async (messageId: string, plan: ProposedPlan) => {
    if (applyingPlanId || appliedPlans[messageId]) return;

    setApplyingPlanId(messageId);
    try {
      const todayStr = format(new Date(), "yyyy-MM-dd");
      const res = await fetch("/api/schedule/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: todayStr,
          summary: plan.summary,
          timeBlocks: plan.timeBlocks,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to apply plan");
      }

      setAppliedPlans((prev) => ({ ...prev, [messageId]: true }));
      if (onPlanApplied) {
        onPlanApplied();
      }
    } catch (err: any) {
      alert(`Could not apply plan: ${err.message}`);
    } finally {
      setApplyingPlanId(null);
    }
  };

  const handleRecordTransaction = async (messageId: string, action: ProposedFinanceAction) => {
    if (recordingTxId || recordedTxs[messageId]) return;

    const amount = Number(action.amount ?? action.transaction?.amount ?? 0);
    const type = (action.type ?? action.transaction?.type ?? 'expense') as 'income' | 'expense';
    const category = action.category ?? action.transaction?.category ?? 'Miscellaneous';
    const description = action.description ?? action.transaction?.description ?? 'Logged via IRIS Assistant';
    const paymentMethod = action.paymentMethod ?? action.transaction?.paymentMethod ?? 'Card';

    if (!amount || amount <= 0) {
      alert('Transaction amount must be greater than zero.');
      return;
    }

    setRecordingTxId(messageId);
    try {
      const res = await fetch('/api/finance/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          type,
          category,
          description,
          paymentMethod,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to record transaction');
      }

      setRecordedTxs((prev) => ({ ...prev, [messageId]: true }));
      if (onTransactionRecorded) {
        onTransactionRecorded();
      }
    } catch (err: any) {
      alert(`Could not record transaction: ${err.message}`);
    } finally {
      setRecordingTxId(null);
    }
  };


  const handleClearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: "assistant",
        content: "Schedule cleared. What's on your agenda for today?",
        timestamp: new Date(),
      },
    ]);
  };

  const getBlockTypeIcon = (type?: string) => {
    switch (type) {
      case "meal":
        return <Utensils className="w-3.5 h-3.5 text-stone-500" />;
      case "break":
        return <Coffee className="w-3.5 h-3.5 text-stone-500" />;
      case "exercise":
        return <Dumbbell className="w-3.5 h-3.5 text-emerald-700" />;
      default:
        return <Briefcase className="w-3.5 h-3.5 text-stone-600" />;
    }
  };

  return (
    <div className={`flex flex-col bg-white rounded-xl border border-stone-200/90 shadow-xs overflow-hidden ${className}`}>
      {/* Top Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-100 bg-stone-50/50">
        <div className="flex items-center gap-2.5">
          <IrisLogo size={28} variant="badge" className="rounded-md shadow-2xs" />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-semibold text-stone-900">IRIS Assistant</h3>
              <span className="text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-1.5 py-0.2 rounded-md">
                Active
              </span>
            </div>
            <p className="text-[11px] text-stone-400">Grounded in productivity laws & live calendar</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleClearChat}
            title="Start fresh conversation"
            className="text-[11px] font-medium text-stone-500 hover:text-stone-800 px-2 py-1 rounded-md hover:bg-stone-100 transition-colors flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>New chat</span>
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[520px] min-h-[300px]">
        {messages.map((m) => {
          const isUser = m.role === "user";

          return (
            <div
              key={m.id}
              className={`flex flex-col ${isUser ? "items-end" : "items-start"} space-y-1`}
            >
              <div className="flex items-center gap-1.5 px-1 text-[10px] text-stone-400">
                {!isUser && (
                  <IrisLogo size={13} variant="badge" className="rounded-[3.5px] shadow-2xs inline-block align-middle" />
                )}
                <span className={!isUser ? "font-semibold text-stone-700" : ""}>{isUser ? "You" : "IRIS"}</span>
                <span>•</span>
                <span>{format(m.timestamp, "h:mm a")}</span>
              </div>

              <div
                className={`max-w-[94%] sm:max-w-[85%] rounded-lg px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs leading-relaxed ${
                  isUser
                    ? "bg-stone-900 text-white rounded-br-xs whitespace-pre-wrap"
                    : "bg-white border border-stone-200/90 text-stone-800 rounded-bl-xs shadow-2xs"
                }`}
              >
                {isUser ? (
                  <p className="whitespace-pre-wrap">{m.content}</p>
                ) : (
                  <div className="text-xs leading-relaxed text-stone-800 space-y-2.5 [&_table]:w-full [&_table]:my-2.5 [&_table]:border-collapse [&_table]:border [&_table]:border-stone-200/90 [&_table]:rounded-md [&_table]:overflow-hidden [&_thead]:bg-stone-50/80 [&_th]:border [&_th]:border-stone-200/80 [&_th]:px-2.5 [&_th]:py-1.5 [&_th]:text-left [&_th]:font-semibold [&_th]:text-stone-900 [&_th]:text-[11px] [&_td]:border [&_td]:border-stone-200/80 [&_td]:px-2.5 [&_td]:py-1.5 [&_td]:text-[11px] [&_td]:text-stone-700 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_hr]:my-3 [&_hr]:border-stone-200/80 [&_h1]:text-sm [&_h1]:font-bold [&_h2]:text-xs [&_h2]:font-bold [&_h3]:text-xs [&_h3]:font-semibold [&_h3]:text-stone-900 [&_p]:leading-relaxed [&_strong]:font-semibold [&_strong]:text-stone-900">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {m.content}
                    </ReactMarkdown>
                  </div>
                )}


                {/* Render Proposed Plan Preview Card */}
                {m.plan && (
                  <div className="mt-3 pt-3 border-t border-stone-100 text-stone-900">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-stone-700" />
                        <span className="font-semibold text-xs text-stone-900">
                          Proposed Day Schedule
                        </span>
                      </div>
                      <span className="text-[10px] font-medium text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
                        {m.plan.timeBlocks.length} blocks
                      </span>
                    </div>

                    {m.plan.summary && (
                      <p className="text-[11px] text-stone-600 mb-2.5 bg-stone-50 p-2 rounded-md border border-stone-200/60 leading-normal">
                        {m.plan.summary}
                      </p>
                    )}

                    <div className="space-y-1.5 mb-3 max-h-[260px] overflow-y-auto pr-1">
                      {m.plan.timeBlocks.map((b, i) => {
                        const domainKey = (b.domain as Domain) || "work";
                        const badge = DOMAIN_BADGE_STYLES[domainKey] || DOMAIN_BADGE_STYLES.work;

                        return (
                          <div
                            key={i}
                            className="flex items-start gap-2 p-2 rounded-md bg-stone-50/70 border border-stone-200/60"
                          >
                            <div className="w-18 sm:w-20 shrink-0 text-[10px] sm:text-[11px] font-medium text-stone-700 tabular-nums pt-0.5 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-stone-400 shrink-0" />
                              <span>{b.startTime} - {b.endTime}</span>
                            </div>

                            <div className="pt-0.5 shrink-0">
                              {getBlockTypeIcon(b.type)}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-medium text-xs text-stone-900 truncate">
                                  {b.label}
                                </span>
                                {b.isFixed && (
                                  <span className="text-[9px] font-medium bg-amber-50 text-amber-800 border border-amber-200/60 px-1 rounded-sm">
                                    Fixed
                                  </span>
                                )}
                              </div>
                              {b.notes && (
                                <p className="text-[10px] text-stone-500 mt-0.5 leading-tight">
                                  {b.notes}
                                </p>
                              )}
                            </div>

                            {b.domain && (
                              <span
                                className={`text-[9px] font-medium px-1.5 py-0.5 rounded-md border shrink-0 ${badge.bg} ${badge.text} ${badge.border}`}
                              >
                                {b.domain}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Apply Button */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-stone-100">
                      <span className="text-[10px] text-stone-400">
                        {appliedPlans[m.id]
                          ? "Plan is live in Supabase & dashboard."
                          : "Ready to lock in this schedule?"}
                      </span>

                      <Button
                        size="sm"
                        disabled={applyingPlanId === m.id || appliedPlans[m.id]}
                        onClick={() => handleApplyPlan(m.id, m.plan!)}
                        className={`w-full sm:w-auto h-8 px-3.5 text-xs font-medium rounded-md transition-all ${
                          appliedPlans[m.id]
                            ? "bg-emerald-700 text-white cursor-default"
                            : "bg-stone-900 hover:bg-stone-800 text-white shadow-xs"
                        }`}
                      >
                        {applyingPlanId === m.id ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                            Applying...
                          </>
                        ) : appliedPlans[m.id] ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                            Applied to Schedule
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5 mr-1.5" />
                            Apply to Schedule
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Proposed Finance Action Card */}
                {m.financeAction && (
                  <div className="mt-3 pt-3 border-t border-stone-200/80 space-y-3">
                    <div className="flex items-center justify-between pb-1.5 border-b border-stone-100">
                      <div className="flex items-center gap-1.5">
                        <Wallet className="w-3.5 h-3.5 text-stone-700" />
                        <span className="text-[11px] font-semibold tracking-tight text-stone-900">
                          Proposed Transaction
                        </span>
                      </div>
                      <span className="text-[10px] text-stone-400">
                        Personal Finance Ledger
                      </span>
                    </div>

                    {(() => {
                      const fa = m.financeAction;
                      const amount = Number(fa.amount ?? fa.transaction?.amount ?? 0);
                      const type = (fa.type ?? fa.transaction?.type ?? 'expense') as 'income' | 'expense';
                      const category = fa.category ?? fa.transaction?.category ?? 'Miscellaneous';
                      const description = fa.description ?? fa.transaction?.description ?? 'Logged transaction';
                      const paymentMethod = fa.paymentMethod ?? fa.transaction?.paymentMethod ?? 'Card';
                      const isRecorded = recordedTxs[m.id];
                      const isRecording = recordingTxId === m.id;

                      return (
                        <div className="bg-stone-50/80 rounded-lg p-3 border border-stone-200/70 space-y-2.5">
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-0.5">
                              <p className="text-xs font-semibold text-stone-900 leading-snug">
                                {description}
                              </p>
                              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${
                                  type === 'income' 
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200/70' 
                                    : 'bg-stone-100 text-stone-700 border-stone-200/70'
                                }`}>
                                  {category}
                                </span>
                                <span className="text-[10px] text-stone-400 font-mono">
                                  via {paymentMethod}
                                </span>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className={`text-sm font-semibold tabular-nums ${
                                type === 'income' ? 'text-emerald-700' : 'text-stone-900'
                              }`}>
                                {type === 'income' ? '+' : '-'}₹{amount.toLocaleString('en-IN')}
                              </span>
                              <span className="block text-[9px] uppercase tracking-wider text-stone-400 font-medium">
                                {type}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-200/50">
                            <span className="text-[10px] text-stone-500">
                              {isRecorded ? 'Recorded to Supabase finance ledger.' : 'Sync this transaction to your ledger?'}
                            </span>
                            <Button
                              size="sm"
                              disabled={isRecording || isRecorded}
                              onClick={() => handleRecordTransaction(m.id, m.financeAction!)}
                              className={`h-7 px-3 text-xs font-medium rounded-md transition-all ${
                                isRecorded
                                  ? 'bg-emerald-700 text-white cursor-default'
                                  : 'bg-stone-900 hover:bg-stone-800 text-white shadow-2xs'
                              }`}
                            >
                              {isRecording ? (
                                <>
                                  <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                                  Recording...
                                </>
                              ) : isRecorded ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3 mr-1.5" />
                                  Recorded in Ledger
                                </>
                              ) : (
                                <>
                                  <Check className="w-3 h-3 mr-1.5" />
                                  Record to Ledger
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          );

        })}

        {loading && (
          <div className="flex flex-col items-start space-y-1">
            <div className="flex items-center gap-1.5 px-1 text-[10px] text-stone-400">
              <IrisLogo size={13} variant="badge" className="rounded-[3.5px] shadow-2xs inline-block align-middle" />
              <span className="font-semibold text-stone-700">IRIS</span>
            </div>
            <div className="bg-white border border-stone-200/90 rounded-lg rounded-bl-xs px-3.5 py-2.5 text-xs text-stone-500 flex items-center gap-2 shadow-2xs">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-stone-700" />
              <span>Reviewing commitments and crafting schedule...</span>
            </div>
          </div>
        )}
      </div>

      {/* Starter Prompts */}
      {messages.length <= 1 && (
        <div className="px-3 sm:px-4 py-2 border-t border-stone-100 bg-stone-50/30 flex overflow-x-auto no-scrollbar sm:flex-wrap gap-1.5">
          {STARTER_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)}
              className="text-[11px] text-stone-600 hover:text-stone-900 bg-white hover:bg-stone-100/80 border border-stone-200/80 px-2.5 py-1 rounded-md text-left transition-colors shrink-0 sm:shrink whitespace-nowrap sm:whitespace-normal"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Chat Input */}
      <div className="p-3 border-t border-stone-100 bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-end gap-2"
        >
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tell IRIS your daily plan, ask about budgets, or log expenses (Enter to send)..."
            rows={1}
            disabled={loading}
            className="min-h-[38px] max-h-[120px] resize-none text-xs bg-stone-50 border-stone-200 text-stone-900 placeholder:text-stone-400 focus-visible:ring-stone-400 rounded-md py-2.5 px-3 leading-normal"
          />

          <Button
            type="submit"
            disabled={loading || !input.trim()}
            size="sm"
            className="h-[38px] px-3.5 bg-stone-900 hover:bg-stone-800 text-white rounded-md shrink-0 font-medium text-xs transition-colors"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </Button>
        </form>
        <div className="flex items-center justify-between mt-1.5 px-1 text-[10px] text-stone-400">
          <span>Shift + Enter for new line</span>
          <span>Cal.com bookings synced</span>
        </div>
      </div>
    </div>
  );
}
