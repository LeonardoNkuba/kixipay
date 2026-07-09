# Modelo de Dados

## Entidades Principais

### User
- id
- name
- email
- password
- role

### Group
- id
- name
- description

### Membership
- user_id
- group_id
- role

### Contribution
- amount
- date
- status

### Loan
- amount
- interest
- status

### Transaction
- type
- amount
- date

## Relacoes
- User N:N Group via Membership
- Group 1:N Contribution
- Group 1:N Loan
- User 1:N Contribution
- User 1:N Loan
- Group 1:N Transaction

## Observacoes
- todas as operacoes financeiras devem gerar transacao
- historico deve ser imutavel no nivel de negocio
- trilha de auditoria deve preservar quem fez, quando fez e em que contexto
