import { LoanStatus, MembershipRole, TransactionType } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { ApiError, asyncHandler } from "../../lib/http.js";
import { prisma } from "../../lib/prisma.js";
const createLoanSchema = z.object({
    groupId: z.string().uuid(),
    amount: z.coerce.number().positive(),
    interestRate: z.coerce.number().min(0),
    reason: z.string().optional(),
    dueDate: z.coerce.date(),
});
const approveLoanSchema = z.object({
    approved: z.boolean().default(true),
});
const addPaymentSchema = z.object({
    amount: z.coerce.number().positive(),
    paidAt: z.coerce.date().default(new Date()),
});
const groupParamsSchema = z.object({
    groupId: z.string().uuid(),
});
const loanParamsSchema = z.object({
    loanId: z.string().uuid(),
});
const canApprove = (role) => {
    return role === MembershipRole.ADMIN || role === MembershipRole.TREASURER;
};
export const loansRouter = Router();
loansRouter.get("/group/:groupId", asyncHandler(async (req, res) => {
    const { groupId } = groupParamsSchema.parse(req.params);
    const loans = await prisma.loan.findMany({
        where: { groupId },
        include: { borrower: true, approver: true, payments: true },
        orderBy: { createdAt: "desc" },
    });
    res.json(loans);
}));
loansRouter.post("/", asyncHandler(async (req, res) => {
    const payload = createLoanSchema.parse(req.body);
    const member = await prisma.membership.findUnique({
        where: {
            userId_groupId: {
                userId: req.user.id,
                groupId: payload.groupId,
            },
        },
    });
    if (!member?.isActive) {
        throw new ApiError(403, "Sem permissao para solicitar emprestimo neste grupo.");
    }
    const loan = await prisma.loan.create({
        data: {
            groupId: payload.groupId,
            userId: req.user.id,
            amount: payload.amount,
            interestRate: payload.interestRate,
            reason: payload.reason,
            dueDate: payload.dueDate,
        },
    });
    await prisma.auditLog.create({
        data: {
            userId: req.user.id,
            groupId: payload.groupId,
            action: "LOAN_REQUESTED",
            entity: "Loan",
            entityId: loan.id,
            newValue: loan,
        },
    });
    res.status(201).json(loan);
}));
loansRouter.post("/:loanId/approve", asyncHandler(async (req, res) => {
    const { loanId } = loanParamsSchema.parse(req.params);
    const payload = approveLoanSchema.parse(req.body);
    const loan = await prisma.loan.findUnique({ where: { id: loanId } });
    if (!loan) {
        throw new ApiError(404, "Emprestimo nao encontrado.");
    }
    const member = await prisma.membership.findUnique({
        where: {
            userId_groupId: {
                userId: req.user.id,
                groupId: loan.groupId,
            },
        },
    });
    if (!member || !canApprove(member.role)) {
        throw new ApiError(403, "Sem permissao para aprovar emprestimo.");
    }
    const status = payload.approved ? LoanStatus.APPROVED : LoanStatus.REJECTED;
    const updated = await prisma.$transaction(async (tx) => {
        const result = await tx.loan.update({
            where: { id: loanId },
            data: {
                status,
                approvedBy: req.user.id,
                approvedAt: new Date(),
            },
        });
        if (payload.approved) {
            await tx.transaction.create({
                data: {
                    groupId: loan.groupId,
                    userId: loan.userId,
                    type: TransactionType.LOAN,
                    amount: loan.amount,
                    description: "Emprestimo aprovado",
                },
            });
        }
        await tx.auditLog.create({
            data: {
                userId: req.user.id,
                groupId: loan.groupId,
                action: payload.approved ? "LOAN_APPROVED" : "LOAN_REJECTED",
                entity: "Loan",
                entityId: loanId,
                oldValue: loan,
                newValue: result,
            },
        });
        return result;
    });
    res.json(updated);
}));
loansRouter.post("/:loanId/payments", asyncHandler(async (req, res) => {
    const { loanId } = loanParamsSchema.parse(req.params);
    const payload = addPaymentSchema.parse(req.body);
    const loan = await prisma.loan.findUnique({
        where: { id: loanId },
        include: { payments: true },
    });
    if (!loan) {
        throw new ApiError(404, "Emprestimo nao encontrado.");
    }
    const totalPaid = loan.payments.reduce((acc, payment) => {
        return acc + Number(payment.amount);
    }, 0);
    const totalDue = Number(loan.amount) * (1 + Number(loan.interestRate) / 100);
    const newTotalPaid = totalPaid + payload.amount;
    const payment = await prisma.$transaction(async (tx) => {
        const createdPayment = await tx.loanPayment.create({
            data: {
                loanId: loan.id,
                amount: payload.amount,
                paidAt: payload.paidAt,
            },
        });
        await tx.transaction.create({
            data: {
                groupId: loan.groupId,
                userId: loan.userId,
                type: TransactionType.LOAN_PAYMENT,
                amount: payload.amount,
                description: "Pagamento de emprestimo",
            },
        });
        if (newTotalPaid >= totalDue) {
            await tx.loan.update({
                where: { id: loan.id },
                data: { status: LoanStatus.PAID },
            });
        }
        await tx.auditLog.create({
            data: {
                userId: req.user.id,
                groupId: loan.groupId,
                action: "LOAN_PAYMENT_CREATED",
                entity: "LoanPayment",
                entityId: createdPayment.id,
                newValue: createdPayment,
            },
        });
        return createdPayment;
    });
    res.status(201).json(payment);
}));
