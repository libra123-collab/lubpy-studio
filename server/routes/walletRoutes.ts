import { Router, Response } from 'express';
import { storage } from '../../src/db/storage.ts';
import { AuthRequest } from '../middleware/auth.ts';
import { walletDepositSchema } from '../schemas/validationSchemas.ts';
import { realtime } from '../realtime/socket.ts';
import { fcmService } from '../services/fcmService.ts';
import { successResponse, errorResponse, formatTransactionResponse } from '../utils/responseFormatter.ts';

const router = Router();

/**
 * 1. POST /api/v1/wallet/deposit
 * Process Mobile & Web Wallet / Project Deposit
 */
router.post('/deposit', async (req: AuthRequest, res: Response) => {
  try {
    const parseResult = walletDepositSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json(
        errorResponse('VALIDATION_ERROR', parseResult.error.issues[0]?.message || 'Thông tin nạp tiền không hợp lệ.')
      );
    }

    const { amount, amountVnd, projectId, projectName, note, senderName, paymentMethod, method } = parseResult.data;
    const finalAmount = amountVnd || amount;

    if (!finalAmount || finalAmount <= 0) {
      return res.status(400).json(
        errorResponse('INVALID_AMOUNT', 'Số tiền nạp phải lớn hơn 0 VNĐ.')
      );
    }

    const user = req.user;
    const txCode = `TX-W-${Math.floor(100000 + Math.random() * 900000)}`;
    const effectiveSender = senderName || user?.name || 'Khách Hàng Nạp Tiền';
    const effectiveProjectName = projectName || (projectId ? `Dự án [${projectId}]` : 'Nạp Ví LUBPY');
    const selectedMethod = paymentMethod || method || 'VIETQR';
    const combinedNote = note ? `${note} (PTTT: ${selectedMethod})` : `Nạp tiền qua ${selectedMethod}`;

    const isAccountingOrAdmin = user && ['ACCOUNTING', 'ADMIN', 'SUPER_ADMIN'].includes(user.role.toUpperCase());
    const initialStatus = isAccountingOrAdmin ? 'completed' : 'pending';

    const newTx = await storage.createTransaction({
      transactionCode: txCode,
      projectId: projectId || '',
      projectName: effectiveProjectName,
      type: 'PROJECT_DEPOSIT',
      amountVnd: finalAmount,
      senderName: effectiveSender,
      receiverName: 'LUBPY Studio',
      status: initialStatus,
      note: combinedNote,
      createdBy: user?.name || effectiveSender,
      confirmedBy: initialStatus === 'completed' ? (user?.name || 'Kế Toán LUBPY') : undefined,
    });

    // If already confirmed and linked to a project, update project figures
    if (projectId && initialStatus === 'completed') {
      const prj = await storage.getProjectById(projectId);
      if (prj) {
        const totalPrice = Number(prj.priceVnd) || 0;
        const newDeposit = (Number(prj.depositAmount) || 0) + finalAmount;
        const newRemaining = Math.max(0, totalPrice - newDeposit);
        await storage.updateProject(projectId, {
          depositAmount: newDeposit,
          remainingAmount: newRemaining,
          status: 'DEPOSIT_50',
        });
      }
    }

    // Trigger Notification & Audit log
    await storage.createNotification({
      type: 'PAYMENT',
      title: `Yêu cầu nạp tiền [${txCode}]`,
      content: `${effectiveSender} vừa tạo yêu cầu nạp ${finalAmount.toLocaleString('vi-VN')} VNĐ qua ${selectedMethod}.`,
      targetDept: 'ACCOUNTING',
    });

    await storage.createAuditLog({
      action: 'WALLET_DEPOSIT',
      entityType: 'TRANSACTION',
      entityId: txCode,
      userId: user?.uid || 'guest_client',
      userName: user?.name || effectiveSender,
      userRole: user?.role || 'CLIENT',
      details: `Khởi tạo yêu cầu nạp tiền ví ${txCode}: ${finalAmount.toLocaleString('vi-VN')} VNĐ`,
      ipAddress: req.ip,
    });

    const formatted = formatTransactionResponse(newTx);

    realtime.emitTransactionUpdate(newTx);
    fcmService.notifyTransaction(undefined, finalAmount, 'PROJECT_DEPOSIT', combinedNote).catch(() => {});

    return res.status(201).json(
      successResponse(formatted, 'Khởi tạo yêu cầu nạp tiền thành công. Vui lòng chuyển khoản theo thông tin VietQR.')
    );
  } catch (err: any) {
    console.error('Error processing wallet deposit:', err);
    return res.status(500).json(
      errorResponse('SERVER_ERROR', err.message || 'Không thể xử lý yêu cầu nạp tiền.')
    );
  }
});

/**
 * 2. GET /api/v1/wallet/transactions or GET /api/v1/wallet
 */
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
      successResponse(formatted, 'Lấy danh sách giao dịch ví thành công.')
    );
  } catch (err: any) {
    return res.status(500).json(
      errorResponse('SERVER_ERROR', err.message || 'Không thể tải thông tin ví.')
    );
  }
});

export default router;
