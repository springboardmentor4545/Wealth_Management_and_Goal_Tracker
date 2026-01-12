-- Create ENUM types
CREATE TYPE risk_profile AS ENUM ('conservative', 'moderate', 'aggressive');
CREATE TYPE kyc_status AS ENUM ('unverified', 'verified');
CREATE TYPE goal_type AS ENUM ('retirement', 'home', 'education', 'custom');
CREATE TYPE goal_status AS ENUM ('active', 'paused', 'completed');
CREATE TYPE asset_type AS ENUM ('stock', 'etf', 'mutual_fund', 'bond', 'cash');
CREATE TYPE transaction_type AS ENUM ('buy', 'sell', 'dividend', 'contribution', 'withdrawal');

-- Create Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    risk_profile risk_profile DEFAULT 'moderate',
    kyc_status kyc_status DEFAULT 'unverified',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Goals table
CREATE TABLE goals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    goal_type goal_type NOT NULL,
    target_amount NUMERIC(15,2) NOT NULL,
    target_date DATE NOT NULL,
    monthly_contribution NUMERIC(10,2) NOT NULL,
    status goal_status DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Investments table
CREATE TABLE investments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    asset_type asset_type NOT NULL,
    symbol VARCHAR(50) NOT NULL,
    units NUMERIC(15,6) NOT NULL,
    avg_buy_price NUMERIC(10,2) NOT NULL,
    cost_basis NUMERIC(15,2) NOT NULL,
    current_value NUMERIC(15,2) DEFAULT 0,
    last_price NUMERIC(10,2),
    last_price_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Transactions table
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    symbol VARCHAR(50) NOT NULL,
    type transaction_type NOT NULL,
    quantity NUMERIC(15,6) NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    fees NUMERIC(10,2) DEFAULT 0,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Recommendations table
CREATE TABLE recommendations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    recommendation_text TEXT NOT NULL,
    suggested_allocation JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Simulations table
CREATE TABLE simulations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    goal_id INTEGER REFERENCES goals(id) ON DELETE SET NULL,
    scenario_name VARCHAR(255) NOT NULL,
    assumptions JSONB,
    results JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);pip install pydantic==1.10.13