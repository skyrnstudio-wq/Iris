import { NextRequest, NextResponse } from 'next/server';
import { callAIChat, ChatMessage } from '@/lib/openrouter';
import { getTodayEvents } from '@/services/calendarService';
import { getAllTasks } from '@/services/taskService';
import { getPreferences } from '@/services/preferencesService';
import { getFinanceOverview } from '@/services/financeService';
import { format } from 'date-fns';

function extractStructuredPayload(text: string): { 
  cleanText: string; 
  plan: any | null; 
  financeAction: any | null 
} {
  let plan: any = null;
  let financeAction: any = null;
  let cleanText = text;

  try {
    // 1. Try markdown code blocks first
    const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)(?:```|$)/g;
    let match;
    while ((match = codeBlockRegex.exec(text)) !== null) {
      const raw = match[1].trim();
      try {
        const parsed = JSON.parse(raw);
        if (parsed.planReady && Array.isArray(parsed.timeBlocks)) {
          plan = parsed;
          cleanText = cleanText.replace(match[0], '').trim();
        } else if (parsed.financeAction) {
          financeAction = parsed.financeAction;
          cleanText = cleanText.replace(match[0], '').trim();
        } else if (parsed.action === 'record_transaction' || parsed.transaction) {
          financeAction = parsed;
          cleanText = cleanText.replace(match[0], '').trim();
        }
      } catch {
        // Partial JSON or malformed block fallback
        const start = raw.indexOf('{');
        const end = raw.lastIndexOf('}');
        if (start !== -1 && end > start) {
          try {
            const candidate = JSON.parse(raw.slice(start, end + 1));
            if (candidate.planReady) {
              plan = candidate;
              cleanText = cleanText.replace(match[0], '').trim();
            } else if (candidate.financeAction || candidate.action === 'record_transaction') {
              financeAction = candidate.financeAction || candidate;
              cleanText = cleanText.replace(match[0], '').trim();
            }
          } catch {}
        }
      }
    }

    // 2. Fallback: look for raw JSON containing "planReady" or "financeAction" anywhere
    if (!plan && cleanText.includes('"planReady"')) {
      const start = cleanText.indexOf('{');
      const end = cleanText.lastIndexOf('}');
      if (start !== -1 && end > start) {
        try {
          const candidate = JSON.parse(cleanText.slice(start, end + 1));
          if (candidate.planReady) {
            plan = candidate;
            cleanText = (cleanText.slice(0, start) + cleanText.slice(end + 1)).trim();
          }
        } catch {}
      }
    }

    if (!financeAction && (cleanText.includes('"financeAction"') || cleanText.includes('"record_transaction"'))) {
      const start = cleanText.indexOf('{');
      const end = cleanText.lastIndexOf('}');
      if (start !== -1 && end > start) {
        try {
          const candidate = JSON.parse(cleanText.slice(start, end + 1));
          if (candidate.financeAction || candidate.action === 'record_transaction') {
            financeAction = candidate.financeAction || candidate;
            cleanText = (cleanText.slice(0, start) + cleanText.slice(end + 1)).trim();
          }
        } catch {}
      }
    }
  } catch (err) {
    console.warn('Error parsing structured payload:', err);
  }

  // Polished fallbacks if model output was pure JSON
  if (!cleanText && plan) {
    cleanText = `I have mapped out a realistic, buffered schedule for your day based on your commitments and energy rhythm. Review the proposed time blocks below:`;
  } else if (!cleanText && financeAction) {
    cleanText = `I have staged this transaction. Review the details below to record it to your ledger:`;
  }

  return { cleanText, plan, financeAction };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // 1. Fetch live system context (Calendar, Tasks, Preferences, Finance)
    const now = new Date();
    const todayStr = format(now, 'EEEE, MMMM d, yyyy');
    const currentTimeStr = format(now, 'h:mm a');

    const [calendarEvents, tasks, preferences, financeOverview] = await Promise.all([
      getTodayEvents().catch(() => []),
      getAllTasks().catch(() => []),
      getPreferences().catch(() => null),
      getFinanceOverview().catch(() => null),
    ]);

    // Format calendar events for the prompt
    let calContext = 'No live calendar events detected for today.';
    if (calendarEvents && calendarEvents.length > 0) {
      calContext = calendarEvents
        .map((e) => {
          const start = format(new Date(e.startTime), 'h:mm a');
          const end = format(new Date(e.endTime), 'h:mm a');
          const sourceTag = e.source === 'calcom' ? '[Cal.com Booking - FIXED]' : '[Scheduled Block]';
          return `- ${start} to ${end}: ${e.title} ${sourceTag}${e.description ? ` (${e.description})` : ''}`;
        })
        .join('\n');
    }

    // Format existing pending tasks
    const pendingTasks = (tasks || []).filter((t: any) => Boolean(t && t.status !== 'done'));
    let taskContext = 'No pending tasks in database.';
    if (pendingTasks.length > 0) {
      taskContext = pendingTasks
        .slice(0, 10)
        .map((t: any) => {
          return `- ${t.title} [Domain: ${t.domain}, Priority: ${t.priority}, Est: ${t.estimatedMin || 30}m]`;
        })
        .join('\n');
    }

    // Format personal finance context
    let financeContext = 'Personal finance tracker is fresh.';
    if (financeOverview) {
      const { totalIncome, totalExpenses, netBalance, savingsRate, categories, goals, month } = financeOverview;
      const budgetLines = categories
        .filter((c) => c.budget > 0)
        .map((c) => `  * ${c.category}: ₹${c.spent.toLocaleString('en-IN')} / ₹${c.budget.toLocaleString('en-IN')} (${c.percentage}%) [Remaining: ₹${c.remaining.toLocaleString('en-IN')}]`)
        .join('\n');
      const goalLines = goals
        .map((g) => `  * ${g.title}: ₹${g.currentAmount.toLocaleString('en-IN')} / ₹${g.targetAmount.toLocaleString('en-IN')} (${g.targetAmount > 0 ? Math.round((g.currentAmount / g.targetAmount) * 100) : 0}%)`)
        .join('\n');

      financeContext = `Month: ${month}
- Total Inflow (Income): ₹${totalIncome.toLocaleString('en-IN')}
- Total Outflow (Expenses): ₹${totalExpenses.toLocaleString('en-IN')}
- Net Balance: ₹${netBalance.toLocaleString('en-IN')}
- Savings Rate: ${savingsRate}%
- Active Category Budgets:
${budgetLines || '  (No category budgets configured yet)'}
- Financial Goals & Reserves:
${goalLines || '  (No goals configured yet)'}`;
    }

    // User preferences
    const wake = preferences?.wakeTime || '06:30';
    const sleep = preferences?.sleepTime || '22:30';
    const peakStart = preferences?.peakHoursStart || '09:00';
    const peakEnd = preferences?.peakHoursEnd || '12:00';
    const workStart = preferences?.workStartTime || '09:00';
    const workEnd = preferences?.workEndTime || '17:30';
    const lunch = preferences?.lunchTime || '13:00';
    const lunchDur = preferences?.lunchDurationMin || 45;
    const breakDur = preferences?.breakDurationMin || 15;

    // Build the executive system prompt
    const systemPrompt = `You are IRIS (Intelligent Routine & Intent Scheduler), an executive personal assistant, routine planner, and personal finance advisor for Abhi and Skyrn Studio.
Your goal is to help the user plan their day with ruthless plausibility, sustainable energy management, and advise/handle their personal finances with grounded precision.

CURRENT REAL-WORLD CONTEXT:
- Today is: ${todayStr}
- Current Local Time: ${currentTimeStr}
- User Boundaries & Energy Profile:
  * Wake time: ${wake}
  * Sleep / wind-down: ${sleep}
  * Peak cognitive focus hours: ${peakStart} - ${peakEnd}
  * Standard work hours: ${workStart} - ${workEnd}
  * Lunch break: ${lunch} (${lunchDur} min)
  * Rest buffer between deep sprints: ${breakDur} min
- Live Calendar Commitments Today (DO NOT DOUBLE-BOOK OR OVERWRITE):
${calContext}
- Existing Pending Tasks in User's Backlog:
${taskContext}

LIVE PERSONAL & STUDIO FINANCIAL CONTEXT:
${financeContext}

PRODUCTIVITY LAWS & SCHEDULING PRINCIPLES:
1. PARKINSON'S LAW: Work expands to fill available time. Assign crisp, bounded timeboxes (e.g. 45m, 60m, 90m) rather than sprawling open-ended blocks.
2. EAT THAT FROG / PEAK ENERGY: Position the single hardest, highest-friction cognitive task into morning peak hours (${peakStart} - ${peakEnd}) when willpower and mental stamina are highest.
3. ULTRADIAN RHYTHMS & BUFFERING: Deep focus operates in ~90-minute waves. Enforce a 10-15m buffer or physical reset between demanding blocks. Always leave buffer around external meetings and transit (workouts, errands).
4. EISENHOWER MATRIX: Protect important proactive deep work from being eclipsed by urgent reactive firefighting.
5. BATCH SHALLOW WORK: Group routine admin, emails, quick calls, and domestic chores into the lower-energy afternoon slot (14:30 - 16:30).
6. TIME REALISM:
   - If current time is already midway through the day (e.g. 11:50 AM), do NOT schedule tasks in the past! Only schedule from the present time forward until sleep.
   - Keep schedules plausible. A 100% packed day with zero buffer fails at the first interruption.

FINANCIAL MANAGEMENT & ADVISORY PRINCIPLES:
1. TRUTHFUL & ACCURATE: Always use the user's real numbers from the context above. Don't invent numbers or preach generic advice.
2. DISCRETIONARY & RUNWAY CONSCIOUSNESS: When the user asks about affordability, check their category budget remaining and current net burn.
3. CONVERSATIONAL EXPENSE & INCOME LOGGING:
   - When the user tells you they spent money or received income (e.g. "I spent ₹650 on lunch with client", "Paid 1,499 for Cursor subscription", "Got 45,000 design payment"), acknowledge warmly and output a structured finance action JSON block:
\`\`\`json
{
  "financeAction": {
    "action": "record_transaction",
    "type": "expense",
    "amount": 650,
    "category": "Food & Dining",
    "description": "Lunch with client",
    "paymentMethod": "UPI"
  }
}
\`\`\`
   - Standard categories: "Software & Subscriptions", "Food & Dining", "Studio & Workspace", "Health & Fitness", "Travel & Commute", "Personal & Lifestyle", "Learning & Books", "Client Work & Business", "Investments & Savings", "Utilities & Bills", "Miscellaneous".
   - Default paymentMethod to "UPI" or "Card" if not mentioned.

STRICT NON-GUESSING / CONVERSATIONAL CLARIFICATION RULE:
- Do NOT guess missing details for day planning.
- If the user shares daily intentions with missing durations or priority, ask 1-3 targeted clarifying questions before locking down a plan.
- ONLY when parameters are clear or if the user asks to plan directly, output the plan JSON block:
\`\`\`json
{
  "planReady": true,
  "summary": "Crisp 1-sentence executive summary of the day",
  "timeBlocks": [
    {
      "startTime": "HH:MM",
      "endTime": "HH:MM",
      "label": "Block Name",
      "type": "task" | "break" | "meal" | "exercise" | "routine",
      "domain": "work" | "health" | "chores" | "personal" | "learning",
      "isFixed": false,
      "notes": "Short helpful focus tip"
    }
  ]
}
\`\`\`

COMMUNICATION STYLE:
- Clear, grounded, calm, professional.
- No corporate jargon, no artificial hype.
- Format with clean, structured markdown.`;

    const chatPayload: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m: any) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    const aiResponse = await callAIChat(chatPayload, { temperature: 0.6, maxTokens: 1500 });

    if (!aiResponse) {
      return NextResponse.json(
        { error: 'AI assistant is temporarily unavailable. Please try again shortly.' },
        { status: 502 }
      );
    }

    const { cleanText, plan, financeAction } = extractStructuredPayload(aiResponse);

    return NextResponse.json({
      role: 'assistant',
      content: cleanText,
      plan,
      financeAction,
      calendarEventsCount: calendarEvents.length,
      tasksCount: pendingTasks.length,
      financeOverviewAvailable: Boolean(financeOverview),
    });
  } catch (error: any) {
    console.error('Error in chat route:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

