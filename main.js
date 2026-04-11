document.addEventListener('DOMContentLoaded', () => {
    const generateBtn = document.getElementById('generate');
    const frequentBtn = document.getElementById('frequent');
    const numbersDisplay = document.getElementById('numbers');

    // Placeholder for historical data analysis (to be implemented)
    const historicalData = {
        '1': 50, '2': 45, '3': 55, '4': 60, '5': 40, '6': 65, '7': 70, '8': 35, '9': 75, '10': 80,
        '11': 30, '12': 85, '13': 90, '14': 25, '15': 95, '16': 20, '17': 100, '18': 15, '19': 105, '20': 10,
        '21': 110, '22': 5, '23': 115, '24': 1, '25': 120, '26': 4, '27': 125, '28': 3, '29': 130, '30': 2,
        '31': 135, '32': 6, '33': 140, '34': 7, '35': 145, '36': 8, '37': 150, '38': 9, '39': 155, '40': 11,
        '41': 160, '42': 12, '43': 165, '44': 13, '45': 170
    };

    function generateNumbers(useFrequency = false) {
        numbersDisplay.innerHTML = '';
        const numbers = new Set();

        if (useFrequency) {
            const sortedByFrequency = Object.keys(historicalData).sort((a, b) => historicalData[b] - historicalData[a]);
            while (numbers.size < 6) {
                const randomIndex = Math.floor(Math.random() * 10); // Top 10 most frequent
                numbers.add(parseInt(sortedByFrequency[randomIndex], 10));
            }
        } else {
            while (numbers.size < 6) {
                numbers.add(Math.floor(Math.random() * 45) + 1);
            }
        }

        Array.from(numbers).sort((a, b) => a - b).forEach(number => {
            const numberDiv = document.createElement('div');
            numberDiv.className = 'number';
            numberDiv.textContent = number;
            numbersDisplay.appendChild(numberDiv);
        });
    }

    generateBtn.addEventListener('click', () => generateNumbers(false));
    frequentBtn.addEventListener('click', () => generateNumbers(true));
});
