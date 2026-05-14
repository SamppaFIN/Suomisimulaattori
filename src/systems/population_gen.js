/**
 * SuomiSimulaattori 2.0 - Population Generator
 * Generates agents based on historical regional distributions.
 */

function gaussianRandom(mean, stdev) {
    let u = 1 - Math.random(), v = 1 - Math.random();
    let z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return z * stdev + mean;
}

export function createGenerator(dataService) {
    return function generateSim(index, year) {
        const regionalData = dataService.getRegionalShares(year);
        const yearData = dataService.getYearData(year);
        
        let x, y, isValid = false, attempts = 0;
        const rHotspot = Math.random();
        let h = null, cumulative = 0;
        
        for (let item of regionalData) {
            cumulative += item.share;
            if (rHotspot < cumulative) {
                h = item;
                break;
            }
        }

        while (!isValid && attempts < 50) {
            attempts++;
            if (h && Math.random() < 0.9) {
                x = gaussianRandom(h.x, h.radius * 0.6);
                y = gaussianRandom(h.y, h.radius * 0.6);
            } else {
                x = Math.random() * 600;
                y = Math.random() * 1200;
            }
            // Simple bound check (Finland mask would be better)
            if (x >= 0 && x <= 600 && y >= 0 && y <= 1200) isValid = true;
        }

        if (!isValid) { x = 300; y = 1100; } // Default Helsinki-ish

        // Age Distribution from year data
        let age;
        const r = Math.random();
        if (r < yearData.age_groups["0-14"]) age = Math.floor(Math.random() * 15);
        else if (r < yearData.age_groups["0-14"] + yearData.age_groups["15-64"]) age = Math.floor(Math.random() * 50) + 15;
        else age = Math.floor(Math.random() * 35) + 65;

        let education = Math.floor(Math.random() * 4);
        let status = age < 20 ? 0 : (age > 65 ? 3 : (Math.random() < 0.08 ? 2 : 1));
        
        let income = 0;
        if (status === 1) income = 2000 + (education * 1000) + Math.min(age - 20, 30) * 50 + Math.random() * 500;
        else if (status === 2) income = 800;
        else if (status === 3) income = 1500;

        return { x, y, age, income, status, education };
    };
}
