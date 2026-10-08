"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Send, 
  Calendar, 
  RefreshCw, 
  ExternalLink,
  Clock,
  Coffee,
  SunMedium,
  Loader2
} from "lucide-react";

export function SettingsForm() {
  const [loading, setLoading] = useState<boolean>(true);
  const [calStatus, setCalStatus] = useState<string | null>("success");
  const [calUser, setCalUser] = useState<string | null>("Skyrn Studio");

  // Schedule Hours State (Fully controlled)
  const [wakeTime, setWakeTime] = useState<string>("06:30");
  const [sleepTime, setSleepTime] = useState<string>("22:30");
  const [workStartTime, setWorkStartTime] = useState<string>("08:30");
  const [workEndTime, setWorkEndTime] = useState<string>("17:30");
  const [peakHoursStart, setPeakHoursStart] = useState<string>("08:30");
  const [peakHoursEnd, setPeakHoursEnd] = useState<string>("11:30");
  const [lunchTime, setLunchTime] = useState<string>("13:00");
  const [lunchDurationMin, setLunchDurationMin] = useState<number>(45);
  const [breakDurationMin, setBreakDurationMin] = useState<number>(15);
  const [timezone, setTimezone] = useState<string>("Asia/Kolkata");

  // Telegram Integration State
  const [tgBotToken, setTgBotToken] = useState<string>("8528779259:AAG8GYObup97kKRaqpf1aiWu_QCoXDPmZRY");
  const [tgChatId, setTgChatId] = useState<string>("");
  const [tgStatus, setTgStatus] = useState<string | null>(null);
  const [tgFeedback, setTgFeedback] = useState<string | null>(null);
  const [detectingChatId, setDetectingChatId] = useState<boolean>(false);

  // Saving State
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [savedSection, setSavedSection] = useState<string | null>(null);
  const [errorSection, setErrorSection] = useState<string | null>(null);

  // Fetch preferences on mount to populate all inputs from database
  useEffect(() => {
    async function loadPreferences() {
      try {
        setLoading(true);
        const res = await fetch("/api/preferences");
        if (res.ok) {
          const data = await res.json();
          if (data.wakeTime) setWakeTime(data.wakeTime);
          if (data.sleepTime) setSleepTime(data.sleepTime);
          if (data.workStartTime) setWorkStartTime(data.workStartTime);
          if (data.workEndTime) setWorkEndTime(data.workEndTime);
          if (data.peakHoursStart) setPeakHoursStart(data.peakHoursStart);
          if (data.peakHoursEnd) setPeakHoursEnd(data.peakHoursEnd);
          if (data.lunchTime) setLunchTime(data.lunchTime);
          if (data.lunchDurationMin) setLunchDurationMin(Number(data.lunchDurationMin));
          if (data.breakDurationMin) setBreakDurationMin(Number(data.breakDurationMin));
          if (data.timezone) setTimezone(data.timezone);
          if (data.telegramBotToken) setTgBotToken(data.telegramBotToken);
          if (data.telegramChatId) setTgChatId(data.telegramChatId);
        }
      } catch (err) {
        console.error("Failed to load preferences:", err);
      } finally {
        setLoading(false);
      }
    }

    loadPreferences();

    // Check Cal.com status
    fetch("/api/calcom/status")
      .then((res) => res.json())
      .then((data) => {
        if (data.connected) {
          setCalStatus("success");
          if (data.user?.name || data.user?.username) {
            setCalUser(data.user.name || data.user.username);
          }
        }
      })
      .catch(() => {});
  }, []);

  const saveSchedule = async () => {
    setSavingSection("schedule");
    setSavedSection(null);
    setErrorSection(null);

    try {
      const res = await fetch("/api/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wakeTime,
          sleepTime,
          workStartTime,
          workEndTime,
          peakHoursStart,
          peakHoursEnd,
          lunchTime,
          lunchDurationMin: Number(lunchDurationMin),
          breakDurationMin: Number(breakDurationMin),
          timezone,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save schedule");
      }

      const updated = await res.json();
      // Sync local state
      if (updated.wakeTime) setWakeTime(updated.wakeTime);
      if (updated.sleepTime) setSleepTime(updated.sleepTime);
      if (updated.workStartTime) setWorkStartTime(updated.workStartTime);
      if (updated.workEndTime) setWorkEndTime(updated.workEndTime);

      setSavedSection("schedule");
      setTimeout(() => setSavedSection(null), 3000);
    } catch (err) {
      console.error(err);
      setErrorSection("schedule");
      setTimeout(() => setErrorSection(null), 4000);
    } finally {
      setSavingSection(null);
    }
  };

  const saveIntegrations = async () => {
    setSavingSection("integrations");
    setSavedSection(null);
    setErrorSection(null);

    try {
      const res = await fetch("/api/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegramBotToken: tgBotToken,
          telegramChatId: tgChatId,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save integrations");
      }

      const updated = await res.json();
      if (updated.telegramBotToken) setTgBotToken(updated.telegramBotToken);
      if (updated.telegramChatId) setTgChatId(updated.telegramChatId);

      setSavedSection("integrations");
      setTimeout(() => setSavedSection(null), 3000);
    } catch (err) {
      console.error(err);
      setErrorSection("integrations");
      setTimeout(() => setErrorSection(null), 4000);
    } finally {
      setSavingSection(null);
    }
  };

  const testCalcom = async () => {
    setCalStatus("testing");
    try {
      const res = await fetch("/api/calcom/status");
      const data = await res.json();
      if (data.connected) {
        setCalStatus("success");
      } else {
        setCalStatus("error");
      }
    } catch {
      setCalStatus("error");
    }
  };

  const detectChatId = async () => {
    setDetectingChatId(true);
    setTgFeedback(null);
    try {
      const res = await fetch("/api/telegram/detect-chat-id");
      const data = await res.json();
      if (data.found && data.chatId) {
        setTgChatId(data.chatId);
        setTgFeedback(`Found chat ID: ${data.chatId} (@${data.username})! Auto-saving...`);

        // Automatically persist to backend
        const saveRes = await fetch("/api/preferences", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            telegramBotToken: tgBotToken,
            telegramChatId: data.chatId,
          }),
        });

        if (saveRes.ok) {
          setTgFeedback(`Connected to @${data.username} (ID: ${data.chatId}) and saved!`);
        }
      } else {
        setTgFeedback(data.message || "No recent messages found. Open @iris_the_personal_bot in Telegram and send /start first!");
      }
    } catch {
      setTgFeedback("Failed to detect chat ID. Please verify your connection.");
    } finally {
      setDetectingChatId(false);
    }
  };

  const testTelegram = async () => {
    setTgStatus("testing");
    setTgFeedback(null);
    try {
      const res = await fetch("/api/telegram/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: tgBotToken,
          chatId: tgChatId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTgStatus("success");
        setTgFeedback("Message delivered! Check your Telegram chat.");
      } else {
        setTgStatus("error");
        setTgFeedback(data.error || "Failed to send message.");
      }
    } catch (e: any) {
      setTgStatus("error");
      setTgFeedback(e.message || "Failed to connect to Telegram.");
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-3xl">
      {/* Routine Hours */}
      <Card className="bg-white border-stone-200/90 shadow-xs rounded-xl overflow-hidden">
        <CardHeader className="pb-3 border-b border-stone-100">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-semibold text-stone-900 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-stone-700" />
              Schedule & Work Hours
            </CardTitle>
            {loading && (
              <span className="text-[11px] text-stone-400 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Loading preferences...
              </span>
            )}
          </div>
          <CardDescription className="text-xs text-stone-500">
            Set your daily hours so the AI planner schedules deep work, meetings, and habits within realistic boundaries.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <Label className="text-xs font-medium text-stone-700">Wake up time</Label>
              <Input 
                type="time" 
                value={wakeTime}
                onChange={(e) => setWakeTime(e.target.value)}
                className="bg-stone-50 border-stone-200 text-stone-800 text-xs h-8.5 rounded-md" 
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium text-stone-700">Sleep time</Label>
              <Input 
                type="time" 
                value={sleepTime}
                onChange={(e) => setSleepTime(e.target.value)}
                className="bg-stone-50 border-stone-200 text-stone-800 text-xs h-8.5 rounded-md" 
              />
            </div>
          </div>
          
          <Separator className="bg-stone-100" />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <Label className="text-xs font-medium text-stone-700">Work start</Label>
              <Input 
                type="time" 
                value={workStartTime}
                onChange={(e) => setWorkStartTime(e.target.value)}
                className="bg-stone-50 border-stone-200 text-stone-800 text-xs h-8.5 rounded-md" 
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium text-stone-700">Work end</Label>
              <Input 
                type="time" 
                value={workEndTime}
                onChange={(e) => setWorkEndTime(e.target.value)}
                className="bg-stone-50 border-stone-200 text-stone-800 text-xs h-8.5 rounded-md" 
              />
            </div>
          </div>

          <Separator className="bg-stone-100" />

          {/* Peak Cognitive Energy Hours */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <Label className="text-xs font-medium text-stone-700 flex items-center gap-1">
                <SunMedium className="w-3 h-3 text-amber-600" />
                Peak Focus Start (Deep Work)
              </Label>
              <Input 
                type="time" 
                value={peakHoursStart}
                onChange={(e) => setPeakHoursStart(e.target.value)}
                className="bg-stone-50 border-stone-200 text-stone-800 text-xs h-8.5 rounded-md" 
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium text-stone-700 flex items-center gap-1">
                <SunMedium className="w-3 h-3 text-amber-600" />
                Peak Focus End
              </Label>
              <Input 
                type="time" 
                value={peakHoursEnd}
                onChange={(e) => setPeakHoursEnd(e.target.value)}
                className="bg-stone-50 border-stone-200 text-stone-800 text-xs h-8.5 rounded-md" 
              />
            </div>
          </div>

          <Separator className="bg-stone-100" />

          {/* Lunch & Buffer Times */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="space-y-1">
              <Label className="text-xs font-medium text-stone-700 flex items-center gap-1">
                <Coffee className="w-3 h-3 text-stone-600" />
                Lunch Time
              </Label>
              <Input 
                type="time" 
                value={lunchTime}
                onChange={(e) => setLunchTime(e.target.value)}
                className="bg-stone-50 border-stone-200 text-stone-800 text-xs h-8.5 rounded-md" 
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium text-stone-700">Lunch Duration (min)</Label>
              <Input 
                type="number" 
                value={lunchDurationMin}
                onChange={(e) => setLunchDurationMin(Number(e.target.value))}
                min={15}
                max={120}
                className="bg-stone-50 border-stone-200 text-stone-800 text-xs h-8.5 rounded-md" 
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium text-stone-700">Task Buffer (min)</Label>
              <Input 
                type="number" 
                value={breakDurationMin}
                onChange={(e) => setBreakDurationMin(Number(e.target.value))}
                min={5}
                max={60}
                className="bg-stone-50 border-stone-200 text-stone-800 text-xs h-8.5 rounded-md" 
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              {savedSection === "schedule" && (
                <span className="text-xs text-emerald-700 font-medium flex items-center gap-1.5 animate-in fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Schedule hours saved to cloud
                </span>
              )}
              {errorSection === "schedule" && (
                <span className="text-xs text-rose-600 font-medium flex items-center gap-1.5 animate-in fade-in">
                  <AlertCircle className="w-3.5 h-3.5" /> Failed to save schedule
                </span>
              )}
            </div>

            <Button 
              onClick={saveSchedule} 
              disabled={savingSection === "schedule"}
              size="sm"
              className="bg-stone-900 hover:bg-stone-800 text-white text-xs h-8 px-3 rounded-md font-medium cursor-pointer"
            >
              {savingSection === "schedule" ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 mr-1.5" /> Save hours
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Connected Services */}
      <Card className="bg-white border-stone-200/90 shadow-xs rounded-xl overflow-hidden">
        <CardHeader className="pb-3 border-b border-stone-100">
          <CardTitle className="text-xs font-semibold text-stone-900">Integrations & API Keys</CardTitle>
          <CardDescription className="text-xs text-stone-500">
            OpenRouter for schedule generation, Cal.com for calendar sync, and Telegram for real-time reminders.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 pt-4">
          {/* Cal.com */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-stone-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-stone-700" />
                Cal.com Calendar Sync
              </Label>
              {calStatus === "success" && (
                <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                  <CheckCircle2 className="w-3 h-3" /> Connected: {calUser || "Active"}
                </span>
              )}
            </div>
            <Input 
              type="password" 
              defaultValue="cal_live_••••••••••••••••••••••••" 
              disabled 
              className="bg-stone-50 border-stone-200 text-stone-600 text-xs h-8.5 rounded-md font-mono" 
            />
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={testCalcom}
                disabled={calStatus === "testing"}
                className="text-xs border-stone-200 text-stone-700 hover:text-stone-900 hover:bg-stone-50 h-7.5 rounded-md cursor-pointer"
              >
                {calStatus === "testing" ? "Testing..." : "Test connection"}
              </Button>
            </div>
          </div>

          <Separator className="bg-stone-100" />

          {/* Telegram */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-stone-700 flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-stone-700" />
                Telegram Reminders & Alerts
              </Label>
              <a
                href="https://t.me/iris_the_personal_bot"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-stone-500 hover:text-stone-900 flex items-center gap-1 underline underline-offset-2"
              >
                <span>@iris_the_personal_bot</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>

            <div className="space-y-2">
              <div>
                <span className="text-[11px] text-stone-500 mb-1 block">Bot Token</span>
                <Input 
                  type="password"
                  value={tgBotToken}
                  onChange={(e) => setTgBotToken(e.target.value)}
                  placeholder="Bot Token (8528779259:AAG8...)" 
                  className="bg-stone-50 border-stone-200 text-stone-800 text-xs h-8.5 rounded-md font-mono" 
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-stone-500">Chat ID</span>
                  <button
                    type="button"
                    onClick={detectChatId}
                    disabled={detectingChatId}
                    className="text-[11px] text-emerald-700 hover:text-emerald-800 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${detectingChatId ? "animate-spin" : ""}`} />
                    <span>Auto-detect Chat ID</span>
                  </button>
                </div>
                <Input 
                  value={tgChatId}
                  onChange={(e) => setTgChatId(e.target.value)}
                  placeholder="e.g. 123456789 (or click Auto-detect after sending /start)" 
                  className="bg-stone-50 border-stone-200 text-stone-800 text-xs h-8.5 rounded-md font-mono" 
                />
              </div>
            </div>

            {tgFeedback && (
              <div className={`p-2.5 rounded-md text-xs leading-relaxed ${
                tgStatus === "success" || tgFeedback.includes("Found chat ID") || tgFeedback.includes("Connected to")
                  ? "bg-emerald-50 border border-emerald-200/80 text-emerald-800"
                  : "bg-stone-100 border border-stone-200 text-stone-700"
              }`}>
                {tgFeedback}
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <Button 
                variant="outline" 
                size="sm"
                onClick={testTelegram}
                disabled={tgStatus === "testing" || !tgChatId}
                className="text-xs border-stone-200 text-stone-700 hover:text-stone-900 hover:bg-stone-50 h-7.5 rounded-md cursor-pointer"
              >
                {tgStatus === "testing" ? "Sending..." : "Send test message"}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-stone-100">
            <div>
              {savedSection === "integrations" && (
                <span className="text-xs text-emerald-700 font-medium flex items-center gap-1.5 animate-in fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Integration settings saved
                </span>
              )}
              {errorSection === "integrations" && (
                <span className="text-xs text-rose-600 font-medium flex items-center gap-1.5 animate-in fade-in">
                  <AlertCircle className="w-3.5 h-3.5" /> Failed to save settings
                </span>
              )}
            </div>

            <Button 
              onClick={saveIntegrations} 
              disabled={savingSection === "integrations"}
              size="sm"
              className="bg-stone-900 hover:bg-stone-800 text-white text-xs h-8 px-3 rounded-md font-medium cursor-pointer"
            >
              {savingSection === "integrations" ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 mr-1.5" /> Save settings
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
