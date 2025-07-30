# ZeroLock - Decentralized Bug Bounty Platform

ZeroLock is a decentralized bug bounty platform built on the Internet Computer Protocol (ICP). This project includes a Rust backend implementation and a modern React frontend application.

## 🏗️ System Architecture

### Backend Architecture - Four Main Canisters

#### 1. BountyFactory Canister
- **Purpose**: Core challenge management
- **Features**:
  - Challenge creation and lifecycle management
  - Target canister deployment
  - Challenge status tracking
  - Admin management
  - Challenge expiration handling

#### 2. Vault Canister
- **Purpose**: Secure fund management
- **Features**:
  - Multi-token support (ICP, ICRC-1 tokens)
  - Fund locking and unlocking
  - Automatic settlement
  - Platform fee handling
  - Emergency pause functionality
  - Multi-signature support (planned)

#### 3. Judge Canister
- **Purpose**: Automated evaluation and settlement
- **Features**:
  - Challenge monitoring
  - Attack attempt validation
  - Automated settlement triggers
  - Dispute management
  - Balance tracking and analysis

#### 4. Leaderboard Canister
- **Purpose**: User statistics and rankings
- **Features**:
  - User profile management
  - Hacker and company leaderboards
  - Achievement system
  - Platform statistics
  - Activity tracking

### Frontend Architecture - Modern Web Application

#### Technology Stack
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Animations**: Framer Motion
- **Routing**: React Router v6
- **UI Components**: Headless UI + Custom Components
- **ICP Integration**: @dfinity SDK
- **Notifications**: React Hot Toast

#### Core Pages and Features

**🏠 Home Page (HomePage)**
- Platform overview and statistics
- Active challenges showcase
- Top hacker leaderboard
- Challenge filtering and search

**🎯 Challenge Detail Page (ChallengeDetailPage)**
- Detailed challenge information
- Smart contract code viewing
- Attack attempt submission
- Real-time participant statistics
- Challenge rules and reward information

**👨‍💻 Hacker Dashboard (HackerDashboard)**
- Personal profile management
- Attack history records
- Achievement and badge system
- Skill tag management
- Social links configuration
- Earnings statistics

**🏢 Company Dashboard (CompanyDashboard)**
- Company profile management
- Challenge creation and management
- Submission review system
- Security settings
- Notification configuration
- Platform analytics

**🔗 Wallet Connector (WalletConnector)**
- Internet Identity integration
- Multi-wallet support
- Connection state management
- Auto-reconnection mechanism

#### UI/UX Features
- **Responsive Design**: Fully optimized for mobile and desktop
- **Dark/Light Theme**: User-switchable theme modes
- **Real-time Notifications**: Toast-based notification system
- **Smooth Animations**: Framer Motion-powered page transitions
- **Accessibility Support**: WCAG compliant
- **Internationalization**: Multi-language support

## 📁 Project Structure

```
src/
├── lib.rs              # Main library entry point
├── types.rs            # Shared type definitions
├── bounty_factory.rs   # BountyFactory canister implementation
├── vault.rs            # Vault canister implementation
├── judge.rs            # Judge canister implementation
└── leaderboard.rs      # Leaderboard canister implementation
```

## Key Features

### Security
- **Fund Safety**: Multi-layered security with time locks and emergency controls
- **Access Control**: Role-based permissions and authorization checks
- **Audit Trail**: Comprehensive transaction and event logging
- **Emergency Controls**: Pause functionality for critical situations

### Multi-Token Support
- **ICP Native**: Full support for Internet Computer Protocol tokens
- **ICRC-1 Standard**: Compatible with ICRC-1 token standard
- **Flexible Payments**: Support for various token types in bounties

### Automated Systems
- **Smart Monitoring**: Automated challenge monitoring and evaluation
- **Auto-Settlement**: Automatic fund distribution upon successful attacks
- **Dispute Resolution**: Built-in dispute management system

## Development Setup

### Prerequisites
- Rust (latest stable version)
- DFX SDK (latest version)
- Internet Computer development environment

### Installation

1. Clone the repository:
```bash
git clone https://github.com/cyberallen/ZeroLock.git
cd zerolock
```

2. Install dependencies:
```bash
cargo build
```

3. Start local IC replica:
```bash
dfx start --background
```

4. Deploy canisters:
```bash
dfx deploy
```

## Usage

### For Companies
1. Register as a company user
2. Create challenges with bounty amounts
3. Deploy target canisters
4. Monitor attack attempts
5. Automatic settlement upon successful attacks

### For Hackers
1. Register as a hacker user
2. Browse available challenges
3. Attempt attacks on target canisters
4. Receive automatic payouts for successful attacks
5. Build reputation and climb leaderboards

## Migration Notes

This Rust implementation maintains full compatibility with the original Motoko version while providing:
- Enhanced performance and memory efficiency
- Better integration with Rust ecosystem
- Improved type safety and error handling
- More robust testing capabilities

All core functionality has been preserved and enhanced during the migration process.