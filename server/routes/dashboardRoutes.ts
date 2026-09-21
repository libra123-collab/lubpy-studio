import { Router, Response } from 'express';
import { storage } from '../../src/db/storage.ts';
import { AuthRequest } from '../middleware/auth.ts';
import { successResponse, errorResponse } from '../utils/responseFormatter.ts';

const router = Router();

// 1. ADMIN DASHBOARD METRICS
router.get('/admin', async (req: AuthRequest, res: Response) => {
  try {
    const userList = await storage.getAllUsers();
    const clientCount = userList.filter(u => u.role === 'CLIENT').length;
    const prjList = await storage.getAllProjects();
    const activeProjects = prjList.filter(p => !['DELIVERED', 'CANCELLED', 'REFUNDED', 'COMPLETED'].includes(p.status)).length;
    const completedProjects = prjList.filter(p => p.status === 'DELIVERED' || p.status === 'COMPLETED').length;
    const totalRevenue = prjList.reduce((sum, p) => sum + (Number(p.priceVnd) || 0), 0);

    const ticketList = await storage.getAllTickets();
    const openTickets = ticketList.filter(t => t.status === 'OPEN').length;

    const txList = await storage.getAllTransactions();
    const pendingPayments = txList.filter(t => t.status === 'pending').length;

    const metrics = {
      totalUsers: userList.length,
      totalClients: clientCount,
      totalProjects: prjList.length,
      activeProjects,
      completedProjects,
      revenue: totalRevenue,
      pendingPayments,
      openTickets,
    };

    return res.json(
      successResponse(metrics, 'Lấy số liệu quản trị hệ thống thành công.')
    );
  } catch (err: any) {
    return res.status(500).json(
      errorResponse('SERVER_ERROR', err.message)
    );
  }
});

// 2. DEVELOPER DASHBOARD METRICS
router.get('/developer', async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const prjList = await storage.getAllProjects();

    const assigned = prjList.filter(p => 
      !user || (p.assignedDevName && p.assignedDevName.toLowerCase().includes(user.name.toLowerCase())) || user.role === 'SUPER_ADMIN' || user.role === 'ADMIN'
    );

    const activeTasks = assigned.filter(p => p.status === 'CODING' || p.status === 'ASSIGNED' || p.status === 'IN_PROGRESS');
    const pendingReview = assigned.filter(p => p.status === 'REVIEW');
    const completed = assigned.filter(p => p.status === 'DELIVERED' || p.status === 'PAID_100' || p.status === 'COMPLETED');

    const metrics = {
      assignedCount: assigned.length,
      activeTasksCount: activeTasks.length,
      pendingReviewCount: pendingReview.length,
      completedCount: completed.length,
      assignedProjects: assigned,
    };

    return res.json(
      successResponse(metrics, 'Lấy số liệu kỹ thuật thành công.')
    );
  } catch (err: any) {
    return res.status(500).json(
      errorResponse('SERVER_ERROR', err.message)
    );
  }
});

// 3. CS DASHBOARD METRICS
router.get('/cs', async (req: AuthRequest, res: Response) => {
  try {
    const ticketList = await storage.getAllTickets();
    const prjList = await storage.getAllProjects();

    const openTickets = ticketList.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS');
    const urgentTickets = ticketList.filter(t => t.priority === 'HIGH' || t.priority === 'URGENT');

    const metrics = {
      openTicketsCount: openTickets.length,
      urgentTicketsCount: urgentTickets.length,
      totalTicketsCount: ticketList.length,
      activeProjectsCount: prjList.filter(p => p.status !== 'DELIVERED' && p.status !== 'COMPLETED').length,
      tickets: ticketList,
    };

    return res.json(
      successResponse(metrics, 'Lấy số liệu CSKH thành công.')
    );
  } catch (err: any) {
    return res.status(500).json(
      errorResponse('SERVER_ERROR', err.message)
    );
  }
});

// 4. ACCOUNTING DASHBOARD METRICS
router.get('/accounting', async (req: AuthRequest, res: Response) => {
  try {
    const summary = await storage.getFinancialSummary();
    return res.json(
      successResponse(summary, 'Lấy báo cáo tài chính kế toán thành công.')
    );
  } catch (err: any) {
    return res.status(500).json(
      errorResponse('SERVER_ERROR', err.message)
    );
  }
});

// 5. HR DASHBOARD METRICS
router.get('/hr', async (req: AuthRequest, res: Response) => {
  try {
    const userList = await storage.getAllUsers();
    const employees = userList.filter(u => u.role !== 'CLIENT');
    const developers = employees.filter(u => u.role === 'DEVELOPER' || u.role === 'TECH_LEAD');
    const csStaff = employees.filter(u => u.role === 'CS');
    const accountingStaff = employees.filter(u => u.role === 'ACCOUNTING');
    const hrStaff = employees.filter(u => u.role === 'HR');

    const metrics = {
      totalEmployees: employees.length,
      activeEmployees: employees.filter(e => e.status === 'active').length,
      developersCount: developers.length,
      csStaffCount: csStaff.length,
      accountingStaffCount: accountingStaff.length,
      hrStaffCount: hrStaff.length,
      employees,
    };

    return res.json(
      successResponse(metrics, 'Lấy số liệu nhân sự HR thành công.')
    );
  } catch (err: any) {
    return res.status(500).json(
      errorResponse('SERVER_ERROR', err.message)
    );
  }
});

export default router;
