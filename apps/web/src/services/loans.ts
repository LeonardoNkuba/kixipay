import { apiFetch } from "@/services/api";
import { Loan } from "@/types/domain";

export type CreateLoanInput = {
  groupId: string;
  amount: number;
  interestRate: number;
  reason?: string;
  dueDate: string;
};

export const createLoan = (token: string, input: CreateLoanInput) => {
  return apiFetch<Loan>("/loans", { method: "POST", body: JSON.stringify(input) }, token);
};

export const approveLoan = (token: string, loanId: string, approved: boolean) => {
  return apiFetch<Loan>(
    `/loans/${loanId}/approve`,
    { method: "POST", body: JSON.stringify({ approved }) },
    token,
  );
};

export type LoanPayment = {
  id: string;
  loanId: string;
  amount: number | string;
  paidAt: string;
};

export const addLoanPayment = (
  token: string,
  loanId: string,
  input: { amount: number; paidAt?: string },
) => {
  return apiFetch<LoanPayment>(
    `/loans/${loanId}/payments`,
    { method: "POST", body: JSON.stringify(input) },
    token,
  );
};
