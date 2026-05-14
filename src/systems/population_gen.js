/**
 * SuomiSimulaattori 1.0 - Population Generator
 * Generates 5.5M agents based on Finnish demographics.
 */

export function generateSim(index) {
    let x, y;
    let isValid = false;
    let attempts = 0;

    // Generate coordinates within a Finland-like shape
    while (!isValid && attempts < 10) {
        attempts++;
        // Finland bounding box roughly: X [0, 400], Y [0, 1000]
        // (0,0) is top (North), (0, 1000) is bottom (South)
        // Wait, standard map: North is up (Y decrease), South is down (Y increase)
        // Let's use: Y 0 = Lapland, Y 1000 = Helsinki
        
        y = Math.random() * 1000;
        
        // Dynamic width based on Y to simulate Finland's shape
        let maxWidth = 200;
        if (y < 200) maxWidth = 100 + (y / 2); // North (Narrow)
        else if (y < 500) maxWidth = 200 + ((y-200) / 3); // Middle (Wide)
        else if (y < 800) maxWidth = 300 - ((y-500) / 2); // South-middle
        else maxWidth = 150; // South (Narrowing to Helsinki)

        x = (Math.random() - 0.5) * maxWidth + 200; // Center around 200

        // Population density: Bias towards the south (higher Y)
        const densityBias = Math.pow(y / 1000, 2); // Higher Y = much higher density
        if (Math.random() < densityBias + 0.1) {
            isValid = true;
        }
    }

    // Age Distribution (Roughly Finnish age pyramid)
    let age;
    const r = Math.random();
    if (r < 0.20) age = Math.floor(Math.random() * 20); // 0-19
    else if (r < 0.80) age = Math.floor(Math.random() * 45) + 20; // 20-64
    else age = Math.floor(Math.random() * 35) + 65; // 65-100

    // Education & Status
    let education = Math.floor(Math.random() * 4); // 0: None, 1: Basic, 2: Secondary, 3: Higher
    let status = 1; // Default working
    if (age < 20) status = 0; // Child
    else if (age > 65) status = 3; // Retired
    else if (Math.random() < 0.08) status = 2; // Unemployed

    // Finances (Base income based on education and age)
    let income = 0;
    if (status === 1) {
        const base = 2000 + (education * 1000);
        const exp = Math.min(age - 20, 30) * 50;
        income = base + exp + (Math.random() * 500);
    } else if (status === 2) {
        income = 800; // Unemployment benefit
    } else if (status === 3) {
        income = 1500; // Pension
    }

    return {
        x, y, age, income,
        savings: Math.random() * 5000 + (age * 100),
        health: 100 - Math.max(0, age - 50),
        status,
        education
    };
}
