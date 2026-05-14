/**
 * SuomiSimulaattori 2.0 - Data Service
 * Loads and interpolates historical data estimates.
 */

export class DataService {
    constructor() {
        this.data = null;
    }

    async loadData() {
        try {
            const response = await fetch('data/statfi_estimates.json');
            this.data = await response.json();
            return this.data;
        } catch (error) {
            console.error("Failed to load historical data:", error);
            return null;
        }
    }

    getYearData(year) {
        if (!this.data) return null;
        const hist = this.data.historical_population;
        
        // Find interval
        let start = hist[0];
        let end = hist[hist.length - 1];
        
        for (let i = 0; i < hist.length - 1; i++) {
            if (year >= hist[i].year && year <= hist[i+1].year) {
                start = hist[i];
                end = hist[i+1];
                break;
            }
        }

        if (start === end) return start;

        const t = (year - start.year) / (end.year - start.year);
        
        return {
            year,
            total: Math.round(start.total + t * (end.total - start.total)),
            age_groups: {
                "0-14": start.age_groups["0-14"] + t * (end.age_groups["0-14"] - start.age_groups["0-14"]),
                "15-64": start.age_groups["15-64"] + t * (end.age_groups["15-64"] - start.age_groups["15-64"]),
                "65+": start.age_groups["65+"] + t * (end.age_groups["65+"] - start.age_groups["65+"])
            },
            gdp_per_capita_index: start.gdp_per_capita_index + t * (end.gdp_per_capita_index - start.gdp_per_capita_index)
        };
    }

    getRegionalShares(year) {
        if (!this.data) return [];
        return this.data.regional_distribution.map(city => {
            const keys = Object.keys(city.shares).map(Number).sort((a,b) => a-b);
            let startYear = keys[0];
            let endYear = keys[keys.length - 1];

            for (let i = 0; i < keys.length - 1; i++) {
                if (year >= keys[i] && year <= keys[i+1]) {
                    startYear = keys[i];
                    endYear = keys[i+1];
                    break;
                }
            }

            let share;
            if (startYear === endYear) {
                share = city.shares[startYear];
            } else {
                const t = (year - startYear) / (endYear - startYear);
                share = city.shares[startYear] + t * (city.shares[endYear] - city.shares[startYear]);
            }

            return { ...city, share };
        });
    }

    getEraData(year) {
        if (!this.data || !this.data.eras) return null;
        const eras = this.data.eras;
        let activeEra = eras[0];
        for (let era of eras) {
            if (year >= era.year) {
                activeEra = era;
            } else {
                break;
            }
        }
        return activeEra;
    }
}
