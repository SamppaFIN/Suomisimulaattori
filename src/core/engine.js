/**
 * SuomiSimulaattori 2.0 - Core Engine
 * Manages the high-performance ECS state using TypedArrays.
 * Driven by DataService estimates.
 */

const MAX_AGENTS_FULL = 5500000;
const SCALING_FACTOR_LOCAL = 0.01; 

export class SimulationEngine {
    constructor(isLightweight = true) {
        this.isLightweight = isLightweight;
        this.maxAgents = isLightweight ? Math.floor(MAX_AGENTS_FULL * SCALING_FACTOR_LOCAL) : MAX_AGENTS_FULL;
        this.agentCount = 0;

        this.buffer = new ArrayBuffer(this.maxAgents * 40); 
        this.x = new Float32Array(this.buffer, 0, this.maxAgents);
        this.y = new Float32Array(this.buffer, this.maxAgents * 4, this.maxAgents);
        this.age = new Uint8Array(this.buffer, this.maxAgents * 8, this.maxAgents);
        this.income = new Float32Array(this.buffer, this.maxAgents * 9, this.maxAgents);
        this.savings = new Float32Array(this.buffer, this.maxAgents * 13, this.maxAgents);
        this.health = new Uint8Array(this.buffer, this.maxAgents * 17, this.maxAgents);
        this.status = new Uint8Array(this.buffer, this.maxAgents * 18, this.maxAgents);
        this.education = new Uint8Array(this.buffer, this.maxAgents * 19, this.maxAgents);
        
        this.currentYear = 1800;
        this.eraName = "Suuriruhtinaskunta";
        this.taxRate = 0.05;
        this.benefitAmount = 0;
        this.stateTreasury = 100000;
        this.stateDebt = 0;
        this.monthlyRevenue = 0;
        this.monthlyExpenses = 0;
        this.avgAge = 0;
        this.tickCount = 0;
        this.isPaused = true;
        this.isHistoryMode = true;
        this.isFastMode = false;
        this.classCounts = { child: 0, low: 0, mid: 0, high: 0, pensioner: 0 };
        
        this.dataService = null;
    }

    setDataService(service) {
        this.dataService = service;
    }

    initPopulation(generator) {
        this.generator = generator;
        if (!this.dataService) return;
        const yearData = this.dataService.getYearData(this.currentYear);
        const targetPop = Math.floor(this.maxAgents * (yearData.total / 5600000));
        
        let totalAge = 0;
        for (let i = 0; i < targetPop; i++) {
            const data = generator(i, this.currentYear);
            this.x[i] = data.x; this.y[i] = data.y; this.age[i] = data.age;
            this.income[i] = data.income * yearData.gdp_per_capita_index; 
            this.status[i] = data.status;
            this.education[i] = data.education;
            totalAge += data.age;
        }
        this.agentCount = targetPop;
        this.avgAge = totalAge / (targetPop || 1);
    }

    tick() {
        if (this.isPaused) return 0;
        const start = performance.now();
        
        this.tickCount++;
        if (this.tickCount % 12 === 0) {
            this.currentYear++;
            this.updateEra();
        }

        let currentTaxRevenue = 0;
        let currentBenefitSpending = 0;
        let totalAge = 0;
        this.classCounts = { child: 0, low: 0, mid: 0, high: 0, pensioner: 0 };

        for (let i = 0; i < this.agentCount; i++) {
            if (this.tickCount % 12 === 0) {
                this.age[i]++;
                if (this.age[i] > (this.isHistoryMode ? 60 : 80) && Math.random() < 0.05) {
                    this.resetAgent(i); 
                }
            }
            totalAge += this.age[i];

            let monthlyIncome = this.income[i];
            if (this.age[i] < 20) {
                this.classCounts.child++;
            } else if (this.age[i] > 65) {
                this.classCounts.pensioner++;
                currentBenefitSpending += 1500;
            } else {
                if (this.status[i] === 1) {
                    const tax = monthlyIncome * this.taxRate;
                    currentTaxRevenue += tax;
                    if (monthlyIncome < 2000) this.classCounts.low++;
                    else if (monthlyIncome < 4500) this.classCounts.mid++;
                    else this.classCounts.high++;
                } else {
                    currentBenefitSpending += this.benefitAmount;
                    this.classCounts.low++;
                }
            }
        }

        this.avgAge = totalAge / (this.agentCount || 1);
        
        if (this.isHistoryMode && this.currentYear < 2024) {
            this.handleHistoryGrowth();
        } else if (this.currentYear >= 2024) {
            this.isHistoryMode = false;
        }

        this.monthlyRevenue = currentTaxRevenue * 100;
        this.monthlyExpenses = currentBenefitSpending * 100;
        const balance = this.monthlyRevenue - this.monthlyExpenses;
        
        if (balance < 0) {
            if (this.stateTreasury > 0) {
                this.stateTreasury += balance;
                if (this.stateTreasury < 0) {
                    this.stateDebt += Math.abs(this.stateTreasury);
                    this.stateTreasury = 0;
                }
            } else {
                this.stateDebt += Math.abs(balance);
            }
        } else {
            this.stateTreasury += balance;
            if (this.stateDebt > 0) {
                const payment = Math.min(this.stateDebt, this.stateTreasury * 0.1);
                this.stateDebt -= payment;
                this.stateTreasury -= payment;
            }
        }
        return performance.now() - start;
    }

    updateEra() {
        if (!this.dataService) return;
        const eraData = this.dataService.getEraData(this.currentYear);
        if (eraData) {
            this.eraName = eraData.name;
            this.currentEvent = eraData.event;
        }

        if (this.isHistoryMode && this.currentYear > 1950) {
            this.taxRate = Math.min(0.25, 0.05 + (this.currentYear - 1950) * 0.005);
            this.benefitAmount = Math.min(800, (this.currentYear - 1950) * 15);
        }
    }

    handleHistoryGrowth() {
        if (!this.dataService) return;
        const yearData = this.dataService.getYearData(this.currentYear);
        const targetCount = Math.floor(this.maxAgents * (yearData.total / 5600000));
        
        while (this.agentCount < targetCount && this.agentCount < this.maxAgents) {
            const i = this.agentCount;
            this.resetAgent(i);
            this.agentCount++;
        }
    }

    resetAgent(i) {
        if (!this.generator) return;
        const data = this.generator(i, this.currentYear);
        this.x[i] = data.x;
        this.y[i] = data.y;
        this.age[i] = data.age;
        this.income[i] = data.income;
        this.status[i] = data.status;
        this.education[i] = data.education;
        this.health[i] = 100;
    }
}
