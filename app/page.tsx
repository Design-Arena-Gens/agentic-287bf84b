'use client';

import { useState, useEffect } from 'react';
import { Plus, Flame, Bell, Calendar, Trash2, Check } from 'lucide-react';
import { format, startOfDay, differenceInCalendarDays } from 'date-fns';

interface Habit {
  id: string;
  name: string;
  emoji: string;
  color: string;
  createdAt: string;
  completedDates: string[];
  reminderTime?: string;
}

export default function Home() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitEmoji, setNewHabitEmoji] = useState('✨');
  const [newHabitColor, setNewHabitColor] = useState('#0ea5e9');
  const [reminderTime, setReminderTime] = useState('09:00');
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  const emojis = ['✨', '💪', '📚', '🏃', '🧘', '💧', '🎯', '✍️', '🌱', '🎨', '🎵', '🍎'];
  const colors = ['#0ea5e9', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#06b6d4', '#6366f1'];

  useEffect(() => {
    const stored = localStorage.getItem('habits');
    if (stored) {
      setHabits(JSON.parse(stored));
    }

    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    if (habits.length > 0) {
      localStorage.setItem('habits', JSON.stringify(habits));
      scheduleReminders();
    }
  }, [habits]);

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
    }
  };

  const scheduleReminders = () => {
    habits.forEach(habit => {
      if (habit.reminderTime && notificationPermission === 'granted') {
        const [hours, minutes] = habit.reminderTime.split(':');
        const now = new Date();
        const reminderDate = new Date();
        reminderDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        if (reminderDate < now) {
          reminderDate.setDate(reminderDate.getDate() + 1);
        }

        const timeUntilReminder = reminderDate.getTime() - now.getTime();

        setTimeout(() => {
          if (Notification.permission === 'granted') {
            new Notification(`Time for: ${habit.name}`, {
              body: `Don't forget to complete your habit today!`,
              icon: '/icon-192.png',
              badge: '/icon-192.png',
            });
          }
        }, timeUntilReminder);
      }
    });
  };

  const addHabit = () => {
    if (!newHabitName.trim()) return;

    const newHabit: Habit = {
      id: Date.now().toString(),
      name: newHabitName,
      emoji: newHabitEmoji,
      color: newHabitColor,
      createdAt: new Date().toISOString(),
      completedDates: [],
      reminderTime: reminderTime,
    };

    setHabits([...habits, newHabit]);
    setNewHabitName('');
    setShowAddForm(false);
  };

  const toggleHabit = (habitId: string) => {
    const today = format(startOfDay(new Date()), 'yyyy-MM-dd');

    setHabits(habits.map(habit => {
      if (habit.id === habitId) {
        const isCompleted = habit.completedDates.includes(today);
        return {
          ...habit,
          completedDates: isCompleted
            ? habit.completedDates.filter(date => date !== today)
            : [...habit.completedDates, today].sort(),
        };
      }
      return habit;
    }));
  };

  const deleteHabit = (habitId: string) => {
    if (confirm('Are you sure you want to delete this habit?')) {
      setHabits(habits.filter(habit => habit.id !== habitId));
    }
  };

  const calculateStreak = (completedDates: string[]) => {
    if (completedDates.length === 0) return 0;

    const sortedDates = [...completedDates].sort().reverse();
    const today = startOfDay(new Date());
    let streak = 0;

    for (let i = 0; i < sortedDates.length; i++) {
      const date = startOfDay(new Date(sortedDates[i]));
      const expectedDaysDiff = i;
      const actualDaysDiff = differenceInCalendarDays(today, date);

      if (actualDaysDiff === expectedDaysDiff) {
        streak++;
      } else if (actualDaysDiff === expectedDaysDiff + 1 && i === 0) {
        continue;
      } else {
        break;
      }
    }

    return streak;
  };

  const isCompletedToday = (completedDates: string[]) => {
    const today = format(startOfDay(new Date()), 'yyyy-MM-dd');
    return completedDates.includes(today);
  };

  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push({
        date: format(startOfDay(date), 'yyyy-MM-dd'),
        label: format(date, 'EEE')[0],
      });
    }
    return days;
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 pb-20">
      <div className="max-w-md mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">
            Habit Tracker
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Build consistent habits, one day at a time
          </p>
        </div>

        {/* Stats */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 mb-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Active Habits</p>
              <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{habits.length}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Completed Today</p>
              <p className="text-3xl font-bold text-primary-500">
                {habits.filter(h => isCompletedToday(h.completedDates)).length}
              </p>
            </div>
          </div>
        </div>

        {/* Notification Permission */}
        {notificationPermission === 'default' && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <Bell className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-900 dark:text-amber-200 mb-1">
                  Enable Reminders
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mb-3">
                  Get notified to complete your habits
                </p>
                <button
                  onClick={requestNotificationPermission}
                  className="text-xs bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg font-medium"
                >
                  Enable Notifications
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Habits List */}
        <div className="space-y-4 mb-6">
          {habits.map(habit => {
            const streak = calculateStreak(habit.completedDates);
            const completedToday = isCompletedToday(habit.completedDates);
            const last7Days = getLast7Days();

            return (
              <div
                key={habit.id}
                className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-lg"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                      style={{ backgroundColor: habit.color + '20' }}
                    >
                      {habit.emoji}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 dark:text-slate-100">
                        {habit.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Flame className="w-4 h-4 text-orange-500" />
                        <span className="text-sm font-medium text-orange-500">
                          {streak} day{streak !== 1 ? 's' : ''}
                        </span>
                        {habit.reminderTime && (
                          <>
                            <span className="text-slate-400">•</span>
                            <Bell className="w-3 h-3 text-slate-400" />
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {habit.reminderTime}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteHabit(habit.id)}
                    className="text-slate-400 hover:text-red-500 p-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Week View */}
                <div className="flex gap-1 mb-4">
                  {last7Days.map(day => {
                    const isCompleted = habit.completedDates.includes(day.date);
                    return (
                      <div
                        key={day.date}
                        className="flex-1 flex flex-col items-center gap-1"
                      >
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {day.label}
                        </span>
                        <div
                          className={`w-full h-2 rounded-full transition-colors ${
                            isCompleted
                              ? 'bg-green-500'
                              : 'bg-slate-200 dark:bg-slate-700'
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Complete Button */}
                <button
                  onClick={() => toggleHabit(habit.id)}
                  className={`w-full py-3 rounded-xl font-medium transition-all ${
                    completedToday
                      ? 'bg-green-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {completedToday ? (
                    <span className="flex items-center justify-center gap-2">
                      <Check className="w-5 h-5" />
                      Completed Today
                    </span>
                  ) : (
                    'Mark as Complete'
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Add Habit Form */}
        {showAddForm ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">
              New Habit
            </h3>

            <input
              type="text"
              placeholder="Habit name"
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 mb-4 focus:outline-none focus:ring-2 focus:ring-primary-500"
              autoFocus
            />

            <div className="mb-4">
              <label className="text-sm text-slate-600 dark:text-slate-400 mb-2 block">
                Choose an emoji
              </label>
              <div className="grid grid-cols-6 gap-2">
                {emojis.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => setNewHabitEmoji(emoji)}
                    className={`w-full aspect-square rounded-xl text-2xl flex items-center justify-center transition-all ${
                      newHabitEmoji === emoji
                        ? 'bg-primary-500 scale-110'
                        : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="text-sm text-slate-600 dark:text-slate-400 mb-2 block">
                Choose a color
              </label>
              <div className="grid grid-cols-8 gap-2">
                {colors.map(color => (
                  <button
                    key={color}
                    onClick={() => setNewHabitColor(color)}
                    className={`w-full aspect-square rounded-xl transition-all ${
                      newHabitColor === color ? 'scale-110 ring-2 ring-slate-400' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="text-sm text-slate-600 dark:text-slate-400 mb-2 block flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Daily reminder (optional)
              </label>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowAddForm(false)}
                className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={addHabit}
                className="flex-1 py-3 rounded-xl bg-primary-500 text-white font-medium"
              >
                Add Habit
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full py-4 rounded-2xl bg-primary-500 text-white font-medium shadow-lg hover:bg-primary-600 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add New Habit
          </button>
        )}

        {/* Empty State */}
        {habits.length === 0 && !showAddForm && (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400 mb-2">
              No habits yet
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-500">
              Create your first habit to get started
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
