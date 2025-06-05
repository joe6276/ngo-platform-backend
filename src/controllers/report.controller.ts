import { Request, Response } from 'express';
import { Op } from 'sequelize';
import Goal from '../database/models/Goal';
import KPI from '../database/models/KPI';
import Event from '../database/models/Event';
import DonationIn from '../database/models/DonationIn';
import DonationOut from '../database/models/DonationOut';
import DonationInGoal from '../database/models/DonationGoal'; // Assuming proper join table
import DonationOutGoal from '../database/models/DonationGoal';
import { AuthenticatedRequest } from '../types/auth';

export const getGoalReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { region, startDate, endDate } = req.query;

    // Filters
    const whereClause: any = {};
    whereClause.organizationId = req.user!.organizationId;
    if (region) whereClause.region = region;
    if (startDate || endDate) {
      whereClause.startDate = {};
      if (startDate) whereClause.startDate[Op.gte] = new Date(startDate as string);
      if (endDate) whereClause.startDate[Op.lte] = new Date(endDate as string);
    }

    // Fetch goals + related data
    const goals = await Goal.findAll({
      where: whereClause,
      include: [
        { model: KPI },
        { model: Event },
        { model: DonationIn },
        { model: DonationOut }
      ]
    });

    const totalGoals = goals.length;

    const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
    const avg = (arr: number[]) => arr.length ? sum(arr) / arr.length : 0;

    const progressArr = goals.map(g => Number(g.progressPercentage));
    const successRateArr = goals.map(g => Number(g.successRate));
    const timeProgressArr = goals.map(g => Number(g.timeProgress));

    const averageProgress = avg(progressArr);
    const averageSuccessRate = avg(successRateArr);
    const averageTimeProgress = avg(timeProgressArr);

    // Status breakdown
    const statusBreakdown: Record<string, number> = {};
    for (const g of goals) {
      statusBreakdown[g.status] = (statusBreakdown[g.status] || 0) + 1;
    }

    // Region breakdown
    const regionMap: Record<string, { count: number, totalProgress: number }> = {};
    for (const g of goals) {
      const region = g.region;
      if (!regionMap[region]) regionMap[region] = { count: 0, totalProgress: 0 };
      regionMap[region].count += 1;
      regionMap[region].totalProgress += Number(g.progressPercentage);
    }

    const regionBreakdown = Object.entries(regionMap).map(([region, data]) => ({
      region,
      goalCount: data.count,
      averageProgress: data.totalProgress / data.count,
    }));

    // At-risk goals
    const atRiskGoals = goals
      .filter(g => g.timeProgress - g.progressPercentage >= 25)
      .map(g => ({
        id: g.id,
        title: g.title,
        progressPercentage: Number(g.progressPercentage),
        timeProgress: Number(g.timeProgress),
        status: g.status,
      }));

    // KPI Summary
    const allKpis = goals.flatMap(g => g.kpis ?? []);
    const totalKpis = allKpis.length;
    const kpiSuccessArr = allKpis.map(k => Number(k.successRate));
    const kpiTimeArr = goals.map(g => g.timeProgress);

    const kpiStatusBreakdown: Record<string, number> = {};
    for (const k of allKpis) {
      kpiStatusBreakdown[k.status] = (kpiStatusBreakdown[k.status] || 0) + 1;
    }

    const kpiSummary = {
      totalKpis,
      averageKpiSuccessRate: avg(kpiSuccessArr),
      averageKpiTimeProgress: avg(kpiTimeArr),
      statusBreakdown: kpiStatusBreakdown,
    };

    // Event Summary
    const allEvents = goals.flatMap(g => g.events ?? []);
    const totalEvents = allEvents.length;

    // Donations
    let totalDonationIn = 0;
    let totalDonationOut = 0;
    for (const g of goals) {
      totalDonationIn += g.donationsIn?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;
      totalDonationOut += g.donationsOut?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;
    }

    const donationSummary = {
      totalDonationIn,
      totalDonationOut,
      netFlow: totalDonationIn - totalDonationOut,
    };

    // Final report
    res.json({
      totalGoals,
      averageProgress,
      averageSuccessRate,
      averageTimeProgress,
      statusBreakdown,
      regionBreakdown,
      atRiskGoals,
      kpiSummary,
      totalEvents,
      donationSummary,
    });

  } catch (error) {
    console.error('Error generating full goal report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
