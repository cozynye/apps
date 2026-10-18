/** Prints the ISO week ids the weekly generator needs. Usage: pnpm tsx scripts/marketing/week.ts [--next] */
import { isoWeek, nextWeek, weekDates } from '../../packages/marketing/src';
import { flag } from './lib';

const current = isoWeek(new Date());
const week = flag('next') ? nextWeek(current) : current;
console.log(JSON.stringify({ current, week, dates: weekDates(week) }, null, 2));
