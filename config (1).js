// Deep Research Agent Configuration
const CONFIG = {
  // Vertesia API Configuration
  VERTESIA_API_BASE: 'https://api.vertesia.io/api/v1',
  VERTESIA_API_KEY: 'sk-2538a58567e4ebb6654c0a17ceab228c',
  ENVIRONMENT_ID: '681915c6a01fb262a410c161',
  MODEL: 'publishers/anthropic/models/claude-3-7-sonnet',
  
  // Research Agent Configuration
  INTERACTION_NAME: 'ResearchV2',
  
  // Research Capabilities
  RESEARCH_CAPABILITIES: {
    "Traditional Analysis": [
      "General Analysis",
      "Margin & Return Metrics",
      "Debt & Liquidity Assessment",
      "Porter's Five Forces",
      "SWOT Analysis",
      "DCF Valuation",
      "TAM/SAM/SOM Analysis",
      "Competitive Benchmarking"
    ],
    
    "Advanced Research - Ecosystem": [
      "Ecosystem Mapping",
      "Supply Chain Contagion Modeling",
      "Capital Flow Mapping"
    ],
    
    "Advanced Research - Narrative": [
      "Narrative Momentum Analysis",
      "Competitive Response Patterns",
      "Management Quality Assessment"
    ],
    
    "Advanced Research - Comparative": [
      "Multistock Time Series Analysis",
      "Cross-Sector Value Migration",
      "Technology Adoption Curves"
    ],
    
    "Advanced Research - Scenario": [
      "Risk Correlation Study",
      "Downside Scenario Modeling",
      "Market Entry Strategy Analysis"
    ],
    
    "Advanced Research - Intelligence": [
      "Talent Landscape Mapping",
      "Alliance & Partnership History",
      "Industry Trend Analysis"
    ],
    
    "Custom Research": [
      "Custom Framework"
    ]
  },
  
  // Context Hints for Each Framework
  CONTEXT_HINTS: {
    // Traditional Analysis
    "General Analysis": "Enter company or topic for comprehensive analysis (e.g., NVIDIA, semiconductor industry)",
    "Margin & Return Metrics": "Enter company for profitability analysis (e.g., NVIDIA margins, Microsoft ROIC, Apple ROE)",
    "Debt & Liquidity Assessment": "Enter company for balance sheet health (e.g., AT&T debt load, Tesla liquidity, Boeing solvency)",
    "Porter's Five Forces": "Enter company/industry (e.g., Tesla in EV market, Netflix in streaming)",
    "SWOT Analysis": "Enter company for strengths, weaknesses, opportunities, threats (e.g., Apple, Microsoft)",
    "DCF Valuation": "Enter company for discounted cash flow valuation (e.g., NVDA, GOOGL, TSLA)",
    "TAM/SAM/SOM Analysis": "Enter market for addressable market sizing (e.g., AI chips, electric vehicles, cloud gaming)",
    "Competitive Benchmarking": "Enter companies for peer comparison (e.g., NVDA vs AMD vs INTC)",
    
    // Advanced Research - Ecosystem
    "Ecosystem Mapping": "Enter company to map suppliers, partners, competitors, dependencies (e.g., Apple, Tesla)",
    "Supply Chain Contagion Modeling": "Describe disruption scenario (e.g., Taiwan semiconductor shutdown, China rare earth embargo)",
    "Capital Flow Mapping": "Enter entities to track investment flows (e.g., SoftBank portfolio, Sequoia investments)",
    
    // Advanced Research - Narrative
    "Narrative Momentum Analysis": "Enter narrative theme and companies (e.g., AI leader narrative: NVDA, GOOGL, MSFT, META)",
    "Competitive Response Patterns": "Enter companies for historical competitive behavior (e.g., Amazon vs Walmart over 10 years)",
    "Management Quality Assessment": "Enter company to evaluate leadership effectiveness (e.g., Microsoft under Nadella, Apple post-Jobs)",
    
    // Advanced Research - Comparative
    "Multistock Time Series Analysis": "Enter 2-3 stocks with timeframe (e.g., NVDA, AMD, INTC from 2020-2025)",
    "Cross-Sector Value Migration": "Enter sectors to track value shifts (e.g., automotive to software to AI)",
    "Technology Adoption Curves": "Enter technology and sectors (e.g., AI adoption: healthcare vs finance vs manufacturing)",
    
    // Advanced Research - Scenario
    "Risk Correlation Study": "Enter companies to map interconnected risks (e.g., oil prices impact on airlines, shipping, retail)",
    "Downside Scenario Modeling": "Enter company and risk scenario (e.g., Intel loses 30% market share to ARM)",
    "Market Entry Strategy Analysis": "Enter company and new market (e.g., Walmart enters India, Tesla expansion in Europe)",
    
    // Advanced Research - Intelligence
    "Talent Landscape Mapping": "Enter industry for workforce analysis (e.g., semiconductor engineers, AI researchers, biotech scientists)",
    "Alliance & Partnership History": "Enter company to map past partnerships and predict future alliances (e.g., Microsoft, Starbucks)",
    "Industry Trend Analysis": "Enter industry and timeframe (e.g., renewable energy 2020-2030, semiconductor cycles)",
    
    // Custom Research
    "Custom Framework": "Describe your research question or analytical approach in detail. Be as specific as possible."
  },
  
  // Framework Auto-Defaults for Modifiers
  FRAMEWORK_DEFAULTS: {
    "DCF Valuation": { 
      scope: "Assets", 
      depth: "Comprehensive", 
      rigor: "Exhaustive Research", 
      perspective: "Investment" 
    },
    "General Analysis": { 
      scope: "Assets", 
      depth: "Comprehensive", 
      rigor: "Detailed Analysis", 
      perspective: "Investment" 
    },
    "TAM/SAM/SOM Analysis": { 
      scope: "Market", 
      depth: "Focused", 
      rigor: "Detailed Analysis", 
      perspective: "Investment" 
    },
    "Supply Chain Contagion Modeling": { 
      scope: "Market", 
      depth: "Comprehensive", 
      rigor: "Exhaustive Research", 
      perspective: "Technical" 
    },
    "Multistock Time Series Analysis": { 
      scope: "Assets", 
      depth: "Comprehensive", 
      rigor: "Detailed Analysis", 
      perspective: "Investment" 
    },
    "Cross-Sector Value Migration": { 
      scope: "Sector", 
      depth: "Comprehensive", 
      rigor: "Detailed Analysis", 
      perspective: "Educational" 
    }
  },
  
  // Research Generation Settings
  GENERATION: {
    ESTIMATED_TIME_MINUTES: 5,
    POLLING_INTERVAL_MS: 15000,
    POLLING_START_DELAY_MS: 5 * 60 * 1000,
    MAX_POLLING_ATTEMPTS: 20
  },
  
  // Document Settings
  DOCUMENTS: {
    PREFIX: 'DeepResearch_',
    BATCH_SIZE: 100
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
