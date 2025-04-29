\-- Create the finance schema  
CREATE SCHEMA finance;

\-- Set search path  
SET search\_path TO finance, extensions, public;

\-- Create custom ENUM types  
CREATE TYPE finance.account\_type AS ENUM ('Checking', 'Savings', 'Investment', 'Retirement', 'Credit Card', 'Loan', 'Other');  
CREATE TYPE finance.transaction\_type AS ENUM ('Debit', 'Credit');  
CREATE TYPE finance.category\_type AS ENUM ('Income', 'Expense', 'Transfer');  
CREATE TYPE finance.investment\_type AS ENUM ('Stock', 'Bond', 'Mutual Fund', 'ETF', 'Real Estate', 'Cryptocurrency', 'Other');  
CREATE TYPE finance.asset\_type AS ENUM ('Real Estate', 'Vehicle', 'Collectibles', 'Other');  
CREATE TYPE finance.liability\_type AS ENUM ('Mortgage', 'Auto Loan', 'Student Loan', 'Credit Card', 'Personal Loan', 'Other');  
CREATE TYPE finance.goal\_type AS ENUM ('Retirement', 'Home Purchase', 'Education', 'Travel', 'Emergency Fund', 'Other');  
CREATE TYPE finance.assumption\_type AS ENUM ('Inflation Rate', 'Investment Return', 'Tax Rate', 'Salary Growth');  
CREATE TYPE finance.policy\_type AS ENUM ('Life', 'Health', 'Auto', 'Homeowners', 'Disability', 'Umbrella', 'Other');  
CREATE TYPE finance.freq\_type AS ENUM ('Weekly', 'BiWeekly', 'Monthly', 'Quarterly', 'Annually');  
CREATE TYPE finance.premium\_freq AS ENUM ('Monthly', 'Quarterly', 'Annually');  
CREATE TYPE finance.sharia\_compliance AS ENUM ('High', 'Medium', 'Low', 'Not Rated');  
CREATE TYPE finance.operation\_type AS ENUM ('Insert', 'Update', 'Delete');

\-- Create Users table  
CREATE TABLE finance."Users" (  
  user\_id UUID PRIMARY KEY,  
  first\_name TEXT,  
  last\_name TEXT,  
  email TEXT UNIQUE,  
  risk\_tolerance INTEGER CHECK (risk\_tolerance BETWEEN 1 AND 10),  
  financial\_goals JSONB,  
  created\_at TIMESTAMPTZ DEFAULT now(),  
  updated\_at TIMESTAMPTZ DEFAULT now()  
);

\-- Create Accounts table  
CREATE TABLE finance."Accounts" (  
  account\_id UUID PRIMARY KEY DEFAULT extensions.uuid\_generate\_v4(),  
  user\_id UUID REFERENCES finance."Users"(user\_id),  
  account\_type finance.account\_type,  
  account\_name TEXT,  
  institution\_name TEXT,  
  balance NUMERIC,  
  interest\_rate NUMERIC,  
  created\_at TIMESTAMPTZ DEFAULT now(),  
  updated\_at TIMESTAMPTZ DEFAULT now()  
);

\-- Create Categories table  
CREATE TABLE finance."Categories" (  
  category\_id UUID PRIMARY KEY DEFAULT extensions.uuid\_generate\_v4(),  
  user\_id UUID REFERENCES finance."Users"(user\_id),  
  category\_name TEXT,  
  category\_type finance.category\_type,  
  is\_default BOOLEAN DEFAULT false,  
  created\_at TIMESTAMPTZ DEFAULT now(),  
  updated\_at TIMESTAMPTZ DEFAULT now()  
);

\-- Create Transactions table  
CREATE TABLE finance."Transactions" (  
  transaction\_id UUID PRIMARY KEY DEFAULT extensions.uuid\_generate\_v4(),  
  account\_id UUID REFERENCES finance."Accounts"(account\_id),  
  transaction\_date DATE,  
  description TEXT,  
  amount NUMERIC,  
  transaction\_type finance.transaction\_type,  
  category\_id UUID REFERENCES finance."Categories"(category\_id),  
  notes TEXT,  
  created\_at TIMESTAMPTZ DEFAULT now(),  
  updated\_at TIMESTAMPTZ DEFAULT now()  
);

\-- Create Budgets table  
CREATE TABLE finance."Budgets" (  
  budget\_id UUID PRIMARY KEY DEFAULT extensions.uuid\_generate\_v4(),  
  user\_id UUID REFERENCES finance."Users"(user\_id),  
  category\_id UUID REFERENCES finance."Categories"(category\_id),  
  budget\_period DATE,  
  budgeted\_amount NUMERIC,  
  created\_at TIMESTAMPTZ DEFAULT now(),  
  updated\_at TIMESTAMPTZ DEFAULT now()  
);

\-- Create Investments table  
CREATE TABLE finance."Investments" (  
  investment\_id UUID PRIMARY KEY DEFAULT extensions.uuid\_generate\_v4(),  
  account\_id UUID REFERENCES finance."Accounts"(account\_id),  
  investment\_name TEXT,  
  investment\_type finance.investment\_type,  
  ticker\_symbol TEXT,  
  quantity NUMERIC,  
  purchase\_date DATE,  
  purchase\_price NUMERIC,  
  created\_at TIMESTAMPTZ DEFAULT now(),  
  updated\_at TIMESTAMPTZ DEFAULT now()  
);

\-- Create Investment\_Prices table  
CREATE TABLE finance."Investment\_Prices" (  
  investment\_price\_id UUID PRIMARY KEY DEFAULT extensions.uuid\_generate\_v4(),  
  investment\_id UUID REFERENCES finance."Investments"(investment\_id),  
  price\_date DATE,  
  price NUMERIC,  
  created\_at TIMESTAMPTZ DEFAULT now(),  
  updated\_at TIMESTAMPTZ DEFAULT now()  
);

\-- Create Assets table  
CREATE TABLE finance."Assets" (  
  asset\_id UUID PRIMARY KEY DEFAULT extensions.uuid\_generate\_v4(),  
  user\_id UUID REFERENCES finance."Users"(user\_id),  
  asset\_type finance.asset\_type,  
  asset\_name TEXT,  
  purchase\_date DATE,  
  purchase\_price NUMERIC,  
  current\_value NUMERIC,  
  created\_at TIMESTAMPTZ DEFAULT now(),  
  updated\_at TIMESTAMPTZ DEFAULT now()  
);

\-- Create Liabilities table  
CREATE TABLE finance."Liabilities" (  
  liability\_id UUID PRIMARY KEY DEFAULT extensions.uuid\_generate\_v4(),  
  user\_id UUID REFERENCES finance."Users"(user\_id),  
  liability\_type finance.liability\_type,  
  liability\_name TEXT,  
  original\_amount NUMERIC,  
  current\_balance NUMERIC,  
  interest\_rate NUMERIC,  
  monthly\_payment NUMERIC,  
  start\_date DATE,  
  end\_date DATE,  
  created\_at TIMESTAMPTZ DEFAULT now(),  
  updated\_at TIMESTAMPTZ DEFAULT now()  
);

\-- Create Goals table  
CREATE TABLE finance."Goals" (  
  goal\_id UUID PRIMARY KEY DEFAULT extensions.uuid\_generate\_v4(),  
  user\_id UUID REFERENCES finance."Users"(user\_id),  
  goal\_name TEXT,  
  goal\_type finance.goal\_type,  
  target\_amount NUMERIC,  
  target\_date DATE,  
  current\_progress NUMERIC DEFAULT 0,  
  priority INTEGER CHECK (priority BETWEEN 1 AND 5),  
  notes TEXT,  
  created\_at TIMESTAMPTZ DEFAULT now(),  
  updated\_at TIMESTAMPTZ DEFAULT now()  
);

\-- Create Assumptions table  
CREATE TABLE finance."Assumptions" (  
  assumption\_id UUID PRIMARY KEY DEFAULT extensions.uuid\_generate\_v4(),  
  user\_id UUID REFERENCES finance."Users"(user\_id),  
  assumption\_name TEXT,  
  assumption\_type finance.assumption\_type,  
  value NUMERIC,  
  start\_date DATE,  
  end\_date DATE,  
  notes TEXT,  
  created\_at TIMESTAMPTZ DEFAULT now(),  
  updated\_at TIMESTAMPTZ DEFAULT now(),  
  UNIQUE(user\_id, assumption\_name)  
);

\-- Create InsurancePolicies table  
CREATE TABLE finance."InsurancePolicies" (  
  policy\_id UUID PRIMARY KEY DEFAULT extensions.uuid\_generate\_v4(),  
  user\_id UUID REFERENCES finance."Users"(user\_id),  
  policy\_type finance.policy\_type,  
  insurance\_company TEXT,  
  policy\_number TEXT,  
  coverage\_amount NUMERIC,  
  premium\_amount NUMERIC,  
  premium\_frequency finance.premium\_freq,  
  start\_date DATE,  
  end\_date DATE,  
  created\_at TIMESTAMPTZ DEFAULT now(),  
  updated\_at TIMESTAMPTZ DEFAULT now()  
);

\-- Create IslamicInvestments table  
CREATE TABLE finance."IslamicInvestments" (  
  investment\_id UUID PRIMARY KEY REFERENCES finance."Investments"(investment\_id),  
  sharia\_compliance\_rating finance.sharia\_compliance,  
  created\_at TIMESTAMPTZ DEFAULT now(),  
  updated\_at TIMESTAMPTZ DEFAULT now()  
);

\-- Create ZakatCalculations table  
CREATE TABLE finance."ZakatCalculations" (  
  zakat\_id UUID PRIMARY KEY DEFAULT extensions.uuid\_generate\_v4(),  
  user\_id UUID REFERENCES finance."Users"(user\_id),  
  calculation\_date DATE,  
  total\_assets NUMERIC,  
  deductible\_liabilities NUMERIC,  
  nisab\_value NUMERIC,  
  zakat\_due NUMERIC,  
  notes TEXT,  
  created\_at TIMESTAMPTZ DEFAULT now(),  
  updated\_at TIMESTAMPTZ DEFAULT now()  
);

\-- Create AuditLog table  
CREATE TABLE finance."AuditLog" (  
  log\_id UUID PRIMARY KEY DEFAULT extensions.uuid\_generate\_v4(),  
  table\_name TEXT,  
  record\_id UUID,  
  user\_id UUID REFERENCES finance."Users"(user\_id),  
  operation\_type finance.operation\_type,  
  old\_values JSONB,  
  new\_values JSONB,  
  timestamp TIMESTAMPTZ DEFAULT now()  
);

\-- Create RecurringTransactions table  
CREATE TABLE finance."RecurringTransactions" (  
  recurring\_transaction\_id UUID PRIMARY KEY DEFAULT extensions.uuid\_generate\_v4(),  
  account\_id UUID REFERENCES finance."Accounts"(account\_id),  
  description TEXT,  
  amount NUMERIC,  
  transaction\_type finance.transaction\_type,  
  category\_id UUID REFERENCES finance."Categories"(category\_id),  
  frequency finance.freq\_type,  
  start\_date DATE,  
  end\_date DATE,  
  next\_occurrence\_date DATE,  
  created\_at TIMESTAMPTZ DEFAULT now(),  
  updated\_at TIMESTAMPTZ DEFAULT now()  
);  
