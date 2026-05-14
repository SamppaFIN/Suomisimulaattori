/**
 * SuomiSimulaattori 1.0 - Core Engine
 * Manages the high-performance ECS state using TypedArrays.
 */

const MAX_AGENTS_FULL = 5500000;
const SCALING_FACTOR_LOCAL = 0.01; // 1:100 scale for "Lightweight" mode

export class SimulationEngine {
    constructor(isLightweight = true) {
        this.isLightweight = isLightweight;
        this.maxAgents = isLightweight ? Math.floor(MAX_AGENTS_FULL * SCALING_FACTOR_LOCAL) : MAX_AGENTS_FULL;
        this.agentCount = 0;

        // Buffers for Shared memory (if needed) or standard TypedArrays
        // For now, using standard TypedArrays for simplicity
        this.buffer = new ArrayBuffer(this.maxAgents * 32); // 32 bytes per agent
        
        // Views into the buffer (Struct-of-Arrays pattern)
        this.x = new Float32Array(this.buffer, 0, this.maxAgents);
        this.y = new Float32Array(this.buffer, this.maxAgents * 4, this.maxAgents);
        this.age = new Uint8Array(this.buffer, this.maxAgents * 8, this.maxAgents);
        this.income = new Float32Array(this.buffer, this.maxAgents * 9, this.maxAgents);
        this.savings = new Float32Array(this.buffer, this.maxAgents * 13, this.maxAgents);
        this.health = new Uint8Array(this.buffer, this.maxAgents * 17, this.maxAgents);
        this.status = new Uint8Array(this.buffer, this.maxAgents * 18, this.maxAgents);
        this.education = new Uint8Array(this.buffer, this.maxAgents * 19, this.maxAgents);
        
        // Metadata
        this.tickCount = 0;
        this.isPaused = true;
    }

    initPopulation(generator) {
        console.log(`Initializing population of ${this.maxAgents} sims...`);
        for (let i = 0; i < this.maxAgents; i++) {
            const data = generator(i);
            this.x[i] = data.x;
            this.y[i] = data.y;
            this.age[i] = data.age;
            this.income[i] = data.income;
            this.savings[i] = data.savings;
            this.health[i] = data.health;
            this.status[i] = data.status;
            this.education[i] = data.education;
        }
        this.agentCount = this.maxAgents;
        console.log("Population initialized.");
    }

    tick() {
        if (this.isPaused) return;
        
        const startTime = performance.now();
        
        // TODO: Parallelize this via Workers
        this.updateAges();
        this.updateFinances();
        
        this.tickCount++;
        const duration = performance.now() - startTime;
        return duration;
    }

    updateAges() {
        for (let i = 0; i < this.agentCount; i++) {
            // Every 12 ticks = 1 year
            if (this.tickCount % 12 === 0) {
                this.age[i]++;
            }
        }
    }

    updateFinances() {
        // Mock finance update
        for (let i = 0; i < this.agentCount; i++) {
            if (this.status[i] === 1) { // Working
                this.savings[i] += this.income[i] * 0.1;
            }
        }
    }
}
