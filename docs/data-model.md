# Modelo de Dados - Versao Final

## Entidades Principais

- User
- Group
- Membership
- Contribution
- Loan
- LoanPayment
- Transaction
- Notification
- Invitation
- AuditLog
- GroupSettings
- TrustScore

## Enums Principais

- MembershipRole: ADMIN, TREASURER, MEMBER
- GroupStatus: ACTIVE, PAUSED, CLOSED
- CycleType: WEEKLY, MONTHLY
- ContributionStatus: PENDING, PAID, LATE
- LoanStatus: PENDING, APPROVED, REJECTED, PAID
- TransactionType: CONTRIBUTION, LOAN, LOAN_PAYMENT, WITHDRAW, DEPOSIT
- NotificationType: INFO, WARNING, SUCCESS, ERROR
- InvitationStatus: PENDING, ACCEPTED, REJECTED, EXPIRED

## Relacoes-Chave

- User N:N Group via Membership
- Group 1:N Contribution
- Group 1:N Loan
- Loan 1:N LoanPayment
- Group 1:N Transaction
- User 1:N Notification
- Group 1:N Invitation
- User 1:N AuditLog
- Group 1:N AuditLog
- Membership 1:1 TrustScore
- Group 1:1 GroupSettings

## Observacoes

- Todas as operacoes financeiras devem gerar Transaction.
- AuditLog existe para rastreabilidade e transparencia.
- TrustScore suporta o indice de confianca sem recalculo pesado em tempo real.
