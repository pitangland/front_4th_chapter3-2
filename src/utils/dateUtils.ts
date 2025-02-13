import {
  addDays,
  addWeeks,
  addMonths,
  addYears,
  lastDayOfMonth,
  getDate,
  isBefore,
} from 'date-fns';

import { Event } from '../types';

/**
 * 주어진 년도와 월의 일수를 반환합니다.
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * 주어진 날짜가 속한 주의 모든 날짜를 반환합니다.
 */
export function getWeekDates(date: Date): Date[] {
  const day = date.getDay();
  const diff = date.getDate() - day;
  const sunday = new Date(date.setDate(diff));
  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const nextDate = new Date(sunday);
    nextDate.setDate(sunday.getDate() + i);
    weekDates.push(nextDate);
  }
  return weekDates;
}

export function getWeeksAtMonth(currentDate: Date) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month + 1);
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const weeks = [];

  const initWeek = () => Array(7).fill(null);

  let week: Array<number | null> = initWeek();

  for (let i = 0; i < firstDayOfMonth; i++) {
    week[i] = null;
  }

  for (const day of days) {
    const dayIndex = (firstDayOfMonth + day - 1) % 7;
    week[dayIndex] = day;
    if (dayIndex === 6 || day === daysInMonth) {
      weeks.push(week);
      week = initWeek();
    }
  }

  return weeks;
}

export function getEventsForDay(events: Event[], date: number): Event[] {
  return events.filter((event) => new Date(event.date).getDate() === date);
}

export function formatWeek(targetDate: Date) {
  const dayOfWeek = targetDate.getDay();
  const diffToThursday = 4 - dayOfWeek;
  const thursday = new Date(targetDate);
  thursday.setDate(targetDate.getDate() + diffToThursday);

  const year = thursday.getFullYear();
  const month = thursday.getMonth() + 1;

  const firstDayOfMonth = new Date(thursday.getFullYear(), thursday.getMonth(), 1);

  const firstThursday = new Date(firstDayOfMonth);
  firstThursday.setDate(1 + ((4 - firstDayOfMonth.getDay() + 7) % 7));

  const weekNumber: number =
    Math.floor((thursday.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;

  return `${year}년 ${month}월 ${weekNumber}주`;
}

/**
 * 주어진 날짜의 월 정보를 "YYYY년 M월" 형식으로 반환합니다.
 */
export function formatMonth(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  return `${year}년 ${month}월`;
}

const stripTime = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/**
 * 주어진 날짜가 특정 범위 내에 있는지 확인합니다.
 */
export function isDateInRange(date: Date, rangeStart: Date, rangeEnd: Date): boolean {
  const normalizedDate = stripTime(date);
  const normalizedStart = stripTime(rangeStart);
  const normalizedEnd = stripTime(rangeEnd);

  return normalizedDate >= normalizedStart && normalizedDate <= normalizedEnd;
}

export function fillZero(value: number, size = 2) {
  return String(value).padStart(size, '0');
}

export function formatDate(currentDate: Date, day?: number) {
  return [
    currentDate.getFullYear(),
    fillZero(currentDate.getMonth() + 1),
    fillZero(day ?? currentDate.getDate()),
  ].join('-');
}

// 반복일정
export const calculateNextRepeatDate = (
  currentDate: string,
  repeatType: 'daily' | 'weekly' | 'monthly' | 'yearly',
  repeatInterval: number
): string => {
  const dateObj = new Date(currentDate);
  const originalDay = getDate(dateObj); // 원래 날짜 저장

  let nextDate;

  switch (repeatType) {
    case 'daily':
      nextDate = addDays(dateObj, repeatInterval);
      break;
    case 'weekly':
      nextDate = addWeeks(dateObj, repeatInterval);
      break;
    case 'monthly':
      const tentativeNextMonth = addMonths(dateObj, repeatInterval);
      const lastDayInNextMonth = getDate(lastDayOfMonth(tentativeNextMonth));

      // 31일이 없는 달은 마지막 날로 설정
      nextDate =
        originalDay > lastDayInNextMonth
          ? lastDayOfMonth(tentativeNextMonth)
          : new Date(tentativeNextMonth.getFullYear(), tentativeNextMonth.getMonth(), originalDay);
      break;
    case 'yearly':
      nextDate = addYears(dateObj, repeatInterval);
      break;
    default:
      nextDate = dateObj;
  }

  return nextDate.toISOString().split('T')[0];
};

//반복종료
export const calculateRepeatDates = (
  startDate: string,
  repeatType: 'daily' | 'weekly' | 'monthly' | 'yearly',
  repeatInterval: number,
  repeatEndType: 'none' | 'date' | 'count',
  repeatEndDate?: string,
  repeatOccurrences?: number
): string[] => {
  const dates: string[] = [];
  let currentDate = new Date(startDate);
  let count = 0;

  while (true) {
    if (
      repeatEndType === 'date' &&
      repeatEndDate &&
      isBefore(new Date(repeatEndDate), currentDate)
    ) {
      break;
    }
    if (repeatEndType === 'count' && repeatOccurrences && count >= repeatOccurrences) {
      break;
    }

    dates.push(currentDate.toISOString().split('T')[0]); // YYYY-MM-DD 형식 저장

    switch (repeatType) {
      case 'daily':
        currentDate = addDays(currentDate, repeatInterval);
        break;
      case 'weekly':
        currentDate = addWeeks(currentDate, repeatInterval);
        break;
      case 'monthly':
        currentDate = addMonths(currentDate, repeatInterval);
        break;
      case 'yearly':
        currentDate = addYears(currentDate, repeatInterval);
        break;
    }

    count++;
  }

  return dates;
};
