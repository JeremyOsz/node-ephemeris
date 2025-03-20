import { WeeklyTransits } from '../src/weekly-transits';

// Calculate transits for the next week
const startDate = new Date();
const endDate = new Date();
endDate.setDate(endDate.getDate() + 7); // Add 7 days

const weeklyTransits = new WeeklyTransits(startDate, endDate);
const report = weeklyTransits.generateReport();
console.log(report); 