import { db } from "../db";
import { advisorDeals, usageAnalytics, facilities, covenants } from "@shared/schema";
import { eq, and, sql, desc } from "drizzle-orm";

export async function calculateAdvisorWinRate(advisorId: string) {
  const deals = await db.select().from(advisorDeals)
    .where(eq(advisorDeals.advisorId, advisorId));
  
  const won = deals.filter(d => d.status === 'closed').length;
  const lost = deals.filter(d => d.status === 'lost').length;
  const totalDeals = won + lost;
  
  return {
    totalDeals,
    won,
    lost,
    pending: deals.filter(d => !['closed', 'lost'].includes(d.status || '')).length,
    winRate: totalDeals > 0 ? ((won / totalDeals) * 100).toFixed(1) : '0',
    totalVolume: deals.reduce((sum, d) => sum + (d.dealSize || 0), 0),
  };
}

export async function calculatePlatformMetrics() {
  const [
    totalFacilities,
    activeFacilities,
    totalCovenants,
    totalAnalytics,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(facilities),
    db.select({ count: sql<number>`count(*)` }).from(facilities)
      .where(eq(facilities.status, 'active')),
    db.select({ count: sql<number>`count(*)` }).from(covenants),
    db.select({ count: sql<number>`count(*)` }).from(usageAnalytics),
  ]);

  const analytics = await db.select().from(usageAnalytics);
  
  const totalTimeSaved = analytics.reduce((sum, a) => sum + (a.timeSavingsSeconds || 0), 0);
  const totalCostSaved = analytics.reduce((sum, a) => sum + (a.estimatedLaborCostSaved || 0), 0);
  
  const activityBreakdown = analytics.reduce((acc, a) => {
    if (!acc[a.activityType]) {
      acc[a.activityType] = {
        count: 0,
        totalTimeSaved: 0,
        avgTimeSavingsPercentage: 0,
      };
    }
    acc[a.activityType].count++;
    acc[a.activityType].totalTimeSaved += a.timeSavingsSeconds || 0;
    acc[a.activityType].avgTimeSavingsPercentage += parseFloat(a.timeSavingsPercentage?.toString() || "0");
    return acc;
  }, {} as Record<string, any>);

  for (const activity in activityBreakdown) {
    activityBreakdown[activity].avgTimeSavingsPercentage = 
      (activityBreakdown[activity].avgTimeSavingsPercentage / activityBreakdown[activity].count).toFixed(1);
  }

  return {
    facilities: {
      total: totalFacilities[0]?.count || 0,
      active: activeFacilities[0]?.count || 0,
    },
    covenants: {
      total: totalCovenants[0]?.count || 0,
    },
    automation: {
      activitiesTracked: totalAnalytics[0]?.count || 0,
      totalHoursSaved: Math.floor(totalTimeSaved / 3600),
      totalCostSaved,
      activityBreakdown,
    },
  };
}

export async function getUserActivityTimeline(userId: string, limit: number = 10) {
  const activities = await db.select()
    .from(usageAnalytics)
    .where(eq(usageAnalytics.userId, userId))
    .orderBy(desc(usageAnalytics.createdAt))
    .limit(limit);

  return activities.map(a => ({
    id: a.id,
    type: a.activityType,
    startTime: a.startTime,
    endTime: a.endTime,
    durationHours: a.durationSeconds ? (a.durationSeconds / 3600).toFixed(1) : '0',
    timeSaved: a.timeSavingsSeconds ? (a.timeSavingsSeconds / 3600).toFixed(1) : '0',
    timeSavingsPercentage: a.timeSavingsPercentage,
    automationLevel: a.automationLevel,
    completed: a.completed,
  }));
}

export async function getEfficiencyTrends(days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const activities = await db.select()
    .from(usageAnalytics)
    .where(sql`${usageAnalytics.createdAt} >= ${startDate}`);

  const dailyMetrics = activities.reduce((acc, a) => {
    const date = a.createdAt.toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = {
        date,
        activities: 0,
        totalTimeSaved: 0,
        avgEfficiency: 0,
      };
    }
    acc[date].activities++;
    acc[date].totalTimeSaved += (a.timeSavingsSeconds || 0) / 3600;
    acc[date].avgEfficiency += parseFloat(a.timeSavingsPercentage?.toString() || "0");
    return acc;
  }, {} as Record<string, any>);

  return Object.values(dailyMetrics).map((day: any) => ({
    ...day,
    avgEfficiency: parseFloat((day.avgEfficiency / day.activities).toFixed(1)),
    totalTimeSaved: parseFloat(day.totalTimeSaved.toFixed(1)),
  }));
}
