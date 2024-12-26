const container = document.querySelector('.container');
const search = document.querySelector('.search-box button');
const searchInput = document.querySelector('.search-box input');
const weatherBox = document.querySelector('.current-weather .weather-box');
const weatherDetails = document.querySelector('.current-weather .weather-details');
const error404 = document.querySelector('.not-found');
const forecastContainer = document.querySelector('.forecast-days');

// Tambahkan container untuk recommendation
const recommendationContainer = document.createElement('div');
recommendationContainer.classList.add('recommendation-container');
container.appendChild(recommendationContainer);

const APIKey = '932ca78dbf2c8570c89c99da74d04e96';

// Function to get day name
function getDayName(date) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
}

// Fungsi Recommendation dengan "Machine Learning" sederhana
function getWeatherRecommendation(weatherMain, temperature) {
    // Base recommendation categories
    const recommendations = {
        indoor: [
            "Read a book in a cozy corner",
            "Watch a movie marathon",
            "Try an indoor workout",
            "Cook a new recipe",
            "Start a home project"
        ],
        outdoor: [
            "Go for a walk in the park",
            "Have a picnic",
            "Ride a bicycle",
            "Go hiking",
            "Practice outdoor photography"
        ],
        rainy: [
            "Visit a museum",
            "Have a board game night",
            "Do some indoor gardening",
            "Learn a new skill online",
            "Organize your living space"
        ]
    };

    // Machine learning inspired logic dengan weighted recommendations
    let weightedRecommendations = [];

    // Temperature-based recommendations
    if (temperature < 10) {
        // Cold weather
        weightedRecommendations = [...recommendations.indoor, "Stay warm with hot beverages"];
    } else if (temperature >= 10 && temperature < 20) {
        // Mild weather
        weightedRecommendations = [...recommendations.indoor, ...recommendations.outdoor];
    } else {
        // Warm weather
        weightedRecommendations = [...recommendations.outdoor, "Stay hydrated"];
    }

    // Weather condition-based filtering
    switch (weatherMain) {
        case 'Rain':
            weightedRecommendations = recommendations.rainy;
            break;
        case 'Clear':
            weightedRecommendations = weightedRecommendations.filter(rec => 
                !rec.includes("Stay warm") && !rec.includes("Stay hydrated")
            );
            break;
        case 'Clouds':
            weightedRecommendations = weightedRecommendations.filter(rec => 
                !rec.includes("outdoor photography")
            );
            break;
    }

    // Simple "machine learning" scoring
    const scoredRecommendations = weightedRecommendations.map((rec, index) => ({
        recommendation: rec,
        score: weightedRecommendations.length - index
    })).sort((a, b) => b.score - a.score);

    return scoredRecommendations.slice(0, 3).map(item => item.recommendation);
}

// Function to update current weather
function updateCurrentWeather(data) {
    const image = document.querySelector('.weather-box img');
    const temperature = document.querySelector('.weather-box .temperature .value');
    const description = document.querySelector('.weather-box .description');
    const humiditySpan = document.querySelector('.weather-details .humidity span');
    const windSpan = document.querySelector('.weather-details .wind span');

    // Set weather icon
    switch (data.weather[0].main) {
        case 'Clear':
            image.src = 'images/clear.png';
            break;
        case 'Rain':
            image.src = 'images/rain.png';
            break;
        case 'Snow':
            image.src = 'images/snow.png';
            break;
        case 'Clouds':
            image.src = 'images/cloud.png';
            break;
        case 'Haze':
            image.src = 'images/mist.png';
            break;
        default:
            image.src = '';
    }

    const temp = parseInt(data.main.temp);
    temperature.innerHTML = `${temp}`;
    description.innerHTML = `${data.weather[0].description}`;
    humiditySpan.innerHTML = `${data.main.humidity}%`;
    windSpan.innerHTML = `${parseInt(data.wind.speed)} Km/h`;

    // Tambahkan recommendation generation
    const recommendations = getWeatherRecommendation(data.weather[0].main, temp);
    
    recommendationContainer.innerHTML = `
        <div class="recommendation-title">Today's Activity Recommendation</div>
        <ul class="recommendation-list">
            ${recommendations.map(rec => `<li>${rec}</li>`).join('')}
        </ul>
    `;
}

// Function to update forecast
function updateForecast(forecastData) {
    forecastContainer.innerHTML = ''; // Clear previous forecast

    forecastData.list.filter((reading, index) => 
        index % 8 === 0 // Get one reading per day (every 24 hours)
    ).slice(0, 7).forEach(reading => {
        const date = new Date(reading.dt * 1000);
        const dayDiv = document.createElement('div');
        dayDiv.classList.add('forecast-day');

        let weatherIcon = '';
        switch (reading.weather[0].main) {
            case 'Clear': weatherIcon = 'images/clear.png'; break;
            case 'Rain': weatherIcon = 'images/rain.png'; break;
            case 'Snow': weatherIcon = 'images/snow.png'; break;
            case 'Clouds': weatherIcon = 'images/cloud.png'; break;
            case 'Haze': weatherIcon = 'images/mist.png'; break;
            default: weatherIcon = '';
        }

        dayDiv.innerHTML = `
            <div class="day">${getDayName(date)}</div>
            <img src="${weatherIcon}" alt="${reading.weather[0].description}">
            <div class="temp">${parseInt(reading.main.temp)}°C</div>
            <div class="description">${reading.weather[0].description}</div>
        `;

        forecastContainer.appendChild(dayDiv);
    });
}

// Main fetch function
function fetchWeatherData(city) {
    // Current weather fetch
    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${APIKey}`)
        .then(response => response.json())
        .then(currentData => {
            if (currentData.cod === '404') {
                container.style.height = '400px';
                weatherBox.style.display = 'none';
                weatherDetails.style.display = 'none';
                error404.style.display = 'block';
                error404.classList.add('fadeIn');
                return;
            }

            error404.style.display = 'none';
            error404.classList.remove('fadeIn');

            // Update current weather
            updateCurrentWeather(currentData);

            // Forecast fetch
            return fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${APIKey}`);
        })
        .then(response => response.json())
        .then(forecastData => {
            updateForecast(forecastData);

            // Adjust container height
            container.style.height = '1000px'; // Ditambah untuk recommendation
            weatherBox.style.display = '';
            weatherDetails.style.display = '';
            weatherBox.classList.add('fadeIn');
            weatherDetails.classList.add('fadeIn');
        })
        .catch(error => {
            console.error('Error:', error);
            error404.style.display = 'block';
            error404.classList.add('fadeIn');
        });
}

// Event Listeners
search.addEventListener('click', () => {
    const city = searchInput.value;
    if (city === '') return;
    fetchWeatherData(city);
});

searchInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        const city = searchInput.value;
        if (city === '') return;
        fetchWeatherData(city);
    }
});