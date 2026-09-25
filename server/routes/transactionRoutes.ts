import { Router, Response } from 'express';
import { storage } from '../../src/db/storage.ts';
import { AuthRequest, requireAuth, requireRoles } from '../middleware/auth.ts';
import { createTransactionSchema } from '../schemas/validationSchemas.ts';
import { realtime } from '../realtime/socket.ts';
import { fcmService } from '../services/fcmService.ts';
import {
  successResponse,
  errorResponse,
  formatTransactionResponse,
} from '../utils/responseFormatter.ts';

const router = Router();

// 1. GET ALL TRANSACTIONS (Filtered by client role if applicable)
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    let data = await storage.getAllTransactions();

    if (user && user.role.toUpperCase() === 'CLIENT') {
      data = data.filter(t => 
        (t.senderName && t.senderName.toLowerCase().includes(user.name.toLowerCase())) ||
        (t.createdBy && t.createdBy.toLowerCase() === user.name.toLowerCase())
      );
    }

    const formatted = data.map(formatTransactionResponse);

    return res.json(
      successResponse(formatted, 'Lấy danh sách giao dịch thành công.')
    );
  } catch (err: any) {
    console.error('Error fetching transactions:', err);
    return res.status(500).json(
      errorResponse('SERVER_ERROR', err.message || 'Không thể tải danh sách giao dịch.')
    );
  }
});

// 2. GET FINANCIAL SUMMARY
router.get('/summary', async (req: AuthRequest, res: Response) => {
  try {
    const summary = await storage.getFinancialSummary();
    return res.json(
      successResponse(summary, 'Tổng hợp báo cáo tài chính thành công.')
    );
  } catch (err: any) {
    return res.status(500).json(
      errorResponse('SERVER_ERROR', err.message)
    );
  }
});

// 3. CREATE TRANSACTION
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const parseResult = createTransactionSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json(
        errorResponse('VALIDATION_ERROR', parseResult.error.issues[0]?.message || 'Dữ liệu giao dịch không hợp lệ.')
      );
    }

    const body = parseResult.data;
    const user = req.user;
    const isAccountingOrAdmin = user && ['ACCOUNTING', 'ADMIN', 'SUPER_ADMIN'].includes(user.role.toUpperCase());

    const amount = body.amountVnd || body.amount || 0;
    if (amount <= 0) {
      return res.status(400).json(
        errorResponse('INVALID_AMOUNT', 'Số tiền giao dịch phải lớn hơn 0 VNĐ.')
      );
    }

    const initialStatus = isAccountingOrAdmin ? (body.status || 'completed') : 'pending';
    const txCode = `TX-${Math.floor(100000 + Math.random() * 900000)}`;
    const txType = (body.type || body.txType || body.transactionType || 'PROJECT_DEPOSIT').toUpperCase();
    const noteVal = body.note || body.description || '';

    const newTx = await storage.createTransaction({
      transactionCode: txCode,
      projectId: body.projectId || '',
      projectName: body.projectName || (body.projectId ? `Dự án [${body.projectId}]` : 'Thanh toán dịch vụ LUBPY'),
      type: txType,
      amountVnd: amount,
      senderName: body.senderName || user?.name || 'Khách Hàng',
      receiverName: body.receiverName || 'LUBPY Studio',
      status: initialStatus,
      note: noteVal,
      createdBy: user?.name || body.senderName || 'Hệ thống',
      confirmedBy: initialStatus === 'completed' ? (user?.name || 'Kế Toán LUBPY') : undefined,
    });

    // Update project financials if transaction is confirmed
    if (body.projectId && initialStatus === 'completed') {
      const prj = await storage.getProjectById(body.projectId);
      if (prj) {
        const currentDeposit = Number(prj.depositAmount) || 0;
        const newDeposit = currentDeposit + amount;
        const newRemaining = Math.max(0, (Number(prj.priceVnd) || 0) - newDeposit);
        const newStatus = newRemaining === 0 ? 'PAID_100' : 'DEPOSIT_50';

        await storage.updateProject(body.projectId, {
          depositAmount: newDeposit,
          remainingAmount: newRemaining,
          status: newStatus,
        });
      }
    }

    await storage.createNotification({
      type: 'PAYMENT',
      title: `Giao dịch mới [${txCode}]`,
      content: `Ghi nhận giao dịch ${amount.toLocaleString('vi-VN')} VNĐ cho ${body.projectName || body.projectId || 'hệ thống'}.`,
      targetDept: 'ACCOUNTING',
    });

    await storage.createAuditLog({
      action: 'CREATE_TRANSACTION',
      entityType: 'TRANSACTION',
      entityId: txCode,
      userId: user?.uid || 'guest_client',
      userName: user?.name || body.senderName || 'Khách Hàng',
      userRole: user?.role || 'CLIENT',
      details: `Tạo giao dịch ${txCode}: ${amount.toLocaleString('vi-VN')} VNĐ (${txType})`,
      ipAddress: req.ip,
    });

    const formatted = formatTransactionResponse(newTx);

    realtime.emitTransactionUpdate(newTx);
    fcmService.notifyTransaction(undefined, amount, txType, noteVal).catch(() => {});

    return res.status(201).json(
      successResponse(formatted, 'Tạo giao dịch thành công.')
    );
  } catch (err: any) {
    console.error('Error creating transaction:', err);
    return res.status(500).json(
      errorResponse('SERVER_ERROR', err.message || 'Không thể tạo giao dịch.')
    );
  }
});

// 4. CONFIRM TRANSACTION (Accounting / Admin only)
router.put('/:id/confirm', requireAuth, requireRoles('ACCOUNTING', 'ADMIN', 'SUPER_ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const txId = parseInt(id, 10);
    const user = req.user!;

    const tx = await storage.findTransactionById(txId);
    if (!tx) {
      return res.status(404).json(
        errorResponse('TRANSACTION_NOT_FOUND', 'Không tìm thấy giao dịch.')
      );
    }

    // IDEMPOTENCY CHECK: If already confirmed/completed, return existing state without duplicate deposit calculation
    if (tx.status && tx.status.toLowerCase() === 'completed') {
      const formatted = formatTransactionResponse(tx);
      return res.json(
        successResponse(formatted, 'Giao dịch này đã được xác nhận hoàn tất trước đó (Idempotent).')
      );
    }

    const updated = await storage.confirmTransaction(txId, user.name);

    if (tx.projectId) {
      const prj = await storage.getProjectById(tx.projectId);
      if (prj) {
        const currentDeposit = Number(prj.depositAmount) || 0;
        const txAmount = Number(tx.amountVnd) || 0;
        const newDeposit = currentDeposit + txAmount;
        const newRemaining = Math.max(0, (Number(prj.priceVnd) || 0) - newDeposit);
        const newStatus = newRemaining === 0 ? 'PAID_100' : 'DEPOSIT_50';

        await storage.updateProject(tx.projectId, {
          depositAmount: newDeposit,
          remainingAmount: newRemaining,
          status: newStatus,
        });
      }
    }

    await storage.createAuditLog({
      action: 'CONFIRM_TRANSACTION',
      entityType: 'TRANSACTION',
      entityId: tx.transactionCode || String(txId),
      userId: user.uid,
      userName: user.name,
      userRole: user.role,
      details: `Kế toán ${user.name} đã duyệt và xác nhận thanh toán giao dịch ${tx.transactionCode || txId}`,
      ipAddress: req.ip,
    });

    const formatted = formatTransactionResponse(updated || { ...tx, status: 'completed' });

    realtime.emitTransactionUpdate(updated || tx);
    fcmService.notifyTransaction(undefined, Number(tx.amountVnd), tx.type, 'Đã xác nhận thanh toán').catch(() => {});

    return res.json(
      successResponse(formatted, 'Xác nhận giao dịch thành công.')
    );
  } catch (err: any) {
    return res.status(500).json(
      errorResponse('SERVER_ERROR', err.message)
    );
  }
});

export default router;
