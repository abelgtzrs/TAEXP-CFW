import React from "react";
import CalendarWidget from "../../dashboard/CalendarWidget";
import HabitTrackerWidget from "../../dashboard/HabitTrackerWidget";
import BookTrackerWidget from "../../dashboard/BookTrackerWidget";
import WorkoutTrackerWidget from "../../dashboard/WorkoutTrackerWidget";
import SecuritySettingsWidget from "../../dashboard/SecuritySettingsWidget";
import StrokesLyricsWidget from "../../dashboard/StrokesLyricsWidget";
import GoalsWidget from "../../dashboard/GoalsWidget";
import RecentAcquisitionsWidget from "../../dashboard/RecentAcquisitionsWidget";
import TopProductsWidget from "../../dashboard/TopProductsWidget";
import CurrencySourceWidget from "../../dashboard/CurrencySourceWidget";
import LoreChartWidget from "../../dashboard/LoreChartWidget";
import QuickNotesWidget from "../../dashboard/QuickNotesWidget";
import QuickLinksWidget from "../../dashboard/QuickLinksWidget";
import FocusTimerWidget from "../../dashboard/FocusTimerWidget";
import DailyQuoteWidget from "../../dashboard/DailyQuoteWidget";
import CountdownWidget from "../../dashboard/CountdownWidget";

export const registry = {
  calendar: () => <CalendarWidget />,
  habit: () => <HabitTrackerWidget />,
  book: () => <BookTrackerWidget />,
  workout: () => <WorkoutTrackerWidget />,
  security: () => <SecuritySettingsWidget />,
  strokes: () => <StrokesLyricsWidget />,
  goals: (props) => <GoalsWidget {...props} />, // may receive stats
  recent: (props) => <RecentAcquisitionsWidget {...props} />, // may receive stats
  top: (props) => <TopProductsWidget {...props} />, // may receive stats
  currency: () => <CurrencySourceWidget />,
  charts: () => <LoreChartWidget />,
  "quick-notes": () => <QuickNotesWidget />,
  "quick-links": () => <QuickLinksWidget />,
  "focus-timer": () => <FocusTimerWidget />,
  "daily-quote": () => <DailyQuoteWidget />,
  countdown: () => <CountdownWidget />,
};
