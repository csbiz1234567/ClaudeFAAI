import React, { useState, useMemo, useEffect } from 'react';
import { toNum, parseDob, monthsSinceDob } from './utils/helpers.js';
import { computeCpf } from './utils/cpf.js';
import { computeRetirementProjection } from './utils/retirement.js';
import TabButton from './components/TabButton.js';
import TabPanel from './components/TabPanel.js';
import DisclaimerTab from './tabs/DisclaimerTab.js';
import ProfileTab from './tabs/ProfileTab.js';
import ChildrenTab from './tabs/ChildrenTab.js';
import CpfTab from './tabs/CpfTab.js';
import CashflowTab from './tabs/CashflowTab.js';
import RetirementTab from './tabs/RetirementTab.js';
import InvestorTab from './tabs/InvestorTab.js';
import WealthToolTab from './tabs/WealthToolTab.js';
import CrmTab from './tabs/CrmTab.js';

export default function SingaporeFAApp() {
  // State Management
  const [activeTab, setActiveTab] = useState('disclaimer');
  const [clients, setClients] = useState(() => {
    const saved = localStorage.getItem('fa_clients');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedClientId, setSelectedClientId] = useState(null);

  // Profile State
  const [profile, setProfile] = useState({
    name: '',
    dob: '',
    gender: 'male',
    employmentStatus: 'employed',
    email: '',
    phone: '',
    monthlyIncome: '',
    grossSalary: '',
    takeHome: '',
    retirementAge: '65',
    customRetirementExpense: '',
    referenceYear: new Date().getFullYear(),
    referenceMonth: new Date().getMonth(),
    children: []
  });

  // Cashflow State
  const [expenses, setExpenses] = useState({
    housing: '',
    food: '',
    transport: '',
    insurance: '',
    entertainment: '',
    others: ''
  });

  // Custom Expenses State
  const [customExpenses, setCustomExpenses] = useState([]);

  // Retirement State
  const [retirement, setRetirement] = useState({
    initialSavings: '',
    scenario: 'moderate',
    investmentPercent: '100' // Default 100% of savings goes to retirement investment
  });

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('fa_clients', JSON.stringify(clients));
  }, [clients]);

  // Computed Values
  const age = useMemo(() => {
    const dob = parseDob(profile.dob);
    if (!dob) return 0;
    const months = monthsSinceDob(dob, profile.referenceYear, profile.referenceMonth);
    return Math.floor(months / 12);
  }, [profile.dob, profile.referenceYear, profile.referenceMonth]);

  const cpfData = useMemo(() => {
    const income = toNum(profile.grossSalary || profile.monthlyIncome);
    if (income === 0 || age === 0) return null;
    return computeCpf(income, age);
  }, [profile.grossSalary, profile.monthlyIncome, age]);

  const cashflowData = useMemo(() => {
    if (!cpfData && !profile.takeHome) return null;
    const takeHome = toNum(profile.takeHome) || (cpfData ? cpfData.takeHome : 0);

    // Calculate total expenses including custom expenses
    let totalExpenses = Object.values(expenses).reduce((sum, val) => sum + toNum(val), 0);
    if (customExpenses) {
      customExpenses.forEach(exp => {
        totalExpenses += toNum(exp.amount, 0);
      });
    }

    const monthlySavings = takeHome - totalExpenses;
    const annualSavings = monthlySavings * 12;

    return {
      takeHome,
      totalExpenses,
      monthlySavings,
      annualSavings,
      savingsRate: takeHome > 0 ? (monthlySavings / takeHome * 100) : 0
    };
  }, [cpfData, profile.takeHome, expenses, customExpenses]);

  const retirementProjection = useMemo(() => {
    if (!cashflowData) return null;

    const scenarios = {
      conservative: 0.025,
      moderate: 0.05,
      aggressive: 0.08
    };

    const rate = scenarios[retirement.scenario];
    const initial = toNum(retirement.initialSavings);

    // Apply investment percentage to monthly savings
    const investmentPercent = toNum(retirement.investmentPercent, 100);
    const monthly = cashflowData.monthlySavings * (investmentPercent / 100);

    const years = Math.max(0, toNum(profile.retirementAge) - age);

    if (years <= 0) return null;

    return computeRetirementProjection(initial, monthly, rate, years);
  }, [cashflowData, retirement, profile.retirementAge, age]);

  // CRM Functions
  const saveClient = () => {
    const clientData = {
      id: selectedClientId || Date.now().toString(),
      profile,
      expenses,
      customExpenses,
      retirement,
      lastUpdated: new Date().toISOString(),
      followUp: {
        nextDate: null,
        status: 'none'
      }
    };

    if (selectedClientId) {
      setClients(clients.map(c => c.id === selectedClientId ? clientData : c));
    } else {
      setClients([...clients, clientData]);
    }

    alert('Client saved successfully!');
  };

  const loadClient = (client) => {
    setSelectedClientId(client.id);
    setProfile({
      ...client.profile,
      children: client.profile.children || []
    });
    setExpenses(client.expenses);
    setCustomExpenses(client.customExpenses || []);
    setRetirement(client.retirement);
    setActiveTab('profile');
  };

  const deleteClient = (clientId) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      setClients(clients.filter(c => c.id !== clientId));
      if (selectedClientId === clientId) {
        setSelectedClientId(null);
      }
    }
  };

  const newClient = () => {
    setSelectedClientId(null);
    setProfile({
      name: '',
      dob: '',
      gender: 'male',
      employmentStatus: 'employed',
      email: '',
      phone: '',
      monthlyIncome: '',
      grossSalary: '',
      takeHome: '',
      retirementAge: '65',
      customRetirementExpense: '',
      referenceYear: new Date().getFullYear(),
      referenceMonth: new Date().getMonth(),
      children: []
    });
    setExpenses({
      housing: '',
      food: '',
      transport: '',
      insurance: '',
      entertainment: '',
      others: ''
    });
    setCustomExpenses([]);
    setRetirement({
      initialSavings: '',
      scenario: 'moderate',
      investmentPercent: '100'
    });
    setActiveTab('profile');
  };

  const setFollowUp = (clientId, days) => {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + days);

    setClients(clients.map(c => 
      c.id === clientId 
        ? { ...c, followUp: { nextDate: nextDate.toISOString(), status: 'pending' } }
        : c
    ));
  };

  const completeFollowUp = (clientId) => {
    setClients(clients.map(c =>
      c.id === clientId
        ? { ...c, followUp: { ...c.followUp, status: 'completed' } }
        : c
    ));
  };

  // Tab Configuration
  const tabs = [
    { id: 'disclaimer', label: 'Disclaimer', icon: '⚠️' },
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'children', label: 'Children', icon: '👶' },
    { id: 'cpf', label: 'CPF', icon: '💰' },
    { id: 'cashflow', label: 'Cashflow', icon: '📊' },
    { id: 'retirement', label: 'Retirement', icon: '🏖️' },
    { id: 'investor', label: 'Investor', icon: '📈' },
    { id: 'wealth', label: 'Wealth Tool', icon: '💎' },
    { id: 'crm', label: 'CRM', icon: '📋' }
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '16px 24px' }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1F2937', marginBottom: 4 }}>Singapore Financial Advisory App</h1>
          <p style={{ fontSize: 13, color: '#6B7280' }}>Enterprise-grade modular financial planning system</p>
        </div>

        {/* Tabs */}
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', gap: 4, overflowX: 'auto' }}>
            {tabs.map(tab => (
              <TabButton
                key={tab.id}
                active={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
              >
                <span style={{ marginRight: 8 }}>{tab.icon}</span>
                {tab.label}
              </TabButton>
            ))}
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <TabPanel active={activeTab === 'disclaimer'}>
          <DisclaimerTab />
        </TabPanel>
        <TabPanel active={activeTab === 'profile'}>
          <ProfileTab 
            profile={profile} 
            setProfile={setProfile} 
            age={age} 
            cpfData={cpfData}
            expenses={expenses}
            setExpenses={setExpenses}
            customExpenses={customExpenses}
            setCustomExpenses={setCustomExpenses}
            cashflowData={cashflowData}
          />
        </TabPanel>
        <TabPanel active={activeTab === 'children'}>
          <ChildrenTab 
            children={profile.children || []} 
            setChildren={(children) => setProfile({ ...profile, children })} 
            ageYears={age} 
          />
        </TabPanel>
        <TabPanel active={activeTab === 'cpf'}>
          <CpfTab 
            cpfData={cpfData} 
            age={age} 
          />
        </TabPanel>
        <TabPanel active={activeTab === 'cashflow'}>
          <CashflowTab 
            cpfData={cpfData} 
            expenses={expenses} 
            setExpenses={setExpenses} 
            cashflowData={cashflowData}
            profile={profile}
            customExpenses={customExpenses}
            setCustomExpenses={setCustomExpenses}
          />
        </TabPanel>
        <TabPanel active={activeTab === 'retirement'}>
          <RetirementTab 
            cashflowData={cashflowData} 
            retirement={retirement} 
            setRetirement={setRetirement} 
            retirementProjection={retirementProjection} 
            profile={profile} 
            age={age} 
          />
        </TabPanel>
        <TabPanel active={activeTab === 'investor'}>
          <InvestorTab />
        </TabPanel>
        <TabPanel active={activeTab === 'wealth'}>
          <WealthToolTab />
        </TabPanel>
        <TabPanel active={activeTab === 'crm'}>
          <CrmTab 
            clients={clients} 
            profile={profile} 
            selectedClientId={selectedClientId} 
            newClient={newClient} 
            saveClient={saveClient} 
            loadClient={loadClient} 
            deleteClient={deleteClient} 
            setFollowUp={setFollowUp} 
            completeFollowUp={completeFollowUp} 
          />
        </TabPanel>
      </div>
      
      {/* Footer */}
      <div style={{ background: '#fff', borderTop: '1px solid #E5E7EB', marginTop: 48 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: '#6B7280' }}>
            Singapore FA App v1.0 | Modular Architecture | Ready for Supabase Integration
          </p>
        </div>
      </div>
    </div>
  );
}
